(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FTCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 1;
          } else {
            quoted = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        quoted = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch !== "\r") {
        field += ch;
      }
    }

    if (field.length || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function clean(value) {
    return String(value ?? "").replace(/^\uFEFF/, "").trim();
  }

  function keyName(value) {
    return clean(value).replace(/[：:]$/, "").replace(/\s+/g, " ").toLowerCase();
  }

  function finiteNumber(value) {
    const normalized = clean(value).replace(/%$/, "");
    if (!normalized || /^(na|n\/a|null|nan|inf|-inf)$/i.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function parseTestTimeMs(value, label = "") {
    const text = clean(value);
    if (!text) return null;
    const match = text.replace(/,/g, "").match(/[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/);
    if (!match) return null;
    const number = Number(match[0]);
    if (!Number.isFinite(number) || number <= 0) return null;

    const unitText = `${clean(label)} ${text}`.toLowerCase();
    if (/(?:µs|μs|\bus\b|microseconds?)/i.test(unitText)) return number / 1000;
    if (/(?:\bms\b|msec|milliseconds?)/i.test(unitText)) return number;
    if (/(?:\(\s*s(?:ec)?\s*\)|\bseconds?\b|\bsec\b|\d\s*s\b)/i.test(unitText)) return number * 1000;
    return number;
  }

  function findTestTimeColumn(headers) {
    return headers.findIndex((header) => {
      const compact = keyName(header).replace(/[\s_-]+/g, "");
      return /^(?:testtime|elapsedtime)(?:\((?:ms|msec|s|sec|us|µs|μs)\))?$/.test(compact);
    });
  }

  function metadataTestTimeMs(metadata) {
    const candidates = [
      "test time",
      "elapsed time",
      "test time(ms)",
      "elapsed time(ms)",
      "test time(pass only)",
    ];
    for (const candidate of candidates) {
      const value = metadata[keyName(candidate)];
      const milliseconds = parseTestTimeMs(value, candidate);
      if (milliseconds !== null) return milliseconds;
    }
    return null;
  }

  function decodeZipFileName(bytes, useUtf8) {
    const preferred = useUtf8 ? "utf-8" : "gb18030";
    try {
      return new TextDecoder(preferred, { fatal: true }).decode(bytes);
    } catch (_) {
      return new TextDecoder("utf-8").decode(bytes);
    }
  }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("当前浏览器不支持 ZIP 解压，请升级 Edge/Chrome 后重试");
    }
    let stream;
    try {
      stream = new DecompressionStream("deflate-raw");
    } catch (_) {
      throw new Error("当前浏览器不支持 ZIP 的 Deflate 解压格式，请升级 Edge/Chrome 后重试");
    }
    const source = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(source).arrayBuffer());
  }

  async function extractZipEntries(arrayBuffer, zipName = "压缩包.zip", includeEntry = () => true) {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const minEocdSize = 22;
    const maxCommentSize = 65535;
    let eocdOffset = -1;
    const scanStart = Math.max(0, bytes.length - minEocdSize - maxCommentSize);
    for (let offset = bytes.length - minEocdSize; offset >= scanStart; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        eocdOffset = offset;
        break;
      }
    }
    if (eocdOffset < 0) throw new Error(`${zipName} 不是有效的 ZIP 文件或文件已损坏`);

    const diskNumber = view.getUint16(eocdOffset + 4, true);
    const centralDisk = view.getUint16(eocdOffset + 6, true);
    const entryCount = view.getUint16(eocdOffset + 10, true);
    const centralOffset = view.getUint32(eocdOffset + 16, true);
    if (diskNumber !== 0 || centralDisk !== 0) throw new Error(`${zipName} 是分卷 ZIP，暂不支持`);
    if (entryCount === 0xffff || centralOffset === 0xffffffff) throw new Error(`${zipName} 使用 ZIP64 格式，暂不支持`);
    if (entryCount > 2000) throw new Error(`${zipName} 内文件数超过 2000，已停止处理`);

    const entries = [];
    let totalUncompressed = 0;
    let cursor = centralOffset;
    for (let index = 0; index < entryCount; index += 1) {
      if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) {
        throw new Error(`${zipName} 的目录信息不完整或已损坏`);
      }
      const flags = view.getUint16(cursor + 8, true);
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const uncompressedSize = view.getUint32(cursor + 24, true);
      const fileNameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localHeaderOffset = view.getUint32(cursor + 42, true);
      const nameStart = cursor + 46;
      const nameEnd = nameStart + fileNameLength;
      if (nameEnd > bytes.length) throw new Error(`${zipName} 包含无效文件名记录`);
      const entryName = decodeZipFileName(bytes.subarray(nameStart, nameEnd), Boolean(flags & 0x0800)).replace(/\\/g, "/");
      cursor = nameEnd + extraLength + commentLength;

      if (entryName.endsWith("/") || !includeEntry(entryName)) continue;
      if (flags & 0x0001) throw new Error(`${entryName} 已加密，无法读取`);
      if (uncompressedSize > 256 * 1024 * 1024) throw new Error(`${entryName} 解压后超过 256 MB，已停止处理`);
      totalUncompressed += uncompressedSize;
      if (totalUncompressed > 512 * 1024 * 1024) throw new Error(`${zipName} 内 CSV 解压后总大小超过 512 MB，已停止处理`);
      if (localHeaderOffset + 30 > bytes.length || view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        throw new Error(`${entryName} 的本地文件头无效`);
      }
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const dataEnd = dataStart + compressedSize;
      if (dataEnd > bytes.length) throw new Error(`${entryName} 的压缩数据不完整`);
      const compressed = bytes.subarray(dataStart, dataEnd);
      let extracted;
      if (method === 0) extracted = compressed.slice();
      else if (method === 8) extracted = await inflateRaw(compressed);
      else throw new Error(`${entryName} 使用不支持的 ZIP 压缩算法（${method}）`);
      if (uncompressedSize !== extracted.length) throw new Error(`${entryName} 解压后大小校验失败`);
      entries.push({ name: entryName, bytes: extracted, size: extracted.length });
    }
    return entries;
  }

  function extractCsvEntriesFromZip(arrayBuffer, zipName = "压缩包.zip") {
    return extractZipEntries(arrayBuffer, zipName, (entryName) => entryName.toLowerCase().endsWith(".csv"));
  }

  function decodeXmlText(value) {
    return String(value || "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
      .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)));
  }

  function xmlTagText(xml, tagName) {
    const matches = Array.from(String(xml || "").matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "gi")));
    return decodeXmlText(matches.map((match) => match[1].replace(/<[^>]+>/g, "")).join(""));
  }

  function xlsxColumnIndex(reference) {
    const letters = String(reference || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "";
    let result = 0;
    for (const letter of letters) result = result * 26 + letter.charCodeAt(0) - 64;
    return Math.max(0, result - 1);
  }

  function parseXlsxSheet(xml, sharedStrings) {
    const rows = [];
    for (const rowMatch of String(xml || "").matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/gi)) {
      const row = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/gi)) {
        const attributes = cellMatch[1];
        const body = cellMatch[2];
        const reference = attributes.match(/\br="([^"]+)"/i)?.[1] || "";
        const type = attributes.match(/\bt="([^"]+)"/i)?.[1] || "";
        const index = xlsxColumnIndex(reference);
        const raw = xmlTagText(body, type === "inlineStr" ? "t" : "v");
        row[index] = type === "s" ? sharedStrings[Number(raw)] ?? "" : raw;
      }
      rows.push(row);
    }
    return rows;
  }

  function factoryHeaderIndex(headers, candidates) {
    const normalized = headers.map((value) => keyName(value).replace(/[\s_/-]+/g, ""));
    return candidates.map((value) => keyName(value).replace(/[\s_/-]+/g, ""))
      .map((candidate) => normalized.indexOf(candidate))
      .find((index) => index >= 0) ?? -1;
  }

  function parseFactoryYieldRows(rows, fileName = "工厂良率汇总.xlsx") {
    const headerIndex = rows.findIndex((row) => {
      const keys = row.map((value) => keyName(value).replace(/[\s_/-]+/g, ""));
      return keys.includes("测试投入") && keys.includes("测试产出") && keys.includes("测试良率");
    });
    if (headerIndex < 0) throw new Error("未找到包含测试投入、测试产出和测试良率的工厂汇总表头");
    const headers = rows[headerIndex];
    const indexes = {
      date: factoryHeaderIndex(headers, ["日期", "Date"]),
      customer: factoryHeaderIndex(headers, ["客户", "Customer"]),
      lot: factoryHeaderIndex(headers, ["子批号", "MES LotID", "Sub Lot Number", "批号"]),
      product: factoryHeaderIndex(headers, ["产品型号", "Product Model", "Device"]),
      customerLot: factoryHeaderIndex(headers, ["客户批号", "Customer Lot", "Cust LotID"]),
      input: factoryHeaderIndex(headers, ["测试投入", "Input"]),
      output: factoryHeaderIndex(headers, ["测试产出", "Output"]),
      yield: factoryHeaderIndex(headers, ["测试良率", "Yield"]),
      appearance: factoryHeaderIndex(headers, ["外观", "Appearance"]),
      electrical: factoryHeaderIndex(headers, ["电性", "Electrical"]),
      openShort: factoryHeaderIndex(headers, ["O/S", "OS", "Open Short"]),
    };
    const result = [];
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const input = finiteNumber(row[indexes.input]);
      const output = finiteNumber(row[indexes.output]);
      if (input === null || output === null) continue;
      const reportedYield = finiteNumber(row[indexes.yield]);
      result.push({
        source: fileName,
        rowNumber: rowIndex + 1,
        date: clean(row[indexes.date]),
        customer: clean(row[indexes.customer]),
        lot: clean(row[indexes.lot]),
        product: clean(row[indexes.product]),
        customerLot: clean(row[indexes.customerLot]),
        input,
        output,
        yield: reportedYield === null ? (input ? output / input : null) : (reportedYield > 1 ? reportedYield / 100 : reportedYield),
        appearance: finiteNumber(row[indexes.appearance]) || 0,
        electrical: finiteNumber(row[indexes.electrical]) || 0,
        openShort: finiteNumber(row[indexes.openShort]) || 0,
      });
    }
    if (!result.length) throw new Error("工厂汇总表中没有可用的数据行");
    return result;
  }

  async function parseFactoryYieldWorkbook(arrayBuffer, fileName = "工厂良率汇总.xlsx") {
    const entries = await extractZipEntries(arrayBuffer, fileName, (entryName) => /^(?:xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/i.test(entryName));
    const entryMap = new Map(entries.map((entry) => [entry.name.toLowerCase(), new TextDecoder("utf-8").decode(entry.bytes)]));
    const sharedXml = entryMap.get("xl/sharedstrings.xml") || "";
    const sharedStrings = Array.from(sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/gi)).map((match) => xmlTagText(match[1], "t"));
    const sheetEntry = entries
      .filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))[0];
    if (!sheetEntry) throw new Error("Excel 中没有可读取的工作表");
    const sheetXml = new TextDecoder("utf-8").decode(sheetEntry.bytes);
    return {
      id: `factory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: fileName,
      rows: parseFactoryYieldRows(parseXlsxSheet(sheetXml, sharedStrings), fileName),
    };
  }

  function findDescriptorRow(rows, headerIndex, label) {
    const wanted = keyName(label);
    for (let i = 0; i < headerIndex; i += 1) {
      const index = rows[i].findIndex((cell) => keyName(cell) === wanted);
      if (index >= 0) return { row: rows[i], labelIndex: index };
    }
    return null;
  }

  function valueAt(row, index) {
    return index >= 0 && index < row.length ? clean(row[index]) : "";
  }

  function stageFromFileName(fileName) {
    const matches = Array.from(String(fileName || "").matchAll(/(?:^|[_=\\/-])(FT\d*|RT\d*)(?=[_.=\\/-]|$)/gi));
    const stages = matches.map((match) => match[1].toUpperCase());
    return stages.find((stage) => stage.startsWith("RT")) || stages[0] || "";
  }

  function fileNameTimestamp(fileName) {
    const matches = Array.from(String(fileName || "").matchAll(/(?:19|20)\d{10}(?:\d{2})?/g));
    if (!matches.length) return null;
    const raw = matches[matches.length - 1][0];
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));
    const hour = Number(raw.slice(8, 10));
    const minute = Number(raw.slice(10, 12));
    const second = raw.length >= 14 ? Number(raw.slice(12, 14)) : 0;
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const valid = date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
      && date.getUTCHours() === hour
      && date.getUTCMinutes() === minute
      && date.getUTCSeconds() === second;
    if (!valid) return null;
    return {
      raw,
      key: raw.length >= 14 ? raw : `${raw}00`,
      label: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)} ${raw.slice(8, 10)}:${raw.slice(10, 12)}${raw.length >= 14 ? `:${raw.slice(12, 14)}` : ""}`,
    };
  }

  function inferStage(metadata, fileName) {
    const fileStage = stageFromFileName(fileName);
    if (fileStage) return fileStage;
    const custLot = metadata["cust lotid"] || "";
    const custMatch = custLot.match(/=([a-z]+\d*)$/i);
    if (custMatch) return custMatch[1].toUpperCase();
    return "FT";
  }

  function fileIdentity(metadata, fileName) {
    const stage = inferStage(metadata, fileName);
    const fileTime = fileNameTimestamp(fileName);
    const isRetest = stageFromFileName(fileName).startsWith("RT");
    return {
      stage,
      isRetest,
      testType: isRetest ? "复测" : "初测",
      fileTimeKey: fileTime?.key || "",
      fileTimeLabel: fileTime?.label || "",
    };
  }

  function sortFilesChronologically(files) {
    return files.slice().sort((a, b) => {
      const aKey = a.fileTimeKey || fileNameTimestamp(a.name)?.key || "";
      const bKey = b.fileTimeKey || fileNameTimestamp(b.name)?.key || "";
      if (aKey && bKey && aKey !== bKey) return aKey.localeCompare(bKey);
      if (aKey && !bKey) return -1;
      if (!aKey && bKey) return 1;
      return String(a.name || "").localeCompare(String(b.name || ""), "zh-CN");
    });
  }

  function summaryEntryName(fileName) {
    const parts = String(fileName || "").split(/\s+\/\s+/);
    return parts[parts.length - 1].replace(/\\/g, "/").split("/").pop() || "";
  }

  function summaryFamilyKey(fileName) {
    let stem = summaryEntryName(fileName)
      .replace(/\.csv$/i, "")
      .replace(/(?:[_-]summary|[._-]sum)$/i, "");
    stem = stem.replace(/[_-](?:19|20)\d{10,15}(?:[_-].*)?$/i, "");
    return keyName(stem).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function summaryDateKey(value) {
    const match = clean(value).match(
      /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
    );
    if (!match) return "";
    const parts = match.slice(1).map((part) => Number(part || 0));
    const [year, month, day, hour, minute, second] = parts;
    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return "";
    return [year, month, day, hour, minute, second]
      .map((part, index) => index ? String(part).padStart(2, "0") : String(part).padStart(4, "0"))
      .join("");
  }

  function summarySection(lines, headerPattern) {
    const headerIndex = lines.findIndex((line) => headerPattern.test(clean(line)));
    if (headerIndex < 0) return { header: "", lines: [] };
    const firstRule = lines.findIndex((line, index) => index > headerIndex && /^-{10,}$/.test(clean(line)));
    if (firstRule < 0) return { header: lines[headerIndex], lines: [] };
    const nextRule = lines.findIndex((line, index) => index > firstRule && /^-{10,}$/.test(clean(line)));
    return {
      header: lines[headerIndex],
      lines: lines.slice(firstRule + 1, nextRule < 0 ? lines.length : nextRule).filter((line) => clean(line)),
    };
  }

  function summaryPercent(value) {
    const text = clean(value);
    if (!text) return null;
    const number = finiteNumber(text);
    if (number === null) return null;
    return /%$/.test(text) ? number / 100 : number;
  }

  function isPowerTechSumReportText(text) {
    const rows = parseCsv(String(text || "").replace(/^\uFEFF/, ""));
    return rows.some((row) => keyName(row[0]) === "total(all sites)")
      && rows.some((row) => /^all site summary$/i.test(clean(row[0])))
      && rows.some((row) => /^software bin#$/i.test(clean(row[0])));
  }

  function isSummaryReportText(text, fileName = "") {
    const lines = String(text || "").split(/\r?\n/);
    const firstLine = clean(lines.find((line) => clean(line)) || "");
    if (/^summary report$/i.test(firstLine)) return true;
    const name = summaryEntryName(fileName).replace(/\.csv$/i, "");
    const summaryNamed = /(?:^|[._-])(?:summary|sum)(?=[._-]|$)/i.test(name);
    if (summaryNamed && isPowerTechSumReportText(text)) return true;
    return summaryNamed
      && lines.some((line) => /^SBin-HBin\s+Yield\b/i.test(clean(line)))
      && lines.some((line) => /^FailCount\s+Total\b/i.test(clean(line)));
  }

  function parsePowerTechSumReportText(text, fileName, fileId) {
    const rows = parseCsv(String(text || "").replace(/^\uFEFF/, ""));
    const metadata = {};
    const firstTotalIndex = rows.findIndex((row) => keyName(row[0]) === "total(all sites)");
    rows.slice(0, firstTotalIndex < 0 ? 0 : firstTotalIndex).forEach((row) => {
      const key = keyName(row[0]);
      const value = clean(row[1]);
      if (key && value) metadata[key] = value;
    });
    metadata["mes lotid"] = metadata["lot number"] || metadata["mes lotid"] || "";
    metadata["cust lotid"] = metadata.customer_lotid || metadata["cust lotid"] || "";
    metadata.tester = metadata["reporting station"] || metadata.tester || "";
    metadata["handler id"] = metadata["handler/prober id"] || metadata["handler id"] || "";
    metadata["prog name"] = metadata["test program name"] || metadata["program_name"] || metadata["prog name"] || "";
    metadata.device = metadata["test project name"] || metadata["family name"] || metadata.device || "";
    metadata["start time"] = metadata["create date"] || metadata["start time"] || "";

    const metricFor = (label) => {
      const row = rows.find((item) => keyName(item[0]) === label);
      return row ? clean(row[1]) : "";
    };
    const total = finiteNumber(metricFor("total(all sites)"));
    const pass = finiteNumber(metricFor("pass(all sites)"));
    const fail = finiteNumber(metricFor("fail(all sites)"));
    if (total === null || pass === null || fail === null) {
      throw new Error("PowerTECH SUM 汇总缺少 Total、Pass 或 Fail 数量");
    }
    const reportYield = summaryPercent(metricFor("yield(all sites)")) ?? (total ? pass / total : 0);

    const softwareHeaderIndex = rows.findIndex((row) => /^software bin#$/i.test(clean(row[0])));
    const softwareRows = [];
    for (let index = softwareHeaderIndex + 1; index > 0 && index < rows.length; index += 1) {
      const row = rows[index];
      if (!clean(row[0]) || /^hardware bin#$/i.test(clean(row[0])) || /^site\s+\d+\s+summary$/i.test(clean(row[0]))) break;
      const bin = finiteNumber(row[0]);
      const count = finiteNumber(row[3]);
      if (bin === null || count === null) continue;
      softwareRows.push({
        sbin: String(Math.trunc(bin)),
        hbin: "",
        yield: summaryPercent(row[4]),
        qa: null,
        total: count,
        siteCounts: [],
        reportedSbinTotal: null,
        description: clean(row[2]) || `SBIN ${Math.trunc(bin)}`,
        binType: clean(row[1]).toUpperCase(),
      });
    }
    const bins = softwareRows.map(({ binType, ...bin }) => bin);
    const failCounts = softwareRows
      .filter((bin) => bin.binType === "F")
      .map((bin) => ({ reason: bin.description, total: bin.total, qa: null, siteCounts: [] }));
    const testTimeMs = metadataTestTimeMs(metadata);
    const indexTimeMs = 150;
    const uph = testTimeMs !== null ? (3600 / (testTimeMs + indexTimeMs)) * 1000 : null;
    const dailyHours = 20;
    const utilization = 0.85;
    const dailyOutput = uph !== null ? uph * dailyHours * utilization : null;
    const binTotal = bins.reduce((sum, bin) => sum + (bin.total || 0), 0);
    const failCountTotal = failCounts.reduce((sum, item) => sum + item.total, 0);
    const identity = fileIdentity(metadata, fileName);
    const familyKey = summaryFamilyKey(fileName);
    const fingerprint = [familyKey, metadata["start time"] || "", metadata.tester || "", metadata["mes lotid"] || "", total, pass, fail].join("\u0000");

    return {
      id: fileId, name: fileName, kind: "summary", format: "PowerTECH SUM", ...identity, metadata, familyKey, fingerprint,
      startTimeKey: summaryDateKey(metadata["start time"]), endTimeKey: "", total, pass, fail, yield: reportYield,
      bins, failCounts, moduleTimes: [], testTimeMs, indexTimeMs, uph, dailyHours, utilization, dailyOutput,
      consistency: {
        passFailMatchesTotal: pass + fail === total,
        yieldMatchesCounts: total ? Math.abs(reportYield - (pass / total)) <= 0.000051 : reportYield === 0,
        binTotal, binMatchesTotal: !bins.length || binTotal === total,
        failCountTotal, failCountsMatchFail: !failCounts.length || failCountTotal === fail,
      },
    };
  }

  function parseSummaryReportText(text, fileName, fileId) {
    if (isPowerTechSumReportText(text)) return parsePowerTechSumReportText(text, fileName, fileId);
    if (!isSummaryReportText(text, fileName)) {
      throw new Error("未识别 Summary 汇总报表");
    }

    const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/);
    const metadata = {};
    lines.forEach((rawLine) => {
      const line = clean(rawLine);
      let match = line.match(/^Lot ID:\s*(.*)$/i);
      if (match) {
        metadata["mes lotid"] = clean(match[1]);
        metadata["cust lotid"] = clean(match[1]);
        return;
      }
      match = line.match(/^Operator:\s*(.*?)\s{2,}Terminal:\s*(.*)$/i);
      if (match) {
        metadata.operator = clean(match[1]);
        metadata["handler id"] = clean(match[2]);
        return;
      }
      match = line.match(/^Test Mode:\s*(.*?)\s{2,}Program:\s*(.*)$/i)
        || line.match(/^Program:\s*(.*?)\s{2,}Test Mode:\s*(.*)$/i);
      if (match) {
        const testModeFirst = /^Test Mode:/i.test(line);
        metadata.testcode = clean(match[testModeFirst ? 1 : 2]);
        metadata["prog name"] = clean(match[testModeFirst ? 2 : 1]);
        return;
      }
      match = line.match(/^Device:\s*(.*?)\s{2,}Wafer:\s*(.*?)(?:\s{2,}Tester_NO:\s*(.*))?$/i);
      if (match) {
        metadata.device = clean(match[1]);
        metadata["wafer id"] = clean(match[2]);
        if (clean(match[3])) metadata.tester = clean(match[3]);
        return;
      }
      match = line.match(/^Start:\s*(.*?)\s{2,}End:\s*(.*)$/i);
      if (match) {
        metadata["start time"] = clean(match[1]);
        metadata["end time"] = clean(match[2]);
        return;
      }
      match = line.match(/^Save path:\s*(.*)$/i);
      if (match) metadata["save path"] = clean(match[1]);
    });
    if (!metadata.tester) {
      const stationMatch = summaryEntryName(fileName).match(/^[^_]+_([^_]+)_/);
      metadata.tester = stationMatch ? stationMatch[1] : "";
    }

    const siteSection = summarySection(lines, /^Site\s+All\b/i);
    const siteHeaders = clean(siteSection.header).split(/\s+/);
    const allIndex = siteHeaders.findIndex((header) => keyName(header) === "all");
    const siteMetrics = {};
    siteSection.lines.forEach((line) => {
      const values = clean(line).split(/\s+/);
      const label = keyName(values[0]);
      if (!label) return;
      const value = values[allIndex >= 0 ? allIndex : 1];
      siteMetrics[label] = label === "yield" ? summaryPercent(value) : finiteNumber(value);
    });

    const binSection = summarySection(lines, /^SBin-HBin\s+Yield\b/i);
    const bins = binSection.lines.map((line) => {
      const match = line.match(/^\s*(\d+)\s*-\s*(\d+)\s+(\S+)\s+(.*)$/);
      if (!match) return null;
      const remainder = clean(match[4]).split(/\s+/);
      const counts = [];
      let descriptionIndex = remainder.length;
      for (let index = 0; index < remainder.length; index += 1) {
        const value = finiteNumber(remainder[index]);
        if (value === null) {
          descriptionIndex = index;
          break;
        }
        counts.push(value);
      }
      return {
        sbin: match[1],
        hbin: match[2],
        yield: summaryPercent(match[3]),
        qa: counts[0] ?? null,
        total: counts[1] ?? null,
        siteCounts: counts.slice(2, Math.max(2, counts.length - 1)),
        reportedSbinTotal: counts.length > 2 ? counts[counts.length - 1] : null,
        description: remainder.slice(descriptionIndex).join(" ") || `SBIN ${match[1]}`,
      };
    }).filter(Boolean);

    const moduleSection = summarySection(lines, /^Module\s+Test Time\b/i);
    const moduleTimes = [];
    moduleSection.lines.forEach((line) => {
      const match = line.match(/^(.*?)([-+]?(?:\d+(?:\.\d*)?|\.\d+))\s*s\b/i);
      if (match) {
        const seconds = Number(match[2]);
        if (Number.isFinite(seconds) && seconds > 0) {
          moduleTimes.push({
            name: clean(match[1]) || `Module ${moduleTimes.length + 1}`,
            seconds,
            milliseconds: seconds * 1000,
          });
        }
      } else if (/^\S{1,4}$/.test(clean(line)) && moduleTimes.length) {
        moduleTimes[moduleTimes.length - 1].name += clean(line);
      }
    });

    const failSection = summarySection(lines, /^FailCount\s+Total\b/i);
    const failCounts = failSection.lines.map((line) => {
      const match = line.match(/^(.+?)\s+(\d+)(?:\s+(\d+))?(.*)$/);
      if (!match) return null;
      const remaining = clean(match[4]).split(/\s+/).map(finiteNumber).filter((value) => value !== null);
      return {
        reason: clean(match[1]),
        total: Number(match[2]),
        qa: match[3] === undefined ? null : Number(match[3]),
        siteCounts: remaining,
      };
    }).filter(Boolean);

    const pass = siteMetrics.pass ?? bins.find((bin) => bin.sbin === "1")?.total ?? null;
    const total = siteMetrics.total ?? bins.reduce((sum, bin) => sum + (bin.total || 0), 0);
    const fail = siteMetrics.fail ?? (total !== null && pass !== null ? total - pass : null);
    if (total === null || pass === null || fail === null) {
      throw new Error("Summary 汇总报表缺少 Pass、Fail 或 Total 数量");
    }
    const reportYield = siteMetrics.yield ?? (total ? pass / total : 0);
    const testTimeMs = moduleTimes.length
      ? moduleTimes.reduce((sum, item) => sum + item.milliseconds, 0)
      : null;
    const indexTimeMs = 150;
    const uph = testTimeMs !== null ? (3600 / (testTimeMs + indexTimeMs)) * 1000 : null;
    const dailyHours = 20;
    const utilization = 0.85;
    const dailyOutput = uph !== null ? uph * dailyHours * utilization : null;
    const binTotal = bins.reduce((sum, bin) => sum + (bin.total || 0), 0);
    const failCountTotal = failCounts.reduce((sum, item) => sum + item.total, 0);
    const identity = fileIdentity(metadata, fileName);
    const familyKey = summaryFamilyKey(fileName);
    const fingerprint = [
      familyKey,
      metadata["start time"] || "",
      metadata["end time"] || "",
      metadata.tester || "",
      metadata["mes lotid"] || "",
      metadata.device || "",
      total,
      pass,
      fail,
    ].join("\u0000");

    return {
      id: fileId,
      name: fileName,
      kind: "summary",
      format: "Summary",
      ...identity,
      metadata,
      familyKey,
      fingerprint,
      startTimeKey: summaryDateKey(metadata["start time"]),
      endTimeKey: summaryDateKey(metadata["end time"]),
      total,
      pass,
      fail,
      yield: reportYield,
      bins,
      failCounts,
      moduleTimes,
      testTimeMs,
      indexTimeMs,
      uph,
      dailyHours,
      utilization,
      dailyOutput,
      consistency: {
        passFailMatchesTotal: pass + fail === total,
        yieldMatchesCounts: total ? Math.abs(reportYield - (pass / total)) <= 0.000051 : reportYield === 0,
        binTotal,
        binMatchesTotal: !bins.length || binTotal === total,
        failCountTotal,
        failCountsMatchFail: !failCounts.length || failCountTotal === fail,
      },
    };
  }

  function parseEtsRows(rows, fileName, fileId) {
    const headerIndex = rows.findIndex((row) => {
      const normalized = row.map(clean);
      return normalized[0] === "Date" && normalized.includes("HBIN") && normalized.includes("SBIN");
    });
    if (headerIndex < 0) throw new Error("未找到包含 Date、HBIN、SBIN 的数据表头");

    const metadata = {};
    for (let i = 0; i < headerIndex; i += 1) {
      const row = rows[i];
      if (clean(row[0]) && clean(row[1])) metadata[keyName(row[0])] = clean(row[1]);
    }

    const headers = rows[headerIndex].map(clean);
    const siteIndex = headers.indexOf("Site");
    const serialIndex = headers.indexOf("Serial");
    const hbinIndex = headers.indexOf("HBIN");
    const sbinIndex = headers.indexOf("SBIN");
    const testTimeIndex = findTestTimeColumn(headers);
    const dataStartIndex = sbinIndex + 1;
    if (siteIndex < 0 || serialIndex < 0 || hbinIndex < 0 || sbinIndex < 0) {
      throw new Error("CSV 缺少 Site、Serial、HBIN 或 SBIN 字段");
    }

    const numberRow = findDescriptorRow(rows, headerIndex, "Test Number");
    const hardBinRow = findDescriptorRow(rows, headerIndex, "Hard BIN");
    const conditionRow = findDescriptorRow(rows, headerIndex, "Condiction") || findDescriptorRow(rows, headerIndex, "Condition");
    const lowerRow = findDescriptorRow(rows, headerIndex, "Lower Limit");
    const upperRow = findDescriptorRow(rows, headerIndex, "Upper Limit");
    const unitRow = findDescriptorRow(rows, headerIndex, "Unit");

    function descriptorValue(descriptor, columnIndex) {
      if (!descriptor) return "";
      const offset = columnIndex - dataStartIndex;
      return valueAt(descriptor.row, descriptor.labelIndex + 1 + offset);
    }

    const tests = [];
    const testIndexByName = {};
    const testByNumber = {};
    for (let columnIndex = dataStartIndex; columnIndex < headers.length; columnIndex += 1) {
      const name = headers[columnIndex];
      if (!name) continue;
      const test = {
        name,
        columnIndex,
        valueIndex: tests.length,
        number: descriptorValue(numberRow, columnIndex) || String(tests.length + 1),
        hardBin: descriptorValue(hardBinRow, columnIndex),
        condition: descriptorValue(conditionRow, columnIndex),
        lower: finiteNumber(descriptorValue(lowerRow, columnIndex)),
        upper: finiteNumber(descriptorValue(upperRow, columnIndex)),
        unit: descriptorValue(unitRow, columnIndex),
      };
      tests.push(test);
      testIndexByName[test.name] = test.valueIndex;
      testByNumber[String(test.number)] = test;
    }

    const softBinMap = {};
    const softSummaryIndex = rows.findIndex((row) => keyName(row[0]) === "softbin total summary");
    if (softSummaryIndex >= 0) {
      for (let i = softSummaryIndex + 2; i < rows.length; i += 1) {
        const row = rows[i];
        const binNumber = clean(row[0]);
        if (!/^\d+$/.test(binNumber)) break;
        softBinMap[binNumber] = {
          name: clean(row[3]) || `SBIN ${binNumber}`,
          result: clean(row[4]).toUpperCase(),
          total: finiteNumber(row[1]),
        };
      }
    }

    const records = [];
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const firstCell = clean(row[0]);
      if (/summary:?$/i.test(firstCell)) break;
      if (!firstCell || !clean(row[siteIndex]) || !clean(row[hbinIndex]) || !clean(row[sbinIndex])) continue;

      const sbin = clean(row[sbinIndex]);
      const hbin = clean(row[hbinIndex]);
      if (!/^[-+]?\d+(?:\.\d+)?$/.test(sbin) || !/^[-+]?\d+(?:\.\d+)?$/.test(hbin)) continue;

      const binDefinition = softBinMap[sbin];
      const isPass = binDefinition ? binDefinition.result === "P" : Number(sbin) === 0;
      const test = isPass ? null : (testByNumber[sbin] || tests[Number(sbin) - 1] || null);
      const values = tests.map((item) => finiteNumber(row[item.columnIndex]));
      const measured = test ? values[test.valueIndex] : null;
      let direction = "unknown";
      if (test && measured !== null) {
        if (test.lower !== null && measured < test.lower) direction = "low";
        else if (test.upper !== null && measured > test.upper) direction = "high";
        else direction = "within";
      }

      records.push({
        fileId,
        rowNumber: rowIndex + 1,
        sequence: records.length + 1,
        date: firstCell,
        testTimeMs: parseTestTimeMs(row[testTimeIndex], headers[testTimeIndex]),
        site: clean(row[siteIndex]),
        serial: clean(row[serialIndex]),
        x: valueAt(row, headers.indexOf("X")),
        y: valueAt(row, headers.indexOf("Y")),
        hbin,
        sbin,
        isPass,
        failReason: isPass ? "" : (binDefinition?.name || test?.name || `SBIN ${sbin}`),
        failTestName: test?.name || "",
        failValue: measured,
        failLower: test?.lower ?? null,
        failUpper: test?.upper ?? null,
        failUnit: test?.unit || "",
        failDirection: direction,
        values,
      });
    }

    if (!records.length) throw new Error("找到了表头，但没有识别到有效测试记录");

    return {
      id: fileId,
      name: fileName,
      format: "ETS",
      ...fileIdentity(metadata, fileName),
      metadata,
      tests,
      testIndexByName,
      softBinMap,
      records,
    };
  }

  function firstMetadataValue(metadata, keys) {
    for (const key of keys) {
      const value = metadata[keyName(key)];
      if (value) return value;
    }
    return "";
  }

  function addPowerTechMetadataAliases(metadata) {
    const aliases = {
      "start time": ["Create Date"],
      device: ["PRODUCT_MODEL", "Family Name"],
      "mes lotid": ["Sub Lot Number", "Lot Number"],
      "cust lotid": ["CUSTOMER_LOTID"],
      "prog name": ["PROGRAM_NAME", "Test Program Name", "Test Project Name"],
      operator: ["Reporting Operator"],
      testcode: ["TEST_CODE", "Wafer ID"],
      tester: ["TESTER_ID", "Reporting Station"],
      "handler id": ["Handler/Prober ID"],
      "loadboard id": ["LB Offset"],
    };
    Object.entries(aliases).forEach(([alias, candidates]) => {
      if (!metadata[alias]) metadata[alias] = firstMetadataValue(metadata, candidates);
    });
  }

  function findColumnIndex(headers, candidates) {
    const wanted = new Set(candidates.map(keyName));
    return headers.findIndex((header) => wanted.has(keyName(header)));
  }

  function parsePowerTechRows(rows, fileName, fileId) {
    const headerIndex = rows.findIndex((row) => {
      const normalized = row.map(keyName);
      return normalized[0] === "site #" && normalized.includes("sbin") && normalized.includes("hbin");
    });
    if (headerIndex < 0) throw new Error("未找到 PowerTECH 测试数据表头");

    const testNameIndex = rows.slice(0, headerIndex).findIndex((row) => keyName(row[0]) === "test name");
    if (testNameIndex < 0) throw new Error("PowerTECH CSV 缺少 Test Name 定义行");

    const metadata = {};
    for (let i = 0; i < testNameIndex; i += 1) {
      const row = rows[i];
      if (clean(row[0]) && clean(row[1])) metadata[keyName(row[0])] = clean(row[1]);
    }
    addPowerTechMetadataAliases(metadata);

    const headers = rows[headerIndex].map(clean);
    const siteIndex = findColumnIndex(headers, ["Site #", "Site"]);
    const serialIndex = findColumnIndex(headers, ["Serial #", "Serial"]);
    const hbinIndex = findColumnIndex(headers, ["HBin", "HBIN"]);
    const sbinIndex = findColumnIndex(headers, ["SBin", "SBIN"]);
    const xIndex = findColumnIndex(headers, ["XCoord", "X"]);
    const yIndex = findColumnIndex(headers, ["YCoord", "Y"]);
    const testTimeIndex = findTestTimeColumn(headers);
    if (siteIndex < 0 || serialIndex < 0 || hbinIndex < 0 || sbinIndex < 0) {
      throw new Error("PowerTECH CSV 缺少 Site、Serial、HBin 或 SBin 字段");
    }

    const nameRow = rows[testNameIndex];
    const dataStartIndex = nameRow.findIndex((cell, index) => index > 0 && Boolean(clean(cell)));
    if (dataStartIndex < 0) throw new Error("PowerTECH CSV 的 Test Name 行没有测试项目");

    const numberRow = findDescriptorRow(rows, headerIndex, "Test Number");
    const lowerRow = findDescriptorRow(rows, headerIndex, "Lower Limit");
    const upperRow = findDescriptorRow(rows, headerIndex, "Upper Limit");
    const unitRow = findDescriptorRow(rows, headerIndex, "Units") || findDescriptorRow(rows, headerIndex, "Unit");

    const tests = [];
    const testIndexByName = {};
    const testByNumber = {};
    for (let columnIndex = dataStartIndex; columnIndex < nameRow.length; columnIndex += 1) {
      const name = clean(nameRow[columnIndex]);
      if (!name) continue;
      const test = {
        name,
        columnIndex,
        valueIndex: tests.length,
        number: clean(numberRow?.row[columnIndex]) || String(tests.length + 1),
        hardBin: "",
        condition: "",
        lower: finiteNumber(lowerRow?.row[columnIndex]),
        upper: finiteNumber(upperRow?.row[columnIndex]),
        unit: clean(unitRow?.row[columnIndex]),
      };
      tests.push(test);
      testIndexByName[test.name] = test.valueIndex;
      testByNumber[String(test.number)] = test;
    }

    const softBinMap = {
      "1": { name: "pass", result: "P", total: null },
    };
    tests.forEach((test) => {
      if (String(test.number) !== "1") {
        softBinMap[String(test.number)] = { name: test.name, result: "F", total: null };
      }
    });

    const reportTime = metadata["start time"] || "";
    const records = [];
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const site = clean(row[siteIndex]);
      const serial = clean(row[serialIndex]);
      const sbin = clean(row[sbinIndex]);
      const hbin = clean(row[hbinIndex]);
      if (!site && !serial && !sbin && !hbin) continue;
      if (!/^\d+$/.test(site) || !/^[-+]?\d+(?:\.\d+)?$/.test(sbin) || !/^[-+]?\d+(?:\.\d+)?$/.test(hbin)) continue;

      const isPass = sbin === "1";
      const binDefinition = softBinMap[sbin];
      const test = isPass ? null : (testByNumber[sbin] || null);
      const values = tests.map((item) => finiteNumber(row[item.columnIndex]));
      const measured = test ? values[test.valueIndex] : null;
      let direction = "unknown";
      if (test && measured !== null) {
        if (test.lower !== null && measured < test.lower) direction = "low";
        else if (test.upper !== null && measured > test.upper) direction = "high";
        else direction = "within";
      }

      records.push({
        fileId,
        rowNumber: rowIndex + 1,
        sequence: records.length + 1,
        date: reportTime,
        testTimeMs: parseTestTimeMs(row[testTimeIndex], headers[testTimeIndex]),
        site,
        serial,
        x: valueAt(row, xIndex),
        y: valueAt(row, yIndex),
        hbin,
        sbin,
        isPass,
        failReason: isPass ? "" : (binDefinition?.name || test?.name || `SBIN ${sbin}`),
        failTestName: test?.name || "",
        failValue: measured,
        failLower: test?.lower ?? null,
        failUpper: test?.upper ?? null,
        failUnit: test?.unit || "",
        failDirection: direction,
        values,
      });
    }

    if (!records.length) throw new Error("找到了 PowerTECH 表头，但没有识别到有效测试记录");

    return {
      id: fileId,
      name: fileName,
      format: "PowerTECH",
      ...fileIdentity(metadata, fileName),
      metadata,
      tests,
      testIndexByName,
      softBinMap,
      records,
    };
  }

  function findRowBySecondCell(rows, headerIndex, label) {
    const wanted = keyName(label);
    for (let index = 0; index < headerIndex; index += 1) {
      if (keyName(rows[index][1]) === wanted) return rows[index];
    }
    return null;
  }

  function parseAtxDatalogRows(rows, fileName, fileId) {
    const headerIndex = rows.findIndex((row) => {
      const normalized = row.map(keyName);
      return normalized[0] === "device#"
        && normalized.includes("pass fail")
        && normalized.includes("hard bin")
        && normalized.includes("soft bin");
    });
    if (headerIndex < 0) throw new Error("未找到 ATX Datalog 测试数据表头");

    const headers = rows[headerIndex].map(clean);
    const deviceIndex = findColumnIndex(headers, ["Device#", "Device #", "Serial", "Serial #"]);
    const siteIndex = findColumnIndex(headers, ["Site", "Site #"]);
    const xIndex = findColumnIndex(headers, ["X-coordinate", "X Coordinate", "XCoord", "X"]);
    const yIndex = findColumnIndex(headers, ["Y-coordinate", "Y Coordinate", "YCoord", "Y"]);
    const resultIndex = findColumnIndex(headers, ["Pass Fail", "Pass/Fail", "Result"]);
    const hbinIndex = findColumnIndex(headers, ["Hard Bin", "HBin", "HBIN"]);
    const sbinIndex = findColumnIndex(headers, ["Soft Bin", "SBin", "SBIN"]);
    const failNumberIndex = findColumnIndex(headers, ["Test Number", "Test No", "Test #"]);
    const testTimeIndex = findTestTimeColumn(headers);
    if (deviceIndex < 0 || resultIndex < 0 || hbinIndex < 0 || sbinIndex < 0 || failNumberIndex < 0) {
      throw new Error("ATX Datalog CSV 缺少 Device#、Pass Fail、Hard Bin、Soft Bin 或 Test Number 字段");
    }

    function descriptorRow(label) {
      const wanted = keyName(label);
      const end = Math.min(rows.length, headerIndex + 12);
      for (let index = headerIndex + 1; index < end; index += 1) {
        if (keyName(rows[index][failNumberIndex]) === wanted) return rows[index];
      }
      return null;
    }

    const nameRow = descriptorRow("Test Name");
    const unitRow = descriptorRow("Units") || descriptorRow("Unit");
    const lowerRow = descriptorRow("Lower Limit");
    const upperRow = descriptorRow("Upper Limit");
    if (!nameRow || !lowerRow || !upperRow) {
      throw new Error("ATX Datalog CSV 缺少 Test Name、Lower Limit 或 Upper Limit 定义行");
    }

    const metadata = {};
    for (let index = 0; index < headerIndex; index += 1) {
      const first = clean(rows[index][0]);
      if (!first) continue;
      const separator = first.indexOf(":");
      const label = separator >= 0 ? first.slice(0, separator) : first;
      const inlineValue = separator >= 0 ? first.slice(separator + 1) : "";
      const value = clean(inlineValue) || clean(rows[index][1]);
      if (label && value) metadata[keyName(label)] = value;
    }
    metadata.device = metadata.device || metadata["device name"] || "";
    metadata["mes lotid"] = metadata["mes lotid"] || metadata["wafer lot"] || metadata.sublot || "";
    metadata["cust lotid"] = metadata["cust lotid"] || metadata["wafer lot"] || metadata.sublot || "";
    metadata["prog name"] = metadata["prog name"] || metadata["job name"] || "";
    metadata.tester = metadata.tester || metadata["tester name"] || "";
    metadata.testcode = metadata.testcode || metadata["test mode"] || "";

    const dataStartIndex = failNumberIndex + 1;
    const rawNames = [];
    for (let columnIndex = dataStartIndex; columnIndex < nameRow.length; columnIndex += 1) {
      const rawName = clean(nameRow[columnIndex]);
      if (rawName) rawNames.push(rawName);
    }
    if (!rawNames.length) throw new Error("ATX Datalog CSV 的 Test Name 行没有测试项目");

    const nameTotals = rawNames.reduce((map, name) => {
      map[name] = (map[name] || 0) + 1;
      return map;
    }, {});
    const nameOccurrences = {};
    const tests = [];
    const testIndexByName = {};
    const testsByNumber = {};
    for (let columnIndex = dataStartIndex; columnIndex < nameRow.length; columnIndex += 1) {
      const rawName = clean(nameRow[columnIndex]);
      if (!rawName) continue;
      nameOccurrences[rawName] = (nameOccurrences[rawName] || 0) + 1;
      const name = nameTotals[rawName] > 1
        ? `${rawName} [${nameOccurrences[rawName]}]`
        : rawName;
      const number = clean(headers[columnIndex]) || String(tests.length + 1);
      const test = {
        name,
        rawName,
        columnIndex,
        valueIndex: tests.length,
        number,
        hardBin: "",
        condition: metadata["test mode"] || "",
        lower: finiteNumber(lowerRow[columnIndex]),
        upper: finiteNumber(upperRow[columnIndex]),
        unit: clean(unitRow?.[columnIndex]),
      };
      tests.push(test);
      testIndexByName[test.name] = test.valueIndex;
      if (!testsByNumber[number]) testsByNumber[number] = [];
      testsByNumber[number].push(test);
    }

    const softBinMap = {
      "1": { name: "pass", result: "P", total: null },
    };
    const reportTime = metadata["start time"] || "";
    const records = [];
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const serial = clean(row[deviceIndex]);
      const result = clean(row[resultIndex]).toLowerCase();
      const hbin = clean(row[hbinIndex]);
      const rawSbin = clean(row[sbinIndex]);
      const failNumber = clean(row[failNumberIndex]);
      if (!serial || /^#\s*of\b/i.test(serial) || keyName(serial) === "yield" || keyName(serial) === "end time") continue;

      const statusIsPass = result === "pass" || result === "p";
      const statusIsFail = result === "fail" || result === "f";
      if (!statusIsPass && !statusIsFail && !hbin && !rawSbin) continue;
      const isPass = statusIsPass || (!statusIsFail && (rawSbin === "1" || (!rawSbin && hbin === "1")));
      const sbin = rawSbin || (isPass ? "1" : hbin || failNumber || "F");
      const values = tests.map((item) => finiteNumber(row[item.columnIndex]));

      let test = null;
      let measured = null;
      let direction = "unknown";
      if (!isPass) {
        const outOfSpec = [];
        tests.forEach((item) => {
          const value = values[item.valueIndex];
          if (value === null) return;
          if (item.lower !== null && value < item.lower) {
            outOfSpec.push({ item, value, direction: "low" });
          } else if (item.upper !== null && value > item.upper) {
            outOfSpec.push({ item, value, direction: "high" });
          }
        });
        const numberedTests = testsByNumber[failNumber] || [];
        const numberedCause = outOfSpec.find((candidate) => numberedTests.includes(candidate.item));
        const cause = numberedCause
          || outOfSpec[0]
          || (numberedTests.length === 1 ? { item: numberedTests[0], value: values[numberedTests[0].valueIndex], direction: "unknown" } : null);
        if (cause) {
          test = cause.item;
          measured = cause.value;
          direction = cause.direction;
        }
      }

      if (!isPass && !softBinMap[sbin]) {
        softBinMap[sbin] = { name: test?.name || `SBIN ${sbin}`, result: "F", total: null };
      }
      records.push({
        fileId,
        rowNumber: rowIndex + 1,
        sequence: records.length + 1,
        date: reportTime,
        testTimeMs: parseTestTimeMs(row[testTimeIndex], headers[testTimeIndex]),
        site: valueAt(row, siteIndex) || metadata["site number"] || "",
        serial,
        x: valueAt(row, xIndex),
        y: valueAt(row, yIndex),
        hbin,
        sbin,
        isPass,
        failReason: isPass ? "" : (test?.name || (failNumber ? `Test ${failNumber}` : `SBIN ${sbin}`)),
        failTestName: test?.name || "",
        failValue: measured,
        failLower: test?.lower ?? null,
        failUpper: test?.upper ?? null,
        failUnit: test?.unit || "",
        failDirection: direction,
        values,
      });
    }

    if (!records.length) throw new Error("找到了 ATX Datalog 表头，但没有识别到有效测试记录");

    return {
      id: fileId,
      name: fileName,
      format: "ATX Datalog",
      ...fileIdentity(metadata, fileName),
      metadata,
      tests,
      testIndexByName,
      softBinMap,
      records,
    };
  }

  function parseDataLogMetadata(rows, itemIndex, fileName) {
    const metadata = {};
    let site = "";
    for (let index = 0; index < itemIndex; index += 1) {
      const line = String(rows[index][0] ?? "").trim();
      if (!line) continue;
      let match = line.match(/^Data Log Site\(([^)]+)\)/i);
      if (match) {
        site = clean(match[1]);
        continue;
      }
      match = line.match(/^Lot ID:\s*(.*)$/i);
      if (match) {
        metadata["mes lotid"] = clean(match[1]);
        metadata["cust lotid"] = clean(match[1]);
        continue;
      }
      match = line.match(/^Operator:\s*(.*?)\s{2,}Terminal:\s*(.*)$/i);
      if (match) {
        metadata.operator = clean(match[1]);
        metadata["handler id"] = clean(match[2]);
        continue;
      }
      match = line.match(/^Program:\s*(.*?)\s{2,}Test Mode:\s*(.*)$/i);
      if (match) {
        metadata["prog name"] = clean(match[1]);
        metadata.testcode = clean(match[2]);
        continue;
      }
      match = line.match(/^Device:\s*(.*?)\s{2,}Wafer:\s*(.*)$/i);
      if (match) {
        metadata.device = clean(match[1]);
        metadata["wafer id"] = clean(match[2]);
        continue;
      }
      match = line.match(/^Start:\s*(.*?)\s{2,}End:\s*(.*)$/i);
      if (match) {
        metadata["start time"] = clean(match[1]);
        metadata["end time"] = clean(match[2]);
        continue;
      }
      match = line.match(/^Test Time(?:\s*\(Pass Only\))?\s*:\s*(.*)$/i);
      if (match) {
        const key = /\(Pass Only\)/i.test(line) ? "test time(pass only)" : "test time";
        metadata[key] = clean(match[1]);
      }
    }
    const stationMatch = fileName.match(/^[^_]+_([^_]+)_/);
    metadata.tester = stationMatch ? stationMatch[1] : "";
    metadata.site = site;
    return { metadata, site: site || "1" };
  }

  function parseDataLogRows(rows, fileName, fileId) {
    const headerIndex = rows.findIndex((row) => (
      keyName(row[0]) === "x-y"
      && keyName(row[1]) === "sbin"
      && keyName(row[2]) === "testresult"
    ));
    if (headerIndex < 0) throw new Error("未找到 Data Log 测试数据表头");

    const itemIndex = rows.slice(0, headerIndex).findIndex((row) => keyName(row[1]) === "testitem");
    if (itemIndex < 0) throw new Error("Data Log CSV 缺少 TestItem 定义行");
    const itemRow = rows[itemIndex];
    const moduleRow = itemIndex > 0 ? rows[itemIndex - 1] : [];
    const highBinRow = findRowBySecondCell(rows, headerIndex, "HiFBin");
    const lowBinRow = findRowBySecondCell(rows, headerIndex, "LoFBin");
    const upperRow = findRowBySecondCell(rows, headerIndex, "LimitH");
    const lowerRow = findRowBySecondCell(rows, headerIndex, "LimitL");
    const unitRow = findRowBySecondCell(rows, headerIndex, "Unit");
    if (!upperRow || !lowerRow) throw new Error("Data Log CSV 缺少 LimitH 或 LimitL 定义行");

    const dataStartIndex = itemRow.findIndex((cell, index) => index > 1 && Boolean(clean(cell)));
    if (dataStartIndex < 0) throw new Error("Data Log CSV 的 TestItem 行没有测试项目");

    const tests = [];
    const testIndexByName = {};
    for (let columnIndex = dataStartIndex; columnIndex < itemRow.length; columnIndex += 1) {
      const name = clean(itemRow[columnIndex]);
      if (!name) continue;
      const highBin = clean(highBinRow?.[columnIndex]);
      const lowBin = clean(lowBinRow?.[columnIndex]);
      const test = {
        name,
        columnIndex,
        valueIndex: tests.length,
        number: String(tests.length + 1),
        hardBin: highBin || lowBin,
        highBin,
        lowBin,
        condition: clean(moduleRow?.[columnIndex]),
        lower: finiteNumber(lowerRow[columnIndex]),
        upper: finiteNumber(upperRow[columnIndex]),
        unit: clean(unitRow?.[columnIndex]),
      };
      tests.push(test);
      testIndexByName[test.name] = test.valueIndex;
    }

    const { metadata, site } = parseDataLogMetadata(rows, itemIndex, fileName);
    const testTimeIndex = findTestTimeColumn(rows[headerIndex]);
    const softBinMap = {
      "1": { name: "pass", result: "P", total: null },
    };
    const reportTime = metadata["start time"] || "";
    const records = [];
    for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const serial = clean(row[0]);
      const sbin = clean(row[1]);
      if (!serial && !sbin) continue;
      if (!/^\d+(?:-\d+)?$/.test(serial) || !/^\d+$/.test(sbin)) continue;

      const isPass = sbin === "1";
      const values = tests.map((item) => finiteNumber(row[item.columnIndex]));
      let test = null;
      let measured = null;
      let direction = "unknown";
      if (!isPass) {
        const matching = [];
        const anyOutOfSpec = [];
        tests.forEach((item) => {
          const value = values[item.valueIndex];
          if (value === null) return;
          if (item.lower !== null && value < item.lower) {
            const candidate = { item, value, direction: "low" };
            anyOutOfSpec.push(candidate);
            if (item.lowBin === sbin) matching.push(candidate);
          } else if (item.upper !== null && value > item.upper) {
            const candidate = { item, value, direction: "high" };
            anyOutOfSpec.push(candidate);
            if (item.highBin === sbin) matching.push(candidate);
          }
        });
        const cause = matching[0] || anyOutOfSpec[0] || null;
        if (cause) {
          test = cause.item;
          measured = cause.value;
          direction = cause.direction;
        }
      }

      records.push({
        fileId,
        rowNumber: rowIndex + 1,
        sequence: records.length + 1,
        date: reportTime,
        testTimeMs: parseTestTimeMs(row[testTimeIndex], rows[headerIndex][testTimeIndex]),
        site,
        serial,
        x: "",
        y: "",
        hbin: "",
        sbin,
        isPass,
        failReason: isPass ? "" : (test?.name || `SBIN ${sbin}`),
        failTestName: test?.name || "",
        failValue: measured,
        failLower: test?.lower ?? null,
        failUpper: test?.upper ?? null,
        failUnit: test?.unit || "",
        failDirection: direction,
        values,
      });
    }

    if (!records.length) throw new Error("找到了 Data Log 表头，但没有识别到有效测试记录");

    return {
      id: fileId,
      name: fileName,
      format: "DataLog",
      ...fileIdentity(metadata, fileName),
      metadata,
      tests,
      testIndexByName,
      softBinMap,
      records,
    };
  }

  function parseFtFileText(text, fileName, fileId) {
    const rows = parseCsv(text);
    const isEts = rows.some((row) => {
      const normalized = row.map(clean);
      return normalized[0] === "Date" && normalized.includes("HBIN") && normalized.includes("SBIN");
    });
    if (isEts) return parseEtsRows(rows, fileName, fileId);

    const isPowerTech = rows.some((row) => {
      const normalized = row.map(keyName);
      return normalized[0] === "site #" && normalized.includes("sbin") && normalized.includes("hbin");
    });
    if (isPowerTech) return parsePowerTechRows(rows, fileName, fileId);

    const isAtxDatalog = rows.some((row) => {
      const normalized = row.map(keyName);
      return normalized[0] === "device#"
        && normalized.includes("pass fail")
        && normalized.includes("hard bin")
        && normalized.includes("soft bin");
    });
    if (isAtxDatalog) return parseAtxDatalogRows(rows, fileName, fileId);

    const isDataLog = rows.some((row) => (
      keyName(row[0]) === "x-y"
      && keyName(row[1]) === "sbin"
      && keyName(row[2]) === "testresult"
    ));
    if (isDataLog) return parseDataLogRows(rows, fileName, fileId);

    throw new Error("未识别 CSV 格式：目前支持 ETS、PowerTECH、DataLog 与 ATX Datalog 测试报表");
  }

  function metadataValue(file, key) {
    return file.metadata[keyName(key)] || "";
  }

  function selectFiles(files, filterId) {
    const selected = filterId === "all" ? files.slice() : files.filter((file) => file.id === filterId);
    return sortFilesChronologically(selected);
  }

  function getValue(file, record, testName) {
    const index = file.testIndexByName[testName];
    return index === undefined ? null : record.values[index];
  }

  function buildFailStats(failRecords, totalCount) {
    const groups = new Map();
    failRecords.forEach((record) => {
      const reason = record.failReason || `SBIN ${record.sbin}`;
      if (!groups.has(reason)) {
        groups.set(reason, { reason, count: 0, low: 0, high: 0, within: 0, unknown: 0, records: [] });
      }
      const item = groups.get(reason);
      item.count += 1;
      item.records.push(record);
      if (record.failDirection === "low") item.low += 1;
      else if (record.failDirection === "high") item.high += 1;
      else if (record.failDirection === "within") item.within += 1;
      else item.unknown += 1;
    });

    const failTotal = failRecords.length;
    return Array.from(groups.values())
      .map((item) => ({
        ...item,
        failShare: failTotal ? item.count / failTotal : 0,
        totalShare: totalCount ? item.count / totalCount : 0,
      }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  }

  function calculateStability(selectedFiles, passRecords) {
    const fileMap = new Map(selectedFiles.map((file) => [file.id, file]));
    const catalog = new Map();
    selectedFiles.forEach((file) => {
      file.tests.forEach((test) => {
        if (!catalog.has(test.name)) catalog.set(test.name, { ...test, specVariant: false });
        else {
          const existing = catalog.get(test.name);
          if (existing.lower !== test.lower || existing.upper !== test.upper || existing.unit !== test.unit) existing.specVariant = true;
        }
      });
    });

    const result = [];
    catalog.forEach((test, name) => {
      let n = 0;
      let mean = 0;
      let m2 = 0;
      let min = Infinity;
      let max = -Infinity;
      passRecords.forEach((record) => {
        const file = fileMap.get(record.fileId);
        const value = file ? getValue(file, record, name) : null;
        if (value === null) return;
        n += 1;
        const delta = value - mean;
        mean += delta / n;
        m2 += delta * (value - mean);
        min = Math.min(min, value);
        max = Math.max(max, value);
      });

      const std = n > 1 ? Math.sqrt(m2 / (n - 1)) : null;
      let ppk = null;
      if (std !== null && std > 0) {
        const sides = [];
        if (test.upper !== null) sides.push((test.upper - mean) / (3 * std));
        if (test.lower !== null) sides.push((mean - test.lower) / (3 * std));
        if (sides.length) ppk = Math.min(...sides);
      } else if (std === 0 && n > 1) {
        const inSpec = (test.lower === null || mean >= test.lower) && (test.upper === null || mean <= test.upper);
        ppk = inSpec ? Infinity : -Infinity;
      }

      const specWidth = test.lower !== null && test.upper !== null ? test.upper - test.lower : null;
      const utilization = specWidth && std !== null ? (6 * std) / specWidth : null;
      const midpoint = specWidth ? (test.lower + test.upper) / 2 : null;
      const centerOffset = specWidth ? Math.abs(mean - midpoint) / (specWidth / 2) : null;
      let status = "insufficient";
      if (n >= 30 && ppk !== null) {
        if (ppk >= 1.33) status = "stable";
        else if (ppk >= 1) status = "watch";
        else status = "risk";
      }

      result.push({
        ...test,
        name,
        n,
        mean: n ? mean : null,
        std,
        min: n ? min : null,
        max: n ? max : null,
        ppk,
        utilization,
        centerOffset,
        status,
      });
    });

    const statusRank = { risk: 0, watch: 1, stable: 2, insufficient: 3 };
    return result.sort((a, b) => {
      const rankDiff = statusRank[a.status] - statusRank[b.status];
      if (rankDiff) return rankDiff;
      const ap = a.ppk === null ? Infinity : a.ppk;
      const bp = b.ppk === null ? Infinity : b.ppk;
      return ap - bp || a.name.localeCompare(b.name);
    });
  }

  function buildYieldTrend(records) {
    if (!records.length) return [];
    const targetSegments = Math.min(48, Math.max(8, Math.round(Math.sqrt(records.length))));
    const blockSize = Math.max(1, Math.ceil(records.length / targetSegments));
    const blocks = [];
    for (let start = 0; start < records.length; start += blockSize) {
      const chunk = records.slice(start, start + blockSize);
      const pass = chunk.reduce((sum, record) => sum + (record.isPass ? 1 : 0), 0);
      blocks.push({
        start: start + 1,
        end: start + chunk.length,
        count: chunk.length,
        pass,
        fail: chunk.length - pass,
        yield: pass / chunk.length,
      });
    }
    return blocks;
  }

  function calculateCapacityMetrics(selectedFiles) {
    const indexTimeMs = 150;
    const dailyHours = 20;
    const utilization = 0.85;
    let weightedTimeTotal = 0;
    let sampleCount = 0;
    let usedRecordTimes = false;
    let usedMetadataTimes = false;

    selectedFiles.forEach((file) => {
      const recordTimes = file.records
        .map((record) => record.testTimeMs)
        .filter((value) => Number.isFinite(value) && value > 0);
      if (recordTimes.length) {
        weightedTimeTotal += recordTimes.reduce((sum, value) => sum + value, 0);
        sampleCount += recordTimes.length;
        usedRecordTimes = true;
        return;
      }

      const fileTimeMs = metadataTestTimeMs(file.metadata);
      if (fileTimeMs !== null) {
        const weight = Math.max(1, file.records.length);
        weightedTimeTotal += fileTimeMs * weight;
        sampleCount += weight;
        usedMetadataTimes = true;
      }
    });

    const testTimeMs = sampleCount ? weightedTimeTotal / sampleCount : null;
    const uph = testTimeMs !== null ? (3600 / (testTimeMs + indexTimeMs)) * 1000 : null;
    const dailyOutput = uph !== null ? uph * dailyHours * utilization : null;
    return {
      testTimeMs,
      testTimeSampleCount: sampleCount,
      testTimeCoverage: selectedFiles.reduce((sum, file) => sum + file.records.length, 0)
        ? sampleCount / selectedFiles.reduce((sum, file) => sum + file.records.length, 0)
        : 0,
      testTimeSource: usedRecordTimes && usedMetadataTimes
        ? "mixed"
        : usedRecordTimes
          ? "records"
          : usedMetadataTimes
            ? "metadata"
            : "",
      indexTimeMs,
      uph,
      dailyHours,
      utilization,
      dailyOutput,
    };
  }

  function summaryMatchesFile(summary, file) {
    if (!summary || !file) return false;
    const sameArchive = summary.sourceArchive
      && file.sourceArchive
      && summary.sourceArchive === file.sourceArchive;

    const familyMatches = summary.familyKey
      && summary.familyKey === summaryFamilyKey(file.name);
    const detailStartKey = summaryDateKey(metadataValue(file, "Start Time"));
    const fileTimeKey = detailStartKey || file.fileTimeKey || fileNameTimestamp(file.name)?.key || "";
    const withinTimeRange = !fileTimeKey
      || !summary.startTimeKey
      || !summary.endTimeKey
      || (fileTimeKey >= summary.startTimeKey && fileTimeKey < summary.endTimeKey);
    if (sameArchive) return withinTimeRange;
    if (familyMatches) return withinTimeRange;

    const same = (summaryKey, fileKey) => {
      const left = keyName(metadataValue(summary, summaryKey));
      const right = keyName(metadataValue(file, fileKey || summaryKey));
      return Boolean(left && right && left === right);
    };
    const metadataScore = (same("MES LotID") ? 20 : 0)
      + (same("Device") ? 12 : 0)
      + (same("Tester") ? 10 : 0)
      + (same("Prog Name") ? 10 : 0);
    return withinTimeRange && metadataScore >= 42;
  }

  function summaryFailDifferences(summary, detailAnalysis) {
    const reported = new Map(
      summary.failCounts
        .filter((item) => item.total > 0)
        .map((item) => [keyName(item.reason), { reason: item.reason, count: item.total }]),
    );
    const calculated = new Map(
      detailAnalysis.failStats
        .filter((item) => item.count > 0)
        .map((item) => [keyName(item.reason), { reason: item.reason, count: item.count }]),
    );
    const keys = new Set([...reported.keys(), ...calculated.keys()]);
    const differences = [];
    keys.forEach((key) => {
      const reportItem = reported.get(key);
      const detailItem = calculated.get(key);
      const reportedCount = reportItem?.count || 0;
      const detailCount = detailItem?.count || 0;
      if (reportedCount !== detailCount) {
        differences.push({
          reason: reportItem?.reason || detailItem?.reason || key,
          reported: reportedCount,
          detail: detailCount,
          delta: detailCount - reportedCount,
        });
      }
    });
    return differences.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.reason.localeCompare(b.reason));
  }

  function auditSummaryReports(summaryReports, detailFiles) {
    return sortFilesChronologically(summaryReports).map((summary) => {
      const matchedFiles = detailFiles.filter((file) => summaryMatchesFile(summary, file));
      if (!matchedFiles.length) {
        return {
          summary,
          matchedFiles: [],
          detail: null,
          status: "summary-only",
          totalDelta: null,
          passDelta: null,
          failDelta: null,
          yieldDelta: null,
          failDifferences: [],
          failCountsMatch: null,
        };
      }
      const records = matchedFiles.flatMap((file) => file.records);
      const pass = records.reduce((sum, record) => sum + (record.isPass ? 1 : 0), 0);
      const fail = records.length - pass;
      const detail = {
        total: records.length,
        pass,
        fail,
        yield: records.length ? pass / records.length : 0,
        failStats: buildFailStats(records.filter((record) => !record.isPass), records.length),
      };
      const totalDelta = detail.total - summary.total;
      const passDelta = detail.pass - summary.pass;
      const failDelta = detail.fail - summary.fail;
      const yieldDelta = detail.yield - summary.yield;
      const failDifferences = summaryFailDifferences(summary, detail);
      const failCountsMatch = !summary.failCounts.length || !failDifferences.length;
      const countsMatch = totalDelta === 0 && passDelta === 0 && failDelta === 0;
      const yieldMatches = Math.abs(yieldDelta) <= 0.000051;
      const internalMatches = summary.consistency.passFailMatchesTotal
        && summary.consistency.yieldMatchesCounts
        && summary.consistency.binMatchesTotal
        && summary.consistency.failCountsMatchFail;
      return {
        summary,
        matchedFiles,
        detail,
        status: countsMatch && yieldMatches && failCountsMatch && internalMatches ? "matched" : "mismatch",
        totalDelta,
        passDelta,
        failDelta,
        yieldDelta,
        failDifferences,
        failCountsMatch,
      };
    });
  }

  function aggregateSummaryReports(summaryReports) {
    const uniqueMap = new Map();
    summaryReports.forEach((summary) => {
      if (!uniqueMap.has(summary.fingerprint)) uniqueMap.set(summary.fingerprint, summary);
    });
    const reports = sortFilesChronologically(Array.from(uniqueMap.values()));
    const total = reports.reduce((sum, report) => sum + report.total, 0);
    const pass = reports.reduce((sum, report) => sum + report.pass, 0);
    const fail = reports.reduce((sum, report) => sum + report.fail, 0);
    const failMap = new Map();
    const binMap = new Map();
    reports.forEach((report) => {
      report.failCounts.forEach((item) => {
        const key = keyName(item.reason);
        if (!failMap.has(key)) failMap.set(key, { reason: item.reason, count: 0 });
        failMap.get(key).count += item.total;
      });
      report.bins.forEach((item) => {
        const key = `${item.sbin}\u0000${item.hbin}\u0000${keyName(item.description)}`;
        if (!binMap.has(key)) {
          binMap.set(key, {
            sbin: item.sbin,
            hbin: item.hbin,
            description: item.description,
            count: 0,
          });
        }
        binMap.get(key).count += item.total || 0;
      });
    });
    const failStats = Array.from(failMap.values())
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        low: 0,
        high: 0,
        within: 0,
        unknown: item.count,
        failShare: fail ? item.count / fail : 0,
        totalShare: total ? item.count / total : 0,
        source: "summary",
      }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
    const bins = Array.from(binMap.values())
      .map((item) => ({ ...item, share: total ? item.count / total : 0 }))
      .sort((a, b) => Number(a.sbin) - Number(b.sbin) || a.description.localeCompare(b.description));
    let weightedTestTime = 0;
    let testTimeWeight = 0;
    reports.forEach((report) => {
      if (report.testTimeMs === null) return;
      const weight = Math.max(1, report.total);
      weightedTestTime += report.testTimeMs * weight;
      testTimeWeight += weight;
    });
    const testTimeMs = testTimeWeight ? weightedTestTime / testTimeWeight : null;
    const indexTimeMs = 150;
    const uph = testTimeMs !== null ? (3600 / (testTimeMs + indexTimeMs)) * 1000 : null;
    const dailyHours = 20;
    const utilization = 0.85;
    const dailyOutput = uph !== null ? uph * dailyHours * utilization : null;
    return {
      reports,
      reportCount: summaryReports.length,
      uniqueReportCount: reports.length,
      duplicateCount: summaryReports.length - reports.length,
      total,
      pass,
      fail,
      yield: total ? pass / total : 0,
      bins,
      failStats,
      testTimeMs,
      indexTimeMs,
      uph,
      dailyHours,
      utilization,
      dailyOutput,
    };
  }

  function summarizeSummaryReport(summary) {
    const topFail = summary.failCounts
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)[0];
    return {
      id: summary.id,
      name: summary.name,
      kind: "summary",
      format: "Summary",
      stage: summary.stage,
      isRetest: Boolean(summary.isRetest),
      testType: "汇总报告",
      fileTimeKey: summary.fileTimeKey || "",
      fileTimeLabel: summary.fileTimeLabel || "",
      device: metadataValue(summary, "Device"),
      lot: metadataValue(summary, "MES LotID"),
      program: metadataValue(summary, "Prog Name"),
      tester: metadataValue(summary, "Tester"),
      handler: metadataValue(summary, "Handler ID"),
      startTime: metadataValue(summary, "Start Time"),
      total: summary.total,
      pass: summary.pass,
      fail: summary.fail,
      yield: summary.yield,
      topFail: topFail?.reason || "—",
      testTimeMs: summary.testTimeMs,
      uph: summary.uph,
      dailyOutput: summary.dailyOutput,
    };
  }

  function summarizeFile(file) {
    const pass = file.records.filter((record) => record.isPass).length;
    const fail = file.records.length - pass;
    const failStats = buildFailStats(file.records.filter((record) => !record.isPass), file.records.length);
    const capacity = calculateCapacityMetrics([file]);
    return {
      id: file.id,
      name: file.name,
      format: file.format || "未知",
      stage: file.stage,
      isRetest: Boolean(file.isRetest),
      testType: file.testType || (file.isRetest ? "复测" : "初测"),
      fileTimeKey: file.fileTimeKey || "",
      fileTimeLabel: file.fileTimeLabel || "",
      device: metadataValue(file, "Device"),
      lot: metadataValue(file, "MES LotID"),
      custLot: metadataValue(file, "Cust LotID"),
      program: metadataValue(file, "Prog Name"),
      tester: metadataValue(file, "Tester"),
      handler: metadataValue(file, "Handler ID") || metadataValue(file, "Hand ID"),
      startTime: metadataValue(file, "Start Time"),
      total: file.records.length,
      pass,
      fail,
      yield: file.records.length ? pass / file.records.length : 0,
      topFail: failStats[0]?.reason || "—",
      testTimeMs: capacity.testTimeMs,
      uph: capacity.uph,
      dailyOutput: capacity.dailyOutput,
    };
  }

  function factoryFileRole(file) {
    if (file?.kind === "summary" || file?.format === "Summary") return "summary";
    const name = String(file?.name || "").replace(/\\/g, "/").split("/").pop() || "";
    if (/(?:^|[_.-])QA(?:[_.-]|$)/i.test(name)) return "qa";
    if (file?.isRetest || String(file?.stage || "").toUpperCase().startsWith("RT")) return "retest";
    if (/(?:^|[_.-])BIN\d+(?:[_.-]|$)/i.test(name)) return "disposition";
    return "initial";
  }

  function factoryRecordCategory(record) {
    const hbin = clean(record?.hbin);
    if (hbin === "1") return "mainPass";
    if (hbin === "8") return "hbin8";
    if (hbin === "3") return "electrical";
    if (hbin === "5") return "openShort";
    if (hbin) return "other";
    return record?.isPass ? "mainPass" : "other";
  }

  function classifyFactoryRecords(records) {
    const result = {
      total: records.length,
      mainPass: 0,
      hbin8: 0,
      electrical: 0,
      openShort: 0,
      other: 0,
      missingHbin: 0,
    };
    records.forEach((record) => {
      if (!clean(record?.hbin)) result.missingHbin += 1;
      result[factoryRecordCategory(record)] += 1;
    });
    result.nonMain = result.total - result.mainPass;
    result.yield = result.total ? result.mainPass / result.total : null;
    result.closed = result.total === result.mainPass + result.hbin8
      + result.electrical + result.openShort + result.other;
    return result;
  }

  function analyzeFactory(files, filterId = "all") {
    const selectedFiles = selectFiles(files, filterId);
    const roleGroups = {
      initial: [],
      retest: [],
      qa: [],
      disposition: [],
    };
    selectedFiles.forEach((file) => {
      const role = factoryFileRole(file);
      if (roleGroups[role]) roleGroups[role].push(file);
    });
    const recordsFor = (items) => items.flatMap((file) => file.records || []);
    const initial = classifyFactoryRecords(recordsFor(roleGroups.initial));
    const retest = classifyFactoryRecords(recordsFor(roleGroups.retest));
    const disposition = classifyFactoryRecords(recordsFor(roleGroups.disposition));
    const qa = classifyFactoryRecords(recordsFor(roleGroups.qa));
    const includedFiles = [...roleGroups.initial];
    const excludedFiles = [...roleGroups.qa];
    const warnings = [];

    if (!initial.total) warnings.push("当前范围没有可作为有效投入的初测 CSV。工厂良率暂不可计算。");
    if (retest.total) warnings.push(`发现 ${retest.total.toLocaleString("zh-CN")} 条复测事件；缺少跨文件唯一产品 ID，暂不自动覆盖初测结果。`);
    if (disposition.total) warnings.push(`发现 ${disposition.total.toLocaleString("zh-CN")} 条最终处置 / BIN 文件记录；需确认流程规则后才能并入最终结果。`);
    if (qa.total) warnings.push(`已从工厂口径排除 ${qa.total.toLocaleString("zh-CN")} 条 QA 验证记录。`);
    if (initial.missingHbin) warnings.push(`初测中有 ${initial.missingHbin.toLocaleString("zh-CN")} 条记录没有 HBin，已按原 Pass/Fail 兼容归类。`);
    warnings.push("当前有效投入取初测 CSV 记录数，属于估算口径；如与 MES / 工厂投入不一致，应以工厂投入为准。");

    return {
      selectedFiles,
      roles: roleGroups,
      includedFiles,
      excludedFiles,
      initial,
      retest,
      disposition,
      qa,
      effectiveInput: initial.total,
      effectiveInputSource: "初测 CSV 记录数（估算）",
      mainOutput: initial.mainPass,
      yield: initial.yield,
      closureTotal: initial.mainPass + initial.hbin8 + initial.electrical + initial.openShort + initial.other,
      closed: initial.closed,
      isEstimated: true,
      canFinalizeRetest: false,
      warnings,
    };
  }

  function normalizedIdentity(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9一-龥]+/g, "");
  }

  function matchFactoryRows(files, factoryReports = []) {
    const initialFiles = files.filter((file) => factoryFileRole(file) === "initial");
    const rowByIdentity = new Map();
    factoryReports.flatMap((report) => report.rows || []).forEach((row) => {
      const key = [row.lot, row.product, row.customerLot].map(normalizedIdentity).join("\u0000");
      rowByIdentity.set(key, row); // 同一批次重复导入时，以最后导入的报告为准，避免重复累计。
    });
    const reportRows = Array.from(rowByIdentity.values());
    return reportRows.map((row) => {
      const matches = initialFiles.filter((file) => {
        const lot = metadataValue(file, "MES LotID") || metadataValue(file, "Sub Lot Number") || metadataValue(file, "Lot Number");
        const customerLot = metadataValue(file, "Cust LotID") || metadataValue(file, "CUSTOMER_LOTID");
        const product = metadataValue(file, "Product") || metadataValue(file, "Product Model") || metadataValue(file, "Device");
        const lotMatch = row.lot && normalizedIdentity(lot) === normalizedIdentity(row.lot);
        const productMatch = !row.product || !product || normalizedIdentity(product) === normalizedIdentity(row.product);
        const customerLotMatch = !row.customerLot || !customerLot || normalizedIdentity(customerLot) === normalizedIdentity(row.customerLot);
        return lotMatch && productMatch && customerLotMatch;
      });
      return { row, files: matches };
    });
  }

  function analyzeProductionFlow(files, factoryReports = [], overrides = {}) {
    const selectedFiles = sortFilesChronologically(files);
    const roleGroups = { initial: [], retest: [], qa: [], disposition: [] };
    selectedFiles.forEach((file) => {
      const role = factoryFileRole(file);
      if (roleGroups[role]) roleGroups[role].push(file);
    });
    const rowMatches = matchFactoryRows(selectedFiles, factoryReports);
    const anchorByFile = new Map();
    rowMatches.forEach((match) => {
      if (match.files.length !== 1) return;
      const file = match.files[0];
      if (!anchorByFile.has(file.id)) anchorByFile.set(file.id, []);
      anchorByFile.get(file.id).push(match.row);
    });

    const ranges = roleGroups.initial.map((file) => {
      const anchors = anchorByFile.get(file.id) || [];
      const anchorInput = anchors.length === 1 ? Math.max(0, Math.round(anchors[0].input)) : null;
      const override = overrides[file.id] || {};
      let includeCount = anchorInput !== null && anchorInput <= file.records.length ? anchorInput : file.records.length;
      let startIndex = Math.max(0, file.records.length - includeCount);
      let source = anchorInput !== null && anchorInput <= file.records.length ? "factory-anchor" : "all-initial";
      let confidence = source === "factory-anchor" ? "high" : "low";
      if (Number.isFinite(Number(override.startSequence))) {
        startIndex = Math.max(0, Math.min(file.records.length, Math.round(Number(override.startSequence)) - 1));
        includeCount = file.records.length - startIndex;
        source = "manual";
        confidence = "confirmed";
      }
      const records = file.records.slice(startIndex);
      return {
        file,
        startSequence: startIndex + 1,
        excluded: startIndex,
        included: records.length,
        records,
        source,
        confidence,
        anchor: anchors[0] || null,
      };
    });
    const productionInitial = classifyFactoryRecords(ranges.flatMap((range) => range.records));
    const rawInitial = classifyFactoryRecords(roleGroups.initial.flatMap((file) => file.records || []));
    const retest = classifyFactoryRecords(roleGroups.retest.flatMap((file) => file.records || []));
    const disposition = classifyFactoryRecords(roleGroups.disposition.flatMap((file) => file.records || []));
    const qa = classifyFactoryRecords(roleGroups.qa.flatMap((file) => file.records || []));
    const matchedRows = rowMatches.filter((match) => match.files.length === 1).map((match) => match.row);
    const factory = matchedRows.length ? {
      input: matchedRows.reduce((sum, row) => sum + row.input, 0),
      output: matchedRows.reduce((sum, row) => sum + row.output, 0),
      appearance: matchedRows.reduce((sum, row) => sum + row.appearance, 0),
      electrical: matchedRows.reduce((sum, row) => sum + row.electrical, 0),
      openShort: matchedRows.reduce((sum, row) => sum + row.openShort, 0),
      yield: null,
      rows: matchedRows,
    } : null;
    if (factory) factory.yield = factory.input ? factory.output / factory.input : null;
    const inferredRecovered = factory
      ? Math.max(0, factory.output - productionInitial.mainPass)
      : null;
    const inferredFinalFail = factory
      ? Math.max(0, factory.input - factory.output)
      : null;
    const maxRecoverable = productionInitial.nonMain;
    const estimatedFinalOutput = factory ? factory.output : productionInitial.mainPass;
    const estimatedFinalYield = factory ? factory.yield : productionInitial.yield;
    const confidence = factory && matchedRows.length === roleGroups.initial.length ? "high"
      : ranges.some((range) => range.confidence === "confirmed") ? "medium"
        : "low";
    const warnings = [];
    if (!factory) warnings.push("未载入或未匹配工厂良率表；正式生产起点与最终良率只能作为低置信度估算。");
    if (factory && inferredRecovered > maxRecoverable) warnings.push("工厂产出高于初测通过与可恢复不良之和，请检查批次匹配或投入范围。");
    if (retest.total && !factory) warnings.push("存在复测记录但缺少稳定唯一产品 ID；只能显示恢复上限，不能自动逐颗覆盖。");
    if (ranges.some((range) => range.source === "factory-anchor" && range.excluded > 0)) warnings.push("正式生产区间按工厂投入从初测文件尾部反推，已标记为高置信度锚定但仍可人工调整。");
    return {
      roles: roleGroups,
      ranges,
      rawInitial,
      productionInitial,
      retest,
      disposition,
      qa,
      factory,
      inferredRecovered,
      inferredFinalFail,
      maxRecoverable,
      estimatedFinalOutput,
      estimatedFinalYield,
      confidence,
      warnings,
      unmatchedFactoryRows: rowMatches.filter((match) => match.files.length !== 1),
    };
  }

  function analyze(files, filterId = "all") {
    const selectedFiles = selectFiles(files, filterId);
    const records = selectedFiles.flatMap((file) => file.records);
    const passRecords = records.filter((record) => record.isPass);
    const failRecords = records.filter((record) => !record.isPass);
    const failStats = buildFailStats(failRecords, records.length);
    const capacity = calculateCapacityMetrics(selectedFiles);
    return {
      selectedFiles,
      records,
      passRecords,
      failRecords,
      total: records.length,
      pass: passRecords.length,
      fail: failRecords.length,
      yield: records.length ? passRecords.length / records.length : 0,
      ...capacity,
      failStats,
      yieldTrend: buildYieldTrend(records),
      stability: calculateStability(selectedFiles, passRecords),
      fileSummaries: sortFilesChronologically(files).map(summarizeFile),
    };
  }

  function parameterSeries(analysis, testName) {
    const fileMap = new Map(analysis.selectedFiles.map((file) => [file.id, file]));
    const stability = analysis.stability.find((item) => item.name === testName) || null;
    const points = [];
    analysis.passRecords.forEach((record, index) => {
      const file = fileMap.get(record.fileId);
      const value = file ? getValue(file, record, testName) : null;
      if (value !== null) {
        points.push({
          index: index + 1,
          value,
          fileId: record.fileId,
          serial: record.serial,
          site: record.site,
        });
      }
    });
    return { stability, points };
  }

  function parameterDistribution(analysis, testName) {
    const fileMap = new Map(analysis.selectedFiles.map((file) => [file.id, file]));
    const specs = new Map();
    const points = [];
    let mean = 0;
    let m2 = 0;
    let min = Infinity;
    let max = -Infinity;
    let low = 0;
    let high = 0;
    let within = 0;
    let attributedFail = 0;

    analysis.records.forEach((record, recordIndex) => {
      const file = fileMap.get(record.fileId);
      if (!file) return;
      const valueIndex = file.testIndexByName[testName];
      if (valueIndex === undefined) return;
      const value = record.values[valueIndex];
      if (value === null || value === undefined || !Number.isFinite(value)) return;
      const test = file.tests[valueIndex];
      const lower = test?.lower ?? null;
      const upper = test?.upper ?? null;
      const unit = test?.unit || "";
      const specKey = `${lower ?? ""}\u0000${upper ?? ""}\u0000${unit}`;
      if (!specs.has(specKey)) specs.set(specKey, { lower, upper, unit });

      let direction = "within";
      if (lower !== null && value < lower) {
        direction = "low";
        low += 1;
      } else if (upper !== null && value > upper) {
        direction = "high";
        high += 1;
      } else {
        within += 1;
      }
      const isAttributedFail = !record.isPass && record.failReason === testName;
      if (isAttributedFail) attributedFail += 1;
      const n = points.length + 1;
      const delta = value - mean;
      mean += delta / n;
      m2 += delta * (value - mean);
      min = Math.min(min, value);
      max = Math.max(max, value);
      points.push({
        index: recordIndex + 1,
        value,
        direction,
        isPass: record.isPass,
        isAttributedFail,
        fileId: record.fileId,
        serial: record.serial,
        site: record.site,
        lower,
        upper,
        unit,
      });
    });

    const specList = Array.from(specs.values());
    const commonSpec = specList.length === 1 ? specList[0] : null;
    return {
      name: testName,
      points,
      total: points.length,
      missing: Math.max(analysis.records.length - points.length, 0),
      low,
      high,
      within,
      outOfSpec: low + high,
      attributedFail,
      mean: points.length ? mean : null,
      std: points.length > 1 ? Math.sqrt(m2 / (points.length - 1)) : null,
      min: points.length ? min : null,
      max: points.length ? max : null,
      lower: commonSpec?.lower ?? null,
      upper: commonSpec?.upper ?? null,
      unit: commonSpec?.unit || specList[0]?.unit || "",
      specVariant: specList.length > 1,
      specs: specList,
    };
  }

  function simulateLimitYield(analysis, distribution, lower, upper) {
    if (!analysis || !distribution) {
      return {
        projectedPass: 0, projectedFail: 0, yield: 0, delta: 0,
        recovered: 0, newFails: 0, low: 0, high: 0, within: 0, parameterYield: 0,
      };
    }
    let projectedPass = analysis.pass;
    let recovered = 0;
    let newFails = 0;
    let low = 0;
    let high = 0;
    let within = 0;

    distribution.points.forEach((point) => {
      let adjustedInSpec = true;
      if (lower !== null && point.value < lower) {
        low += 1;
        adjustedInSpec = false;
      } else if (upper !== null && point.value > upper) {
        high += 1;
        adjustedInSpec = false;
      } else {
        within += 1;
      }

      const originallyInSpec = point.direction === "within";
      if (point.isAttributedFail && !originallyInSpec && adjustedInSpec) {
        projectedPass += 1;
        recovered += 1;
      } else if (point.isPass && originallyInSpec && !adjustedInSpec) {
        projectedPass -= 1;
        newFails += 1;
      }
    });

    projectedPass = Math.max(0, Math.min(analysis.total, projectedPass));
    const projectedFail = Math.max(analysis.total - projectedPass, 0);
    const projectedYield = analysis.total ? projectedPass / analysis.total : 0;
    return {
      projectedPass,
      projectedFail,
      yield: projectedYield,
      delta: projectedYield - analysis.yield,
      recovered,
      newFails,
      netPassChange: recovered - newFails,
      low,
      high,
      within,
      parameterYield: distribution.total ? within / distribution.total : 0,
    };
  }

  return {
    aggregateSummaryReports,
    analyze,
    analyzeFactory,
    analyzeProductionFlow,
    auditSummaryReports,
    clean,
    extractCsvEntriesFromZip,
    finiteNumber,
    factoryFileRole,
    isSummaryReportText,
    metadataValue,
    parameterDistribution,
    parameterSeries,
    parseCsv,
    parseFtFileText,
    parseFactoryYieldWorkbook,
    parseSummaryReportText,
    simulateLimitYield,
    sortFilesChronologically,
    summarizeFile,
    summarizeSummaryReport,
    summaryMatchesFile,
  };
});
