(function () {
  "use strict";

  const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024;
  const MAX_CSV_BYTES = 256 * 1024 * 1024;
  const MAX_TOTAL_CSV_BYTES = 512 * 1024 * 1024;
  const MAX_ENTRY_COUNT = 2000;
  const scriptRoot = document.currentScript
    ? new URL(".", document.currentScript.src).href
    : new URL(".", window.location.href).href;

  let enginePromise = null;

  function loadScript(relativePath) {
    const source = new URL(relativePath, scriptRoot).href;
    const existing = Array.from(document.scripts).find((script) => script.src === source);
    if (existing?.dataset.loaded === "true") return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = existing || document.createElement("script");
      const onLoad = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      const onError = () => reject(new Error(`无法加载离线解压组件：${relativePath}`));
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      if (!existing) {
        script.src = source;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }

  function decodeBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    const chunkSize = 64 * 1024;
    for (let offset = 0; offset < binary.length; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, binary.length);
      for (let index = offset; index < end; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
    }
    return bytes;
  }

  async function ensureEngine() {
    if (enginePromise) return enginePromise;
    enginePromise = (async () => {
      if (typeof WebAssembly === "undefined") {
        throw new Error("当前浏览器不支持 7z/RAR 解压，请升级 Edge/Chrome 后重试");
      }
      await loadScript("vendor/7z-wasm/7zz-wasm-data.js");
      await loadScript("vendor/7z-wasm/7zz.umd.js");
      if (typeof window.SevenZip !== "function" || !window.FTSevenZipWasmBase64) {
        throw new Error("7z/RAR 离线解压组件不完整，请确认 vendor 文件夹与 index.html 放在一起");
      }
      const wasmBinary = decodeBase64(window.FTSevenZipWasmBase64);
      delete window.FTSevenZipWasmBase64;
      return { factory: window.SevenZip, wasmBinary };
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
    return enginePromise;
  }

  function parseListing(text) {
    const records = [];
    let current = null;
    text.split(/\r?\n/).forEach((line) => {
      if (line === "----------") {
        current = {};
        return;
      }
      if (!current) return;
      if (!line.trim()) {
        if (current.Path) records.push(current);
        current = {};
        return;
      }
      const separator = line.indexOf(" = ");
      if (separator < 0) return;
      current[line.slice(0, separator)] = line.slice(separator + 3);
    });
    if (current?.Path) records.push(current);
    return records;
  }

  function validateListing(records, archiveName) {
    const csvRecords = records.filter((record) => {
      const path = String(record.Path || "").replace(/\\/g, "/");
      const isDirectory = String(record.Attributes || "").trim().startsWith("D");
      return !isDirectory && path.toLowerCase().endsWith(".csv");
    });

    if (csvRecords.length > MAX_ENTRY_COUNT) {
      throw new Error(`${archiveName} 内 CSV 数量超过 ${MAX_ENTRY_COUNT}，已停止处理`);
    }

    let totalSize = 0;
    csvRecords.forEach((record) => {
      if (String(record.Encrypted || "").trim() === "+") {
        throw new Error(`${archiveName} 包含加密 CSV，暂不支持密码压缩包`);
      }
      const size = Number(record.Size);
      if (!Number.isFinite(size) || size < 0) {
        throw new Error(`${archiveName} 的 CSV 大小信息无效`);
      }
      if (size > MAX_CSV_BYTES) {
        throw new Error(`${record.Path} 解压后超过 256 MB，已停止处理`);
      }
      totalSize += size;
      if (totalSize > MAX_TOTAL_CSV_BYTES) {
        throw new Error(`${archiveName} 内 CSV 解压后总大小超过 512 MB，已停止处理`);
      }
    });

    return csvRecords;
  }

  function collectCsvFiles(fileSystem, rootPath) {
    const result = [];
    const walk = (path, relativePath) => {
      fileSystem.readdir(path).forEach((name) => {
        if (name === "." || name === "..") return;
        const absolute = `${path}/${name}`;
        const relative = relativePath ? `${relativePath}/${name}` : name;
        const stat = fileSystem.lstat(absolute);
        if (fileSystem.isDir(stat.mode)) {
          walk(absolute, relative);
        } else if (fileSystem.isFile(stat.mode) && relative.toLowerCase().endsWith(".csv")) {
          const bytes = fileSystem.readFile(absolute);
          result.push({
            name: relative.replace(/\\/g, "/"),
            size: bytes.byteLength,
            bytes,
          });
        }
      });
    };
    walk(rootPath, "");
    return result;
  }

  function conciseEngineError(logs) {
    const relevant = logs
      .map((line) => String(line || "").trim())
      .filter((line) => /error|wrong password|can not open|unsupported/i.test(line));
    return relevant.slice(-2).join("；");
  }

  async function extractCsvEntriesFromArchive(arrayBuffer, archiveName = "压缩包.7z") {
    const archiveBytes = new Uint8Array(arrayBuffer);
    if (!archiveBytes.length) throw new Error(`${archiveName} 是空文件`);
    if (archiveBytes.length > MAX_ARCHIVE_BYTES) {
      throw new Error(`${archiveName} 大小超过 512 MB，已停止处理`);
    }

    const { factory, wasmBinary } = await ensureEngine();
    const virtualArchivePath = /\.rar$/i.test(archiveName) ? "/input.rar" : "/input.7z";
    let logs = [];
    let sevenZip;
    try {
      sevenZip = await factory({
        wasmBinary,
        print: (line) => logs.push(line),
        printErr: (line) => logs.push(line),
      });
      sevenZip.FS.writeFile(virtualArchivePath, archiveBytes);

      let listCode;
      try {
        listCode = sevenZip.callMain([
          "l", "-slt", virtualArchivePath, "-bd", "-bsp0", "-p__FT_ANALYZER_NO_PASSWORD__",
        ]);
      } catch (_) {
        throw new Error(`${archiveName} 无法读取，文件可能已损坏或使用了密码/加密文件名`);
      }
      if (listCode !== 0) {
        const detail = conciseEngineError(logs);
        throw new Error(`${archiveName} 不是有效的压缩包或文件已损坏${detail ? `：${detail}` : ""}`);
      }

      const csvRecords = validateListing(parseListing(logs.join("\n")), archiveName);
      if (!csvRecords.length) return [];

      logs = [];
      sevenZip.FS.mkdir("/output");
      let extractCode;
      try {
        extractCode = sevenZip.callMain([
          "x", virtualArchivePath, "-o/output", "-y", "-bd", "-bso0", "-bsp0",
          "-p__FT_ANALYZER_NO_PASSWORD__", "-ssc-", "-r", "*.csv",
        ]);
      } catch (_) {
        throw new Error(`${archiveName} 解压失败，文件可能已损坏或使用了密码`);
      }
      if (extractCode !== 0) {
        const detail = conciseEngineError(logs);
        throw new Error(`${archiveName} 解压失败${detail ? `：${detail}` : ""}`);
      }

      const entries = collectCsvFiles(sevenZip.FS, "/output");
      let totalSize = 0;
      entries.forEach((entry) => {
        if (entry.size > MAX_CSV_BYTES) {
          throw new Error(`${entry.name} 解压后超过 256 MB，已停止处理`);
        }
        totalSize += entry.size;
        if (totalSize > MAX_TOTAL_CSV_BYTES) {
          throw new Error(`${archiveName} 内 CSV 解压后总大小超过 512 MB，已停止处理`);
        }
      });
      return entries;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(`${archiveName} 解压失败：${String(error)}`);
    }
  }

  function extractCsvEntriesFrom7z(arrayBuffer, archiveName = "压缩包.7z") {
    return extractCsvEntriesFromArchive(arrayBuffer, archiveName);
  }

  window.FTSevenZip = {
    extractCsvEntriesFromArchive,
    extractCsvEntriesFrom7z,
  };
})();
