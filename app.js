(function () {
  "use strict";

  const Core = window.FTCore;
  const ArchiveEngine = window.FTSevenZip;
  const RELEASE_NOTES = [
    {
      version: "v1.48",
      current: true,
      title: "问题反馈入口布局优化",
      changes: [
        "将问题与反馈入口从版本说明标题栏移至更新日志右侧独立区域，减少标题栏干扰。",
        "增加对话图标、轻量描边、悬停反馈与键盘焦点样式，并保留 GitHub 仓库跳转。",
        "增加窄屏自适应布局，空间不足时反馈入口自动移动到更新日志上方。"
      ],
    },
    {
      version: "v1.47",
      current: false,
      title: "数据质量与口径审计",
      changes: [
        "新增独立数据审计页，汇总缺失字段、疑似重复标识、规格冲突与 Fail 实测值缺失。",
        "新增生产数量流转视图，分开显示原始初测、工程排除、正式投入、复测事件及工厂最终结果。",
        "新增文件角色与判定依据表，并解释软件初测良率与工厂最终良率之间的差异。"
      ],
    },
    {
      version: "v1.46",
      current: false,
      title: "文件夹递归拖入",
      changes: [
        "支持将整个文件夹拖入导入区，自动递归读取所有子目录。",
        "文件夹中的 CSV、工厂良率 XLSX、ZIP、7z 与 RAR 会继续沿用现有解析流程。",
        "保留文件夹相对路径，避免不同子目录中的同名文件被混淆；其他文件类型自动忽略。"
      ],
    },
    {
      version: "v1.45",
      current: false,
      title: "GitHub 问题与反馈入口",
      changes: [
        "在更新日志标题栏增加简洁的“问题与反馈”按钮，可直接打开项目 GitHub 仓库。",
        "反馈入口使用新标签页打开，并补充安全属性与键盘焦点样式。",
        "优化桌面端居中布局和小屏自适应显示，避免挤压版本说明与更新状态。"
      ],
    },
    {
      version: "v1.44",
      current: false,
      title: "Fail 测试项菜单分组",
      changes: [
        "Fail 分布下拉菜单默认只显示有归因 Fail 的测试项，减少无 Fail 项造成的列表干扰。",
        "增加“显示全部测试项”开关，展开后将无 Fail / 仅 Pass 项目单独分组显示。",
        "从 Pass 稳定性联动到无 Fail 项时自动显示全部测试项，确保当前选择不会在菜单中消失。"
      ],
    },
    {
      version: "v1.43",
      current: false,
      title: "分析范围文件名完整显示",
      changes: [
        "扩大分析范围选择框及展开列表宽度，桌面端可利用更多横向空间显示长文件名。",
        "压缩包内文件在选项中省略重复的压缩包路径，保留测试时间、阶段、格式与完整 CSV 文件名。",
        "工具栏支持按窗口宽度自动换行，避免扩大文件选择框后挤压统计口径和操作按钮。"
      ],
    },
    {
      version: "v1.42",
      current: false,
      title: "Fail 分布与 Pass 稳定性测试项联动",
      changes: [
        "Fail 分布与 Pass 稳定性共用当前测试项：任一界面切换项目后，另一界面同步选中同名项目。",
        "点击 Pass 稳定性表格行、使用稳定性下拉框或 Fail 分布测试项列表时，均通过同一联动入口更新。",
        "切换分析文件后会重新校验项目是否存在；仅在目标界面没有同名项目时才使用该界面的首个可用项目。"
      ],
    },
    {
      version: "v1.41",
      current: false,
      title: "三种良率口径与工厂报告锚定",
      changes: [
        "将测试事件、正式初测和工厂最终三种统计口径分开，避免把工程调试、QA 与复测事件重复计入工厂良率。",
        "支持直接导入工厂良率 XLSX，以测试投入锚定正式生产区间，并显示来源、置信度及无法唯一匹配的提示。",
        "正式生产起始序号可人工确认；导出结果增加生产区间、工厂对账和推算恢复数量，便于追溯每个计数的来源。"
      ],
    },
    {
      version: "v1.40",
      current: false,
      title: "工厂良率估算与文件角色审计",
      changes: [
        "新增测试事件口径与工厂口径（估算）切换；工厂口径以初测文件作为有效投入，以 HBin1 作为主产品产出。",
        "将 HBin8、电性、O/S、其他处置、复测与 QA 分开列示，复测和 QA 不再重复计入初测投入。",
        "新增数据闭合、复测身份限制与文件角色提示，并在导出结果中附带工厂口径审计明细。"
      ],
    },
    {
      version: "v1.39",
      current: false,
      title: "Pareto 联动单项分析卡",
      changes: [
        "用 Pareto 联动的单项分析卡替换总览底部 Fail 长表，集中展示 Fail 构成、批次影响与偏低/偏高方向。",
        "点击 Pareto 柱仅切换当前分析项；支持按排名查看上一项/下一项，并可直达对应超限分布或 Fail 明细。",
        "合并既有 Fail 分布布局优化：统一统计与模拟区层级、压缩标准视图高度，并改善视窗外超限点与规格标签显示。"
      ],
    },
    {
      version: "v1.38",
      current: false,
      title: "Fail 分布连续数据条落地",
      changes: [
        "按确认的方案 2 将原始统计与良率模拟次级指标改为连续数据条，以细分隔线替代独立圆角卡片。",
        "取消双栏面板强制最小高度并压缩标题区，让下方分布图在标准视图中更早出现。",
        "扩大高分辨率屏幕下的工作区宽度，长数值允许完整换行，并为规格线标签增加不透明描边底板。"
      ],
    },
    {
      version: "v1.37",
      current: false,
      title: "Fail 分布统一数据条布局",
      changes: [
        "原始测试统计与规格良率模拟统一为两张主指标卡加六项三列数据条，固定卡片高度、间距与文字层级。",
        "预计 Pass 与预计恢复拆分显示，规格输入数值按界面精度展示，避免长数值、单位或增量信息挤压溢出。",
        "图表规格标签采用避让样式，减少与右侧数据点重叠。"
      ],
    },
    {
      version: "v1.36",
      current: false,
      title: "原始统计卡等高修正",
      changes: ["修复原始统计第二行因长文本换行导致的卡片高度不一致，所有紧凑指标卡现在统一填满同一网格行。"],
    },
    {
      version: "v1.35",
      title: "原始统计与模拟卡片统一",
      changes: ["原始测试统计采用与良率模拟相同的两张主卡加六项紧凑卡布局，统一圆角、留白、字体层级与颜色表达。"],
    },
    {
      version: "v1.34",
      title: "Fail 分布模拟区高度压缩",
      changes: ["压缩规格模拟区的说明、主良率卡与指标行高度；左右面板采用一致紧凑基准高度，让下方范围图在标准视图中更早出现。"],
    },
    {
      version: "v1.33",
      title: "规格输入与良率变化显示优化",
      changes: ["标准视图下 LSL、USL 与恢复按钮保持同一行；良率变化改为简洁百分比显示，避免紧凑指标区文字拥挤。"],
    },
    {
      version: "v1.32",
      title: "标准视图紧凑布局生效",
      changes: ["修正浏览器缩放导致的过早两列回退；标准视图保留六项横向模拟指标，并进一步压缩指标字体与内边距。"],
    },
    {
      version: "v1.31",
      title: "Fail 分布紧凑布局修正",
      changes: ["下调模拟指标回退阈值，使常规视图保持六列紧凑布局；取消双栏等高拉伸，左侧原始统计随内容高度收起。"],
    },
    {
      version: "v1.30",
      title: "Fail 分布紧凑数据条布局",
      changes: ["原始统计改为无图标的两行数据条；模拟指标压缩为横向紧凑布局，使常规视图可显示更多下方超限分布图。"],
    },
    {
      version: "v1.29",
      title: "原始统计卡间距修正",
      changes: ["修复左侧统计网格被垂直居中后出现过大空隙的问题，卡片现在填满网格行并保持统一紧凑间距。"],
    },
    {
      version: "v1.28",
      title: "Fail 分布双栏卡片布局",
      changes: ["原始统计与良率模拟采用等宽双栏；统计卡增大并强化层次；规格输入区按面板宽度自适应，避免按钮与数据溢出。"],
    },
    {
      version: "v1.27",
      title: "PowerTECH SUM 汇总适配",
      changes: ["支持 PowerTECH .sum.csv 的 All Site Summary、软件 Bin 和 Fail 项解析；压缩包中的该类文件将独立归入 Summary 汇总报告。"],
    },
    {
      version: "v1.26",
      title: "SUM 汇总文件识别",
      changes: ["压缩包或单独导入时，文件名以 .sum.csv 结尾的汇总报表会与 Summary 报告同样独立识别和显示。"],
    },
    {
      version: "v1.25",
      title: "Fail 分布布局溢出修正",
      changes: ["修复恢复原规格按钮被截断的问题；左侧原始统计恢复紧凑卡片高度，避免统计卡片被过度拉伸。"],
    },
    {
      version: "v1.24",
      title: "Fail 分布卡片比例与溢出优化",
      changes: ["扩大原始测试统计卡片并填满左侧区域；模拟结果改为两列等宽布局，长数值有更充足的显示空间。"],
    },
    {
      version: "v1.23",
      title: "规格输入与模拟卡片对齐",
      changes: ["LSL、USL 与恢复按钮调整为同一行对齐；良率变化、预计 Pass 等模拟指标采用等宽等高卡片，长数值自动适配。"],
    },
    {
      version: "v1.22",
      title: "Fail 分布统计与模拟布局优化",
      changes: ["将原始测试统计与规格模拟结果整合为左右双栏，突出规格调整后的良率变化，同时保留全部关键统计数据。"],
    },
    {
      version: "v1.21",
      title: "总览卡片完整显示",
      changes: ["优化总览卡片的长文本排版，产品名称与首要 Fail 项会自动换行并避免覆盖相邻卡片。"],
    },
    {
      version: "v1.20",
      title: "总览新增产品名称",
      changes: ["在测试记录前新增产品名称卡片，优先显示 CSV 产品 / 设备字段；多文件不同产品时提示多产品汇总。"],
    },
    {
      version: "v1.19",
      title: "新增更新日志页签",
      changes: [
        "新增独立的版本说明页面，集中记录功能更新与优化。",
        "后续版本将按时间顺序持续追加，方便追溯软件变化。",
      ],
    },
    {
      version: "v1.18",
      title: "文件对比跳转",
      changes: ["文件对比中点击明细 CSV，可自动定位当前分析范围并进入对应 Fail 分布。"],
    },
    {
      version: "v1.17",
      title: "测试项选择与响应优化",
      changes: [
        "测试项展开列表采用浅色色块展示 Fail 相对占比。",
        "无 Fail 测试项仅显示名称；选择状态与图表同步，并优化切换响应。",
      ],
    },
    {
      version: "v1.16",
      title: "Fail 列表紧凑显示",
      changes: ["优化左侧偏低 / 偏高列宽与间距，正常视图可直接看到完整数据。"],
    },
    {
      version: "v1.15",
      title: "首页文案整理",
      changes: ["精简导入区域说明，减少首页冗余文字并保持页面聚焦。"],
    },
    {
      version: "v1.14",
      title: "测试平台说明",
      changes: ["首页补充 QT8100 / QT8600、翌立科 ETS8000E、铭剑 E6400 的适配说明。"],
    },
    {
      version: "v1.13",
      title: "Summary 独立视图",
      changes: ["Summary 汇总报告改为主动选择后独立显示，不再自动关联同压缩包明细 CSV。"],
    },
    {
      version: "v1.12",
      title: "Summary 汇总报告识别",
      changes: ["支持读取 Summary Report 中的 Pass、Fail、Total、Yield、SBin/HBin、FailCount 与模块测试时间。"],
    },
    {
      version: "v1.11",
      title: "产能指标",
      changes: ["新增单颗测试时间、UPH 与日产出估算，UPH 纳入 150 ms Index 时间。"],
    },
    {
      version: "v1.10",
      title: "压缩包扩展支持",
      changes: ["在 ZIP 基础上新增 7z、RAR 压缩包读取，并支持递归读取包内 CSV。"],
    },
    {
      version: "v1.9",
      title: "多文件阶段对比",
      changes: ["按文件名时间排序多个测试文件，并识别 FT 初测与 RT 复测阶段。"],
    },
    {
      version: "v1.8",
      title: "规格良率模拟",
      changes: ["支持拖动或输入 LSL / USL，即时评估单测试项规格调整后的良率变化。"],
    },
    {
      version: "v1.7",
      title: "Fail 数值分布",
      changes: ["新增按测试顺序的数值分布和直方图，并区分规格内与超限样本。"],
    },
    {
      version: "v1.6",
      title: "Fail 归因与占比",
      changes: ["新增 Fail 项 Pareto、偏低 / 偏高统计及当前批次占比。"],
    },
    {
      version: "v1.5",
      title: "压缩包批量导入",
      changes: ["支持拖入 ZIP 压缩包并批量读取其中的 CSV 测试数据。"],
    },
    {
      version: "v1.4",
      title: "多格式解析",
      changes: ["扩展支持 ETS、PowerTECH、DataLog 与 ATX Datalog 测试数据格式。"],
    },
    {
      version: "v1.3",
      title: "稳定性与明细分析",
      changes: ["新增 Pass 稳定性、Ppk 指标与逐颗 Fail 明细查询。"],
    },
    {
      version: "v1.2",
      title: "本地文件导入体验",
      changes: ["新增拖拽导入、文件选择、编码兼容与本机浏览器离线处理提示。"],
    },
    {
      version: "v1.1",
      title: "FT 数据分析基础版",
      changes: ["建立本地 CSV 分析工作台，提供测试记录、Pass / Fail 良率及首要 Fail 项统计。"],
    },
  ];
  const state = {
    files: [],
    summaryReports: [],
    factoryReports: [],
    filterId: "all",
    analysis: null,
    analysisMode: "events",
    factoryAnalysis: null,
    productionFlow: null,
    productionOverrides: {},
    summaryAggregate: null,
    activeTab: "overview",
    selectedTest: "",
    selectedOverviewFailReason: "",
    selectedFailReason: "all",
    selectedDistributionReason: "",
    distributionLimits: new Map(),
    distributionCache: new Map(),
    distributionFocus: true,
    distributionRenderFrame: 0,
    limitDrag: null,
    limitRenderFrame: 0,
    detailSearch: "",
    detailPage: 1,
    pageSize: 100,
    distributionPickerOpen: false,
    showAllDistributionTests: false,
  };

  const el = {};
  const ids = [
    "dropZone", "fileInput", "browseButton", "message", "workspace", "fileFilter", "analysisMode",
    "exportButton", "addFilesButton", "clearButton", "summaryCards", "paretoChart",
    "yieldChart", "yieldTrendHint", "failFocusContent", "testItemSelect", "selectedTestStats",
    "parameterChart", "stabilitySearch", "stabilityTableBody", "failReasonFilter",
    "detailSearch", "detailTableBody", "failDetailCount", "detailPagination", "fileTableBody",
    "fileYieldChart", "themeToggle", "distributionTestButton", "distributionTestMenu", "distributionFailTableBody",
    "distributionTitle", "distributionHint", "distributionStats", "distributionDetailButton",
    "failSequenceChart", "failHistogramChart", "limitSimulationPanel", "limitSimulationNote",
    "simulatedLowerInput", "simulatedUpperInput", "resetLimitsButton", "yieldSimulation",
    "rangeModeButton", "summaryReportPanel", "summaryReportHint", "summaryReportStatus",
    "summaryReportMetrics", "summaryReportTableBody", "summaryBinTableBody", "summaryFailTableBody", "releaseLog",
    "factoryPanel", "factoryStatus", "factoryAnchorSummary", "factoryMetrics", "factoryRangeTableBody", "factoryWarnings",
    "dataAuditStatus", "dataAuditMetrics", "dataAuditFlow", "dataAuditIssues",
    "dataAuditRoleTableBody", "dataAuditSpecTableBody",
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });

  function initialize() {
    if (!Core) {
      showMessage("分析核心脚本未加载，请刷新页面或检查 ft-core.js 是否与本页面在同一文件夹。", "error");
      return;
    }
    bindEvents();
    initializeTheme();
    renderReleaseLog();
  }

  function bindEvents() {
    el.browseButton.addEventListener("click", () => el.fileInput.click());
    el.addFilesButton.addEventListener("click", () => el.fileInput.click());
    el.fileInput.addEventListener("change", (event) => handleFiles(Array.from(event.target.files || [])));

    ["dragenter", "dragover"].forEach((eventName) => {
      el.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        el.dropZone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      el.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        el.dropZone.classList.remove("is-dragging");
      });
    });
    el.dropZone.addEventListener("drop", async (event) => {
      try {
        const files = await collectDroppedFiles(event.dataTransfer);
        await handleFiles(files);
      } catch (error) {
        showMessage(`读取拖入内容失败：${error.message}`, "error");
      }
    });

    el.fileFilter.addEventListener("change", () => {
      state.filterId = el.fileFilter.value;
      state.selectedTest = "";
      state.selectedOverviewFailReason = "";
      state.selectedFailReason = "all";
      state.selectedDistributionReason = "";
      state.distributionLimits.clear();
      state.detailPage = 1;
      analyzeAndRender();
    });
    el.analysisMode.addEventListener("change", () => {
      state.analysisMode = ["events", "initial", "factory"].includes(el.analysisMode.value)
        ? el.analysisMode.value : "events";
      analyzeAndRender();
    });
    el.testItemSelect.addEventListener("change", () => {
      setCurrentTestItem(el.testItemSelect.value);
      renderStabilityTable();
      renderSelectedTest();
    });
    el.failReasonFilter.addEventListener("change", () => {
      state.selectedFailReason = el.failReasonFilter.value;
      state.detailPage = 1;
      renderFailDetails();
    });
    el.detailSearch.addEventListener("input", () => {
      state.detailSearch = el.detailSearch.value.trim().toLowerCase();
      state.detailPage = 1;
      renderFailDetails();
    });
    el.stabilitySearch.addEventListener("input", renderStabilityTable);
    el.distributionTestButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setDistributionPickerOpen(!state.distributionPickerOpen);
    });
    el.distributionTestMenu.addEventListener("click", (event) => {
      const toggle = event.target.closest("button[data-toggle-all-tests]");
      if (toggle) {
        state.showAllDistributionTests = !state.showAllDistributionTests;
        updateDistributionTestSelect();
        return;
      }
      const option = event.target.closest("button[data-distribution-test]");
      if (option) selectDistributionReason(option.dataset.distributionTest);
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".distribution-test-picker")) setDistributionPickerOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setDistributionPickerOpen(false);
    });
    el.exportButton.addEventListener("click", exportAnalysis);
    el.clearButton.addEventListener("click", clearAll);
    el.themeToggle.addEventListener("click", toggleTheme);

    document.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    el.failFocusContent.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-fail-focus-action]");
      if (!button || button.disabled) return;
      const reason = state.selectedOverviewFailReason;
      if (button.dataset.failFocusAction === "distribution") openFailDistribution(reason);
      if (button.dataset.failFocusAction === "details") openFailDetails(reason);
      if (button.dataset.failFocusAction === "previous") moveOverviewFailSelection(-1);
      if (button.dataset.failFocusAction === "next") moveOverviewFailSelection(1);
    });
    el.stabilityTableBody.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-test]");
      if (!row) return;
      setCurrentTestItem(row.dataset.test);
      switchTab("stability");
      updateTestSelect();
      renderSelectedTest();
    });
    el.distributionFailTableBody.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-reason]");
      if (row) selectDistributionReason(row.dataset.reason);
    });
    el.distributionDetailButton.addEventListener("click", () => {
      if (state.selectedDistributionReason) openFailDetails(state.selectedDistributionReason);
    });
    el.simulatedLowerInput.addEventListener("input", () => updateLimitFromInput("lower"));
    el.simulatedUpperInput.addEventListener("input", () => updateLimitFromInput("upper"));
    el.resetLimitsButton.addEventListener("click", resetDistributionLimits);
    el.rangeModeButton.addEventListener("click", () => {
      state.distributionFocus = !state.distributionFocus;
      updateRangeModeButton(state.distributionResult);
      scheduleLimitChartRender();
    });
    bindLimitDragging(el.failSequenceChart, "y");
    bindLimitDragging(el.failHistogramChart, "x");
    el.detailTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-distribution-reason]");
      if (button) openFailDistribution(button.dataset.distributionReason);
    });
    el.fileTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-remove-id]");
      if (button) {
        removeFile(button.dataset.removeId);
        return;
      }
      const row = event.target.closest("tr[data-analysis-file-id]");
      if (row) openFileDistribution(row.dataset.analysisFileId);
    });
    el.paretoChart.addEventListener("click", onParetoClick);
    el.factoryRangeTableBody.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-production-start]");
      if (!input) return;
      const fileId = input.dataset.productionStart;
      const value = Math.max(1, Math.round(Number(input.value) || 1));
      state.productionOverrides[fileId] = { startSequence: value };
      analyzeAndRender();
    });
    el.factoryRangeTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-reset-production-start]");
      if (!button) return;
      delete state.productionOverrides[button.dataset.resetProductionStart];
      analyzeAndRender();
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawVisibleCharts, 100);
    });
  }

  function initializeTheme() {
    let preferred = "light";
    try {
      preferred = localStorage.getItem("ft-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (_) {
      preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.dataset.theme = preferred;
    el.themeToggle.textContent = preferred === "dark" ? "☀" : "◐";
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    el.themeToggle.textContent = next === "dark" ? "☀" : "◐";
    try { localStorage.setItem("ft-theme", next); } catch (_) { /* file:// may restrict storage */ }
    requestAnimationFrame(drawVisibleCharts);
  }

  async function collectDroppedFiles(dataTransfer) {
    if (!dataTransfer) return [];
    const items = Array.from(dataTransfer.items || []);
    try {
      const handlePromises = items
        .filter((item) => item.kind === "file" && typeof item.getAsFileSystemHandle === "function")
        .map((item) => item.getAsFileSystemHandle());
      if (handlePromises.length) {
        const handles = (await Promise.all(handlePromises)).filter(Boolean);
        if (handles.length) {
          showMessage("正在扫描拖入的文件与文件夹…");
          const nestedFiles = await Promise.all(handles.map((handle) => readDroppedHandle(handle, "")));
          return nestedFiles.flat();
        }
      }
    } catch (_) { /* Fall back to the legacy directory-entry API below. */ }
    const entryItems = items
      .map((item) => item.kind === "file" && typeof item.webkitGetAsEntry === "function"
        ? item.webkitGetAsEntry() : null)
      .filter(Boolean);
    if (entryItems.length) {
      showMessage("正在扫描拖入的文件与文件夹…");
      const nestedFiles = await Promise.all(entryItems.map((entry) => readDroppedEntry(entry, "")));
      return nestedFiles.flat();
    }
    return Array.from(dataTransfer.files || []);
  }

  async function readDroppedHandle(handle, parentPath) {
    if (!handle) return [];
    const relativePath = [parentPath, handle.name].filter(Boolean).join("/");
    if (handle.kind === "file") {
      const file = await handle.getFile();
      return [wrapDroppedFile(file, relativePath)];
    }
    if (handle.kind !== "directory") return [];
    const nestedFiles = [];
    for await (const child of handle.values()) {
      nestedFiles.push(...await readDroppedHandle(child, relativePath));
    }
    return nestedFiles;
  }

  async function readDroppedEntry(entry, parentPath) {
    if (!entry) return [];
    const relativePath = [parentPath, entry.name].filter(Boolean).join("/");
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      return [wrapDroppedFile(file, relativePath)];
    }
    if (!entry.isDirectory) return [];
    const reader = entry.createReader();
    const children = [];
    while (true) {
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) break;
      children.push(...batch);
    }
    const nestedFiles = await Promise.all(children.map((child) => readDroppedEntry(child, relativePath)));
    return nestedFiles.flat();
  }

  function wrapDroppedFile(file, relativePath) {
    return {
      name: relativePath || file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      arrayBuffer: () => readBlobAsArrayBuffer(file),
    };
  }

  function readBlobAsArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result), { once: true });
      reader.addEventListener("error", () => reject(reader.error || new Error("文件读取失败")), { once: true });
      reader.addEventListener("abort", () => reject(new Error("文件读取已取消")), { once: true });
      reader.readAsArrayBuffer(blob);
    });
  }

  async function handleFiles(files) {
    const sourceFiles = files.filter((file) => /\.(csv|xlsx|zip|7z|rar)$/i.test(file.name));
    if (!sourceFiles.length) {
      showMessage("请选择文件，或拖入包含 .csv、.xlsx、.zip、.7z、.rar 的文件夹。", "error");
      return;
    }

    showMessage(`正在读取 ${sourceFiles.length} 个文件…`);
    const errors = [];
    const csvFiles = [];
    const xlsxFiles = [];
    for (const file of sourceFiles) {
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        xlsxFiles.push(file);
        continue;
      }
      if (file.name.toLowerCase().endsWith(".csv")) {
        csvFiles.push({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          signature: `csv:${file.name}|${file.size}|${file.lastModified}`,
          arrayBuffer: () => file.arrayBuffer(),
        });
        continue;
      }
      try {
        showMessage(`正在解压 ${file.name}…`);
        const lowerName = file.name.toLowerCase();
        const archiveType = lowerName.endsWith(".rar") ? "rar" : lowerName.endsWith(".7z") ? "7z" : "zip";
        const extractWithArchiveEngine = ArchiveEngine?.extractCsvEntriesFromArchive
          || ArchiveEngine?.extractCsvEntriesFrom7z;
        if (archiveType !== "zip" && !extractWithArchiveEngine) {
          throw new Error("7z/RAR 离线解压组件未加载，请刷新页面后重试");
        }
        const entries = archiveType !== "zip"
          ? await extractWithArchiveEngine(await file.arrayBuffer(), file.name)
          : await Core.extractCsvEntriesFromZip(await file.arrayBuffer(), file.name);
        if (!entries.length) {
          errors.push(`${file.name}：压缩包内没有 CSV 文件`);
          continue;
        }
        entries.forEach((entry) => {
          const entryBytes = entry.bytes;
          csvFiles.push({
            name: `${file.name} / ${entry.name}`,
            size: entry.size,
            lastModified: file.lastModified,
            sourceArchive: file.name,
            signature: `${archiveType}:${file.name}|${file.size}|${file.lastModified}|${entry.name}|${entry.size}`,
            arrayBuffer: async () => entryBytes.buffer.slice(entryBytes.byteOffset, entryBytes.byteOffset + entryBytes.byteLength),
          });
        });
      } catch (error) {
        errors.push(`${file.name}：${error.message}`);
      }
    }

    let addedDetails = 0;
    let addedSummaries = 0;
    let addedFactoryReports = 0;
    for (const file of csvFiles) {
      const signature = file.signature;
      if (state.files.some((item) => item.signature === signature)
        || state.summaryReports.some((item) => item.signature === signature)) continue;
      try {
        const text = await readTextWithEncoding(file);
        const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const isSummary = Core.isSummaryReportText?.(text, file.name);
        const parsed = isSummary
          ? Core.parseSummaryReportText(text, file.name, id)
          : Core.parseFtFileText(text, file.name, id);
        parsed.signature = signature;
        parsed.size = file.size;
        parsed.sourceArchive = file.sourceArchive || "";
        if (isSummary) {
          state.summaryReports.push(parsed);
          addedSummaries += 1;
        } else {
          state.files.push(parsed);
          addedDetails += 1;
        }
      } catch (error) {
        errors.push(`${file.name}：${error.message}`);
      }
    }
    for (const file of xlsxFiles) {
      const signature = `xlsx:${file.name}|${file.size}|${file.lastModified}`;
      if (state.factoryReports.some((item) => item.signature === signature)) continue;
      try {
        const parsed = await Core.parseFactoryYieldWorkbook(await file.arrayBuffer(), file.name);
        parsed.signature = signature;
        parsed.size = file.size;
        parsed.lastModified = file.lastModified;
        state.factoryReports.push(parsed);
        addedFactoryReports += 1;
      } catch (error) {
        errors.push(`${file.name}：${error.message}`);
      }
    }
    el.fileInput.value = "";

    const added = addedDetails + addedSummaries + addedFactoryReports;
    if (added) {
      state.files = Core.sortFilesChronologically(state.files);
      state.summaryReports = Core.sortFilesChronologically(state.summaryReports);
      state.filterId = "all";
      state.selectedTest = "";
      state.selectedOverviewFailReason = "";
      state.selectedFailReason = "all";
      state.selectedDistributionReason = "";
      state.distributionLimits.clear();
      state.detailPage = 1;
      updateFileFilter();
      analyzeAndRender();
    }
    const loadedText = [
      addedDetails ? `${addedDetails} 个明细 CSV` : "",
      addedSummaries ? `${addedSummaries} 个 Summary 汇总报告` : "",
      addedFactoryReports ? `${addedFactoryReports} 个工厂良率 XLSX` : "",
    ].filter(Boolean).join("、");
    if (errors.length) showMessage(`已载入 ${loadedText || "0 个文件"}；${errors.join("；")}`, "error");
    else if (!state.files.length) {
      showMessage(`已载入 ${loadedText}；请继续添加明细 CSV 进行匹配分析。`, "success");
    } else if (added) {
      const summaryHint = addedSummaries ? "；Summary 已独立收纳，可在“分析范围”中选择查看" : "";
      const factoryHint = addedFactoryReports ? "；工厂良率报告已作为最终良率锚点" : "";
      showMessage(`已载入 ${loadedText}，共 ${formatInteger(state.analysis.total)} 条逐颗测试记录${summaryHint}${factoryHint}。`, "success");
    }
    else showMessage("这些文件已经载入，无需重复添加。", "error");
  }

  async function readTextWithEncoding(file) {
    const buffer = await file.arrayBuffer();
    let utf8 = "";
    try {
      utf8 = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    } catch (_) {
      return new TextDecoder("gb18030").decode(buffer);
    }
    const replacementRatio = (utf8.match(/\uFFFD/g) || []).length / Math.max(utf8.length, 1);
    return replacementRatio > 0.001 ? new TextDecoder("gb18030").decode(buffer) : utf8;
  }

  function updateFileFilter() {
    const summaryFilterId = state.filterId.startsWith("summary:") ? state.filterId.slice(8) : "";
    const current = state.files.some((file) => file.id === state.filterId)
      || state.summaryReports.some((report) => report.id === summaryFilterId)
      ? state.filterId
      : "all";
    const extras = [
      state.summaryReports.length ? `${state.summaryReports.length} 个 Summary 可选` : "",
      state.factoryReports.length ? `${state.factoryReports.length} 个工厂 XLSX 锚点` : "",
    ].filter(Boolean).join("；");
    const totalLabel = extras
      ? `全部明细 CSV（${state.files.length}；另有 ${extras}）`
      : `全部明细 CSV 汇总（${state.files.length}）`;
    const detailOptions = state.files.map((file) => {
      const time = file.fileTimeLabel ? `${file.fileTimeLabel} · ` : "";
      return `<option value="${escapeHtml(file.id)}">${escapeHtml(time)}${escapeHtml(file.testType || "初测")} ${escapeHtml(file.stage)} · ${escapeHtml(file.format || "未知")} · ${escapeHtml(rangeFileName(file))}</option>`;
    }).join("");
    const summaryOptions = state.summaryReports.map((report) => {
      const time = report.fileTimeLabel ? `${report.fileTimeLabel} · ` : "";
      return `<option value="summary:${escapeHtml(report.id)}">${escapeHtml(time)}${escapeHtml(report.stage)} · ${escapeHtml(rangeFileName(report))}</option>`;
    }).join("");
    el.fileFilter.innerHTML = `
      <option value="all">${totalLabel}</option>
      ${detailOptions ? `<optgroup label="明细 CSV">${detailOptions}</optgroup>` : ""}
      ${summaryOptions ? `<optgroup label="Summary 汇总报告（独立查看）">${summaryOptions}</optgroup>` : ""}`;
    state.filterId = current;
    el.fileFilter.value = current;
  }

  function analyzeAndRender() {
    const summaryFilterId = state.filterId.startsWith("summary:") ? state.filterId.slice(8) : "";
    const detailFilterId = summaryFilterId ? "__summary_only__" : state.filterId;
    el.analysisMode.disabled = Boolean(summaryFilterId);
    el.analysisMode.title = summaryFilterId ? "Summary 使用报告自身口径独立查看" : "";
    state.analysis = Core.analyze(state.files, detailFilterId);
    state.factoryAnalysis = summaryFilterId
      ? null
      : Core.analyzeFactory?.(state.files, detailFilterId) || null;
    state.productionFlow = summaryFilterId
      ? null
      : Core.analyzeProductionFlow?.(state.analysis.selectedFiles, state.factoryReports, state.productionOverrides) || null;
    const reports = summaryFilterId
      ? state.summaryReports.filter((report) => report.id === summaryFilterId)
      : [];
    state.summaryAggregate = reports.length
      ? Core.aggregateSummaryReports?.(reports) || null
      : null;
    state.distributionCache.clear();
    el.workspace.hidden = false;
    updateTabAvailability();
    renderSummary();
    renderFactoryPanel();
    renderSummaryReports();
    renderFailOverview();
    renderFailDistribution();
    renderStability();
    renderFailDetails();
    renderFiles();
    renderDataAudit();
    renderReleaseLog();
    requestAnimationFrame(drawVisibleCharts);
  }

  function updateTabAvailability() {
    const hasDetails = Boolean(state.analysis?.selectedFiles.length);
    document.querySelectorAll(".tab[data-tab]").forEach((button) => {
      const requiresDetails = ["distribution", "stability", "details"].includes(button.dataset.tab);
      button.disabled = requiresDetails && !hasDetails;
      if (requiresDetails) button.title = hasDetails ? "" : "当前分析范围不含逐颗实测值";
    });
    if (!hasDetails && ["distribution", "stability", "details"].includes(state.activeTab)) {
      switchTab("overview");
    }
  }

  function renderSummary() {
    const a = state.analysis;
    const summaryOnly = !a.total && Boolean(state.summaryAggregate?.reports.length);
    if (["initial", "factory"].includes(state.analysisMode) && !summaryOnly && state.productionFlow) {
      renderProductionSummaryCards(a, state.productionFlow, state.analysisMode);
      return;
    }
    const source = summaryOnly ? state.summaryAggregate : a;
    const failStats = summaryOnly ? state.summaryAggregate.failStats : a.failStats;
    const topFail = failStats[0];
    const product = productSummary(summaryOnly, a);
    const timeContext = source.testTimeMs === null
      ? (summaryOnly ? "Summary 未提供模块时间" : "CSV 未提供测试时间")
      : summaryOnly
        ? "来自 Summary 模块时间合计"
        : a.testTimeSource === "metadata"
          ? "采用文件级测试时间"
          : a.testTimeSampleCount === a.total
            ? `${formatInteger(a.testTimeSampleCount)} 条记录均值`
            : `${formatInteger(a.testTimeSampleCount)} / ${formatInteger(a.total)} 条有效记录均值`;
    const cards = [
      {
        label: "产品名称",
        value: escapeHtml(product.value),
        context: product.context,
        className: "product",
        title: product.title,
      },
      {
        label: summaryOnly ? "报告总数" : "测试记录",
        value: formatInteger(source.total),
        context: summaryOnly
          ? `${formatInteger(state.summaryAggregate.uniqueReportCount)} 个 Summary · 无逐颗数据`
          : `${a.selectedFiles.length} 个明细 CSV`,
        className: "",
      },
      { label: "Pass", value: formatInteger(source.pass), context: source.total ? `${formatPercent(source.yield)} 良率` : "—", className: "pass" },
      { label: "Fail", value: formatInteger(source.fail), context: source.total ? `${formatPercent(1 - source.yield)} 失效率` : "—", className: "fail" },
      { label: "首要 Fail 项", value: topFail ? escapeHtml(topFail.reason) : "—", context: topFail ? `${formatInteger(topFail.count)} 次 · 占 Fail ${formatPercent(topFail.failShare)}` : "未发现 Fail", className: "top-fail" },
      {
        label: "单颗测试时间",
        value: source.testTimeMs !== null ? `${formatDecimal(source.testTimeMs, 1)} ms` : "—",
        context: timeContext,
        className: "test-time",
      },
      {
        label: "UPH",
        value: source.uph !== null ? formatInteger(Math.round(source.uph)) : "—",
        context: `含 ${formatInteger(source.indexTimeMs)} ms Index 时间${summaryOnly ? " · 理论估算" : ""}`,
        className: "uph",
        title: "UPH = 3600 ÷ (单颗测试时间 ms + 150 ms) × 1000",
      },
      {
        label: "日产出",
        value: source.dailyOutput !== null ? formatInteger(Math.round(source.dailyOutput)) : "—",
        context: `${formatInteger(source.dailyHours)} 小时 × ${formatPercent(source.utilization)} 稼动率${summaryOnly ? " · 理论估算" : ""}`,
        className: "daily-output",
        title: "日产出 = UPH × 20 小时 × 85%",
      },
    ];
    el.summaryCards.innerHTML = cards.map((card) => `
      <article class="summary-card ${card.className}"${card.title ? ` title="${escapeHtml(card.title)}"` : ""}>
        <div class="label">${card.label}</div>
        <div class="value">${card.value}</div>
        <div class="context">${card.context}</div>
      </article>`).join("");
  }

  function renderFactorySummaryCards(analysis, factory) {
    const product = productSummary(false, analysis);
    const initial = factory.initial;
    const yieldText = factory.yield === null ? "—" : formatPercent(factory.yield);
    const cards = [
      { label: "产品名称", value: escapeHtml(product.value), context: product.context, className: "product", title: product.title },
      { label: "有效投入（估算）", value: formatInteger(factory.effectiveInput), context: `${factory.roles.initial.length} 个初测 CSV`, className: "" },
      { label: "主产品产出", value: formatInteger(factory.mainOutput), context: "HBin1", className: "pass" },
      { label: "工厂良率（估算）", value: yieldText, context: "HBin1 ÷ 初测投入", className: factory.yield !== null && factory.yield >= 0.95 ? "pass" : "fail" },
      { label: "HBin8", value: formatInteger(initial.hbin8), context: initial.total ? formatPercent(initial.hbin8 / initial.total) : "—", className: "uph" },
      { label: "电性", value: formatInteger(initial.electrical), context: `HBin3 · ${initial.total ? formatPercent(initial.electrical / initial.total) : "—"}`, className: "fail" },
      { label: "O/S", value: formatInteger(initial.openShort), context: `HBin5 · ${initial.total ? formatPercent(initial.openShort / initial.total) : "—"}`, className: "fail" },
      { label: "其他处置", value: formatInteger(initial.other), context: initial.total ? formatPercent(initial.other / initial.total) : "—", className: "top-fail" },
    ];
    el.summaryCards.innerHTML = cards.map((card) => `
      <article class="summary-card ${card.className}"${card.title ? ` title="${escapeHtml(card.title)}"` : ""}>
        <div class="label">${card.label}</div>
        <div class="value">${card.value}</div>
        <div class="context">${card.context}</div>
      </article>`).join("");
  }

  function renderProductionSummaryCards(analysis, flow, mode) {
    const product = productSummary(false, analysis);
    const initial = flow.productionInitial;
    const finalMode = mode === "factory";
    const factory = flow.factory;
    const cards = finalMode ? [
      { label: "产品名称", value: escapeHtml(product.value), context: product.context, className: "product", title: product.title },
      { label: "工厂投入", value: factory ? formatInteger(factory.input) : "待确认", context: factory ? `${factory.rows.length} 条工厂报告记录` : "未匹配工厂 XLSX", className: "" },
      { label: "最终产出", value: factory ? formatInteger(factory.output) : "—", context: factory ? "采用工厂报告" : "缺少可靠最终结果", className: "pass" },
      { label: "最终工厂良率", value: factory?.yield === null || !factory ? "待确认" : formatPercent(factory.yield), context: factory ? "最终产出 ÷ 工厂投入" : `${formatPercent(initial.yield || 0)}～100% 估算范围`, className: !factory ? "" : factory.yield >= 0.95 ? "pass" : "fail" },
      { label: "推算复测恢复", value: flow.inferredRecovered === null ? "—" : formatInteger(flow.inferredRecovered), context: "工厂产出－正式初测 Pass", className: "uph" },
      { label: "最终不良", value: flow.inferredFinalFail === null ? "—" : formatInteger(flow.inferredFinalFail), context: "工厂投入－最终产出", className: "fail" },
      { label: "电性 / O/S", value: factory ? `${formatInteger(factory.electrical)} / ${formatInteger(factory.openShort)}` : "—", context: "来自工厂良率报告", className: "top-fail" },
      { label: "数据置信度", value: confidenceText(flow.confidence), context: factory ? "工厂报告已匹配" : "需补充报告或人工确认", className: "" },
    ] : [
      { label: "产品名称", value: escapeHtml(product.value), context: product.context, className: "product", title: product.title },
      { label: "正式初测投入", value: formatInteger(initial.total), context: `${flow.ranges.length} 个初测 CSV`, className: "" },
      { label: "初测 Pass", value: formatInteger(initial.mainPass), context: "HBin1", className: "pass" },
      { label: "正式初测良率", value: initial.yield === null ? "—" : formatPercent(initial.yield), context: "HBin1 ÷ 正式初测投入", className: initial.yield >= 0.95 ? "pass" : "fail" },
      { label: "排除工程记录", value: formatInteger(flow.rawInitial.total - initial.total), context: "正式起点之前", className: "uph" },
      { label: "初测不良", value: formatInteger(initial.nonMain), context: initial.total ? formatPercent(initial.nonMain / initial.total) : "—", className: "fail" },
      { label: "复测事件", value: formatInteger(flow.retest.total), context: "单列，不重复计入投入", className: "top-fail" },
      { label: "数据置信度", value: confidenceText(flow.confidence), context: flow.factory ? "工厂投入已锚定" : "可人工确认起点", className: "" },
    ];
    el.summaryCards.innerHTML = cards.map((card) => `
      <article class="summary-card ${card.className}"${card.title ? ` title="${escapeHtml(card.title)}"` : ""}>
        <div class="label">${card.label}</div>
        <div class="value">${card.value}</div>
        <div class="context">${card.context}</div>
      </article>`).join("");
  }

  function confidenceText(level) {
    return ({ high: "高", medium: "中", low: "低", confirmed: "已确认" })[level] || "待确认";
  }

  function renderFactoryPanel() {
    const flow = state.productionFlow;
    const summaryOnly = !state.analysis?.total && Boolean(state.summaryAggregate?.reports.length);
    const visible = ["initial", "factory"].includes(state.analysisMode) && !summaryOnly && Boolean(flow);
    el.factoryPanel.hidden = !visible;
    if (!visible) return;
    const confidence = flow.confidence;
    el.factoryStatus.className = `badge ${confidence === "high" ? "pass" : confidence === "medium" ? "watch" : "fail"}`;
    el.factoryStatus.textContent = `${confidenceText(confidence)}置信度`;
    const matched = flow.factory?.rows.length || 0;
    const reportRows = state.factoryReports.reduce((sum, report) => sum + (report.rows?.length || 0), 0);
    el.factoryAnchorSummary.innerHTML = `
      <strong>工厂报告锚点</strong>
      <span>${state.factoryReports.length ? `${formatInteger(state.factoryReports.length)} 个 XLSX · ${formatInteger(reportRows)} 行 · 匹配 ${formatInteger(matched)} 行` : "尚未导入工厂良率 XLSX"}</span>
      ${state.factoryReports.length ? `<span class="truncate" title="${escapeHtml(state.factoryReports.map((item) => item.name).join("；"))}">${escapeHtml(state.factoryReports.map((item) => item.name).join("；"))}</span>` : ""}`;
    const metrics = state.analysisMode === "factory" ? [
      ["工厂投入", flow.factory ? formatInteger(flow.factory.input) : "待确认"],
      ["最终产出", flow.factory ? formatInteger(flow.factory.output) : "待确认"],
      ["最终良率", flow.factory?.yield === null || !flow.factory ? "待确认" : formatPercent(flow.factory.yield)],
      ["推算恢复", flow.inferredRecovered === null ? "—" : `${formatInteger(flow.inferredRecovered)} 条`],
      ["最终不良", flow.inferredFinalFail === null ? "—" : `${formatInteger(flow.inferredFinalFail)} 条`],
      ["复测事件", `${formatInteger(flow.retest.total)} 条 · 不重复投入`],
    ] : [
      ["原始初测记录", formatInteger(flow.rawInitial.total)],
      ["正式初测投入", formatInteger(flow.productionInitial.total)],
      ["排除工程记录", formatInteger(flow.rawInitial.total - flow.productionInitial.total)],
      ["初测 Pass", formatInteger(flow.productionInitial.mainPass)],
      ["初测不良", formatInteger(flow.productionInitial.nonMain)],
      ["正式初测良率", flow.productionInitial.yield === null ? "—" : formatPercent(flow.productionInitial.yield)],
    ];
    el.factoryMetrics.innerHTML = metrics.map(([label, value]) => `
      <div class="factory-audit-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>`).join("");
    el.factoryRangeTableBody.innerHTML = flow.ranges.length ? flow.ranges.map((range) => `
      <tr>
        <td><span class="truncate" title="${escapeHtml(range.file.name)}">${escapeHtml(shortName(range.file.name, 40))}</span></td>
        <td>${formatInteger(range.file.records.length)}</td>
        <td><input class="production-start-input" type="number" min="1" max="${range.file.records.length}" value="${range.startSequence}" data-production-start="${escapeHtml(range.file.id)}" aria-label="${escapeHtml(range.file.name)} 正式生产起始序号"></td>
        <td>${formatInteger(range.excluded)}</td>
        <td>${formatInteger(range.included)}</td>
        <td>${rangeSourceText(range.source)} · ${confidenceText(range.confidence)}</td>
        <td><button class="text-button" type="button" data-reset-production-start="${escapeHtml(range.file.id)}">恢复自动</button></td>
      </tr>`).join("") : `<tr><td colspan="7" class="empty-state">当前范围没有初测 CSV</td></tr>`;
    const warnings = flow.warnings.length ? flow.warnings : ["生产区间与工厂投入已匹配；仍建议核对批号和 HBin 规则。"];
    el.factoryWarnings.innerHTML = `
      <strong>口径说明</strong>
      <ul>${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>
      <p>下方 Pareto、趋势和 Fail 明细仍展示测试事件。没有跨文件唯一产品 ID 时，软件只推算恢复数量，不伪造逐颗复测关联。</p>`;
  }

  function rangeSourceText(source) {
    return ({ "factory-anchor": "工厂投入锚定", manual: "人工确认", "all-initial": "全部初测估算" })[source] || source;
  }

  function productSummary(summaryOnly, analysis) {
    const sources = summaryOnly ? state.summaryAggregate?.reports || [] : analysis.selectedFiles;
    const products = [...new Set(sources.map((file) => {
      return Core.metadataValue(file, "Product")
        || Core.metadataValue(file, "Product Model")
        || Core.metadataValue(file, "Device")
        || "";
    }).filter(Boolean))];
    if (!products.length) {
      return {
        value: "—",
        context: "CSV 未提供产品 / 设备字段",
        title: "",
      };
    }
    if (products.length === 1) {
      return {
        value: products[0],
        context: summaryOnly ? "来自 Summary 产品 / 设备字段" : `${sources.length} 个明细 CSV`,
        title: products[0],
      };
    }
    return {
      value: "多产品汇总",
      context: `${products.length} 个产品 · ${sources.length} 个文件`,
      title: products.join("；"),
    };
  }

  function renderSummaryReports() {
    const aggregate = state.summaryAggregate;
    const report = aggregate?.reports[0];
    if (!report || !state.filterId.startsWith("summary:")) {
      el.summaryReportPanel.hidden = true;
      return;
    }
    el.summaryReportPanel.hidden = false;
    const check = report.consistency;
    const issues = [
      !check.passFailMatchesTotal ? "Pass + Fail 与 Total 不一致" : "",
      !check.yieldMatchesCounts ? "报告良率与 Pass / Total 不一致" : "",
      !check.binMatchesTotal ? "Bin 合计与 Total 不一致" : "",
      !check.failCountsMatchFail ? "FailCount 合计与 Fail 不一致" : "",
    ].filter(Boolean);
    const internallyValid = !issues.length;
    el.summaryReportStatus.textContent = internallyValid ? "报告内部一致" : `内部有 ${issues.length} 项差异`;
    el.summaryReportStatus.className = `badge ${internallyValid ? "pass" : "fail"}`;
    el.summaryReportStatus.title = issues.join("；");
    el.summaryReportHint.textContent = "该 Summary 独立显示，不与同压缩包中的明细 CSV 自动关联，也不计入逐颗测试记录。";
    el.summaryReportMetrics.innerHTML = [
      ["报告 Total", formatInteger(report.total)],
      ["Pass", formatInteger(report.pass)],
      ["Fail", formatInteger(report.fail)],
      ["良率", formatYieldPrecise(report.yield)],
      ["模块时间", report.testTimeMs === null ? "—" : `${formatDecimal(report.testTimeMs, 1)} ms`],
      ["理论 UPH", report.uph === null ? "—" : formatInteger(Math.round(report.uph))],
      ["理论日产出", report.dailyOutput === null ? "—" : formatInteger(Math.round(report.dailyOutput))],
    ].map(([label, value]) => `
      <div class="mini-metric">
        <span class="label">${label}</span>
        <span class="value">${value}</span>
      </div>`).join("");

    el.summaryReportTableBody.innerHTML = `
      <tr>
        <td><span class="badge ${internallyValid ? "pass" : "fail"}" title="${escapeHtml(issues.join("；"))}">${internallyValid ? "一致" : `${issues.length} 项差异`}</span></td>
        <td><span class="truncate" title="${escapeHtml(report.name)}">${escapeHtml(shortName(report.name, 48))}</span></td>
        <td>${formatInteger(report.total)}</td>
        <td>${formatInteger(report.pass)}</td>
        <td>${formatInteger(report.fail)}</td>
        <td>${formatYieldPrecise(report.yield)}</td>
        <td>${report.testTimeMs === null ? "—" : `${formatDecimal(report.testTimeMs, 1)} ms`}</td>
        <td>${report.uph === null ? "—" : formatInteger(Math.round(report.uph))}</td>
        <td>${report.dailyOutput === null ? "—" : formatInteger(Math.round(report.dailyOutput))}</td>
      </tr>`;

    el.summaryBinTableBody.innerHTML = aggregate.bins.length
      ? aggregate.bins.map((item) => `
        <tr>
          <td>${escapeHtml(item.sbin)}</td>
          <td>${escapeHtml(item.hbin)}</td>
          <td><strong>${escapeHtml(item.description)}</strong></td>
          <td>${formatInteger(item.count)}</td>
          <td>${formatPercent(item.share)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="empty-state">Summary 中没有 SBin/HBin 数据</td></tr>`;

    el.summaryFailTableBody.innerHTML = aggregate.failStats.length
      ? aggregate.failStats.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(item.reason)}</strong></td>
          <td>${formatInteger(item.count)}</td>
          <td>${formatPercent(item.failShare)}</td>
          <td>${formatPercent(item.totalShare)}</td>
        </tr>`).join("")
      : `<tr><td colspan="5" class="empty-state">Summary 中没有 FailCount 数据</td></tr>`;
  }

  function overviewFailStats() {
    if (state.analysis?.total) return state.analysis.failStats;
    return state.summaryAggregate?.failStats || [];
  }

  function renderFailOverview() {
    const a = state.analysis;
    const failStats = overviewFailStats();
    const summaryOnly = !a.total && failStats.some((item) => item.source === "summary");
    if (!failStats.some((item) => item.reason === state.selectedOverviewFailReason)) {
      state.selectedOverviewFailReason = failStats[0]?.reason || "";
    }
    renderFailFocusCard(failStats, summaryOnly);

    el.failReasonFilter.innerHTML = `<option value="all">全部 Fail 项</option>` + a.failStats.map((item) => {
      return `<option value="${escapeHtml(item.reason)}">${escapeHtml(item.reason)}（${item.count}）</option>`;
    }).join("");
    if (!a.failStats.some((item) => item.reason === state.selectedFailReason)) state.selectedFailReason = "all";
    el.failReasonFilter.value = state.selectedFailReason;
    const blocks = a.yieldTrend;
    el.yieldTrendHint.textContent = blocks.length
      ? `每段约 ${formatInteger(blocks[0].count)} 条记录，共 ${blocks.length} 段`
      : summaryOnly
        ? "Summary 不含逐颗测试顺序"
        : "没有可用记录";
  }

  function renderFailFocusCard(failStats = overviewFailStats(), summaryOnly = false) {
    if (!failStats.length) {
      el.failFocusContent.innerHTML = `<div class="empty-state fail-focus-empty">当前范围没有 Fail 记录</div>`;
      return;
    }

    const index = Math.max(0, failStats.findIndex((item) => item.reason === state.selectedOverviewFailReason));
    const item = failStats[index];
    const totalFail = state.analysis?.total
      ? state.analysis.fail
      : state.summaryAggregate?.fail || failStats.reduce((sum, current) => sum + current.count, 0);
    const totalRecords = state.analysis?.total || state.summaryAggregate?.total || 0;
    const low = Number(item.low) || 0;
    const high = Number(item.high) || 0;
    const unknown = (Number(item.unknown) || 0) + (Number(item.within) || 0);
    const directionTotal = low + high + unknown;
    const lowShare = directionTotal ? low / directionTotal : 0;
    const highShare = directionTotal ? high / directionTotal : 0;
    const unknownShare = directionTotal ? unknown / directionTotal : 0;
    const detailAvailable = Boolean(state.analysis?.selectedFiles?.length) && !summaryOnly;
    const rankLabel = index === 0 ? "首要原因" : index < 3 ? "主要原因" : `第 ${index + 1} 项`;
    const failShare = Number(item.failShare) || 0;
    const totalShare = Number(item.totalShare) || 0;

    el.failFocusContent.innerHTML = `
      <div class="fail-focus-toolbar">
        <div class="fail-focus-selection">
          <span class="fail-focus-rank">#${index + 1} · ${rankLabel}</span>
          <strong>${escapeHtml(item.reason)}</strong>
          <span>${formatInteger(item.count)} 次 Fail</span>
        </div>
        <div class="fail-focus-navigation" aria-label="Pareto 排名切换">
          <button class="secondary-button" type="button" data-fail-focus-action="previous"${index === 0 ? " disabled" : ""}>← 上一项</button>
          <span>${index + 1} / ${failStats.length}</span>
          <button class="secondary-button" type="button" data-fail-focus-action="next"${index === failStats.length - 1 ? " disabled" : ""}>下一项 →</button>
        </div>
      </div>
      <div class="fail-focus-grid">
        <section class="fail-focus-card fail-focus-composition">
          <div class="fail-share-ring" style="--fail-share: ${Math.max(0, Math.min(100, failShare * 100))}">
            <strong>${formatPercent(failShare)}</strong>
            <span>Fail 占比</span>
          </div>
          <div class="fail-focus-copy">
            <span class="fail-focus-label">Fail 构成</span>
            <strong>${formatInteger(item.count)} / ${formatInteger(totalFail)} Fail</strong>
            <p>该测试项占全部 Fail 的 ${formatPercent(failShare)}</p>
          </div>
        </section>
        <section class="fail-focus-card fail-focus-impact">
          <span class="fail-focus-label">批次影响</span>
          <strong class="fail-focus-large">${formatPercent(totalShare)}</strong>
          <p>${formatInteger(item.count)} / ${formatInteger(totalRecords)} 条测试记录</p>
          <div class="fail-impact-track"><i style="width:${Math.max(0, Math.min(100, totalShare * 100))}%"></i></div>
        </section>
        <section class="fail-focus-card fail-focus-direction">
          <span class="fail-focus-label">超限方向</span>
          ${summaryOnly ? `
            <div class="fail-direction-unavailable">Summary 汇总报告不含偏低/偏高方向数据</div>` : `
            <div class="fail-direction-track" aria-label="偏低、偏高和无法判定占比">
              <i class="is-low" style="width:${lowShare * 100}%"></i>
              <i class="is-high" style="width:${highShare * 100}%"></i>
              <i class="is-unknown" style="width:${unknownShare * 100}%"></i>
            </div>
            <div class="fail-direction-values">
              <span><i class="is-low"></i>偏低 <strong>${formatInteger(low)}</strong><small>${formatPercent(lowShare)}</small></span>
              <span><i class="is-high"></i>偏高 <strong>${formatInteger(high)}</strong><small>${formatPercent(highShare)}</small></span>
              <span><i class="is-unknown"></i>无法判定 <strong>${formatInteger(unknown)}</strong><small>${formatPercent(unknownShare)}</small></span>
            </div>`}
        </section>
      </div>
      <div class="fail-focus-actions">
        <p>${detailAvailable ? "继续查看该测试项的实测分布或逐颗 Fail 记录。" : "当前选择为 Summary 汇总报告，详细分布与逐颗记录不可用。"}</p>
        <div>
          <button class="secondary-button" type="button" data-fail-focus-action="details"${detailAvailable ? "" : " disabled"}>查看 Fail 明细</button>
          <button class="primary-button" type="button" data-fail-focus-action="distribution"${detailAvailable ? "" : " disabled"}>查看超限分布</button>
        </div>
      </div>`;
  }

  function selectOverviewFailReason(reason) {
    const failStats = overviewFailStats();
    if (!failStats.some((item) => item.reason === reason)) return;
    state.selectedOverviewFailReason = reason;
    const summaryOnly = !state.analysis.total && failStats.some((item) => item.source === "summary");
    renderFailFocusCard(failStats, summaryOnly);
    drawParetoChart();
  }

  function moveOverviewFailSelection(offset) {
    const failStats = overviewFailStats();
    const index = failStats.findIndex((item) => item.reason === state.selectedOverviewFailReason);
    const target = failStats[index + offset];
    if (target) selectOverviewFailReason(target.reason);
  }

  function renderFailDistribution() {
    if (!state.analysis) return;
    const reasons = state.analysis.failStats;
    const testNames = distributionTestNames();
    if (!testNames.includes(state.selectedDistributionReason)) {
      const preferred = testNames.includes(state.selectedTest) ? state.selectedTest : "";
      const fallback = preferred || reasons[0]?.reason || testNames[0] || "";
      if (fallback) setCurrentTestItem(fallback);
    }
    updateDistributionTestSelect(testNames);
    renderDistributionFailList();
    renderSelectedDistribution();
  }

  function distributionTestNames() {
    if (!state.analysis) return [];
    const names = [];
    const seen = new Set();
    state.analysis.selectedFiles.forEach((file) => {
      file.tests.forEach((test) => {
        if (!seen.has(test.name)) {
          seen.add(test.name);
          names.push(test.name);
        }
      });
    });
    state.analysis.failStats.forEach((item) => {
      if (!seen.has(item.reason)) {
        seen.add(item.reason);
        names.push(item.reason);
      }
    });
    return names;
  }

  function updateDistributionTestSelect(testNames = distributionTestNames()) {
    const failStatMap = new Map(state.analysis.failStats.map((item) => [item.reason, item]));
    const maxFailCount = Math.max(1, ...state.analysis.failStats.map((item) => item.count));
    const failNames = testNames.filter((name) => (failStatMap.get(name)?.count || 0) > 0);
    const passOnlyNames = testNames.filter((name) => !failStatMap.has(name) || !failStatMap.get(name)?.count);
    if (passOnlyNames.includes(state.selectedDistributionReason)) state.showAllDistributionTests = true;
    const renderOptions = (names) => names.map((name) => {
      const stat = failStatMap.get(name);
      const failCount = stat?.count || 0;
      const fillWidth = failCount ? Math.max(5, (failCount / maxFailCount) * 100) : 0;
      const selectedClass = name === state.selectedDistributionReason ? " is-selected" : "";
      const failLabel = failCount ? `<span class="distribution-test-count">${formatInteger(failCount)}</span>` : "";
      return `<button class="distribution-test-option${selectedClass}" type="button" role="option"
          aria-selected="${name === state.selectedDistributionReason}" data-distribution-test="${escapeHtml(name)}"
          title="${escapeHtml(name)}${failCount ? ` · Fail ${formatInteger(failCount)} · 占当前批次 ${formatPercent(stat.totalShare)}` : ""}">
        ${failCount ? `<i class="distribution-test-fill" style="width:${fillWidth.toFixed(2)}%"></i>` : ""}
        <span class="distribution-test-name">${escapeHtml(name)}</span>${failLabel}
      </button>`;
    }).join("");
    el.distributionTestMenu.innerHTML = `
      <div class="distribution-test-group-label">有 Fail 的测试项 <span>${formatInteger(failNames.length)}</span></div>
      ${renderOptions(failNames) || '<div class="distribution-test-empty">当前范围没有归因 Fail 项</div>'}
      ${state.showAllDistributionTests && passOnlyNames.length ? `
        <div class="distribution-test-group-label is-pass-only">无 Fail / 仅 Pass 测试项 <span>${formatInteger(passOnlyNames.length)}</span></div>
        ${renderOptions(passOnlyNames)}` : ""}
      <button class="distribution-test-toggle" type="button" data-toggle-all-tests="true" aria-expanded="${state.showAllDistributionTests}">
        ${state.showAllDistributionTests ? "收起无 Fail 测试项" : `显示全部测试项（另有 ${formatInteger(passOnlyNames.length)} 项）`}
      </button>`;
    syncDistributionPickerSelection();
    setDistributionPickerOpen(state.distributionPickerOpen && Boolean(testNames.length));
  }

  function syncDistributionPickerSelection() {
    const selected = state.analysis?.failStats.find((item) => item.reason === state.selectedDistributionReason);
    el.distributionTestButton.disabled = !state.selectedDistributionReason && !el.distributionTestMenu.children.length;
    el.distributionTestButton.textContent = state.selectedDistributionReason
      ? `${state.selectedDistributionReason}${selected ? ` · Fail ${formatInteger(selected.count)}` : ""}`
      : "选择测试项";
    el.distributionTestButton.title = el.distributionTestButton.textContent;
    el.distributionTestMenu.querySelectorAll("button[data-distribution-test]").forEach((option) => {
      const selectedOption = option.dataset.distributionTest === state.selectedDistributionReason;
      option.classList.toggle("is-selected", selectedOption);
      option.setAttribute("aria-selected", String(selectedOption));
    });
  }

  function setDistributionPickerOpen(open) {
    state.distributionPickerOpen = Boolean(open) && !el.distributionTestButton.disabled;
    el.distributionTestMenu.hidden = !state.distributionPickerOpen;
    el.distributionTestButton.setAttribute("aria-expanded", String(state.distributionPickerOpen));
  }

  function renderDistributionFailList() {
    if (!state.analysis) return;
    const rows = state.analysis.failStats;
    if (!rows.length) {
      el.distributionFailTableBody.innerHTML = `<tr><td colspan="4" class="empty-state">当前范围没有 Fail 测试项</td></tr>`;
      return;
    }
    el.distributionFailTableBody.innerHTML = rows.map((item) => `
      <tr class="clickable-row${item.reason === state.selectedDistributionReason ? " is-selected" : ""}"
          data-reason="${escapeHtml(item.reason)}"
          aria-selected="${item.reason === state.selectedDistributionReason}">
        <td><strong class="distribution-reason" title="${escapeHtml(item.reason)}">${escapeHtml(item.reason)}</strong></td>
        <td>${failTotalStat(item.count, item.totalShare)}</td>
        <td>${failDirectionStat(item.low, item.count)}</td>
        <td>${failDirectionStat(item.high, item.count)}</td>
      </tr>`).join("");
  }

  function renderSelectedDistribution() {
    const reason = state.selectedDistributionReason;
    if (!state.analysis || !reason) {
      state.distributionResult = null;
      el.distributionTitle.textContent = "Fail 数据分布";
      el.distributionHint.textContent = "当前范围没有 Fail 项";
      el.distributionStats.innerHTML = "";
      el.distributionDetailButton.disabled = true;
      updateRangeModeButton(null);
      setLimitControlsDisabled(true);
      el.yieldSimulation.innerHTML = "";
      el.limitSimulationNote.textContent = "当前范围没有可模拟的 Fail 项";
      if (state.activeTab === "distribution") {
        requestAnimationFrame(() => {
          drawEmptyChart(el.failSequenceChart, "当前范围没有 Fail 项");
          drawEmptyChart(el.failHistogramChart, "当前范围没有 Fail 项");
        });
      }
      return;
    }

    const result = distributionResultFor(reason);
    state.distributionResult = result;
    updateRangeModeButton(result);
    el.distributionTitle.textContent = `${reason} · ${result.attributedFail ? "超限分布" : "数据分布"}`;
    el.distributionDetailButton.disabled = result.attributedFail === 0;
    if (result.specVariant) {
      el.distributionHint.innerHTML = `检测到 <strong>${formatInteger(result.specs.length)}</strong> 种规格，超限按每个文件自己的上下限判定`;
    } else if (result.lower !== null || result.upper !== null) {
      el.distributionHint.innerHTML = `规格范围：${formatBounds(result.lower, result.upper, result.unit)}`;
    } else {
      el.distributionHint.textContent = "该测试项没有可用的规格上下限";
    }

    const metrics = [
      ["归因 Fail", formatInteger(result.attributedFail)],
      ["有效数值", formatInteger(result.total)],
      ["原规格低于下限", `<span class="${result.low ? "danger-text" : ""}">${formatInteger(result.low)}</span>`],
      ["原规格高于上限", `<span class="${result.high ? "danger-text" : ""}">${formatInteger(result.high)}</span>`],
      ["原规格超限率", result.total ? formatPercent(result.outOfSpec / result.total) : "—"],
      ["均值", formatMeasurement(result.mean, result.unit)],
      ["标准差", formatMeasurement(result.std, result.unit)],
      ["最小 / 最大", `${formatNumber(result.min)} / ${formatNumber(result.max)}${result.unit ? ` ${escapeHtml(result.unit)}` : ""}`],
    ];
    el.distributionStats.innerHTML = metrics.map(([label, value], index) => `
      <div class="mini-metric ${index < 2 ? "metric-primary" : "metric-secondary"}"><span class="label">${label}</span><span class="value">${value}</span></div>`).join("");
    renderLimitSimulator(result);
    if (state.activeTab === "distribution") requestAnimationFrame(drawDistributionCharts);
  }

  function selectDistributionReason(reason) {
    setCurrentTestItem(reason);
    setDistributionPickerOpen(false);
    syncDistributionPickerSelection();
    renderDistributionFailList();
    el.distributionTitle.textContent = `${reason} · 正在加载分布…`;
    el.distributionHint.textContent = "正在计算测试项统计并绘制图表";
    if (state.distributionRenderFrame) cancelAnimationFrame(state.distributionRenderFrame);
    state.distributionRenderFrame = requestAnimationFrame(() => {
      state.distributionRenderFrame = 0;
      if (state.selectedDistributionReason === reason) renderSelectedDistribution();
    });
  }

  function distributionResultFor(reason) {
    if (state.distributionCache.has(reason)) return state.distributionCache.get(reason);
    const result = Core.parameterDistribution(state.analysis, reason);
    state.distributionCache.set(reason, result);
    return result;
  }

  function getDistributionLimits(result = state.distributionResult) {
    if (!result || result.specVariant) return { lower: null, upper: null };
    const key = state.selectedDistributionReason;
    if (!state.distributionLimits.has(key)) {
      state.distributionLimits.set(key, { lower: result.lower, upper: result.upper });
    }
    return state.distributionLimits.get(key);
  }

  function setLimitControlsDisabled(disabled, result = null) {
    el.simulatedLowerInput.disabled = disabled || result?.lower === null;
    el.simulatedUpperInput.disabled = disabled || result?.upper === null;
    el.resetLimitsButton.disabled = disabled;
  }

  function updateRangeModeButton(result) {
    const canFocus = Boolean(
      result
      && !result.specVariant
      && result.lower !== null
      && result.upper !== null
      && result.upper > result.lower
    );
    el.rangeModeButton.disabled = !canFocus;
    el.rangeModeButton.textContent = canFocus
      ? (state.distributionFocus ? "显示全部范围" : "聚焦规格区")
      : "规格区不可用";
  }

  function renderLimitSimulator(result) {
    if (result.specVariant) {
      setLimitControlsDisabled(true);
      el.simulatedLowerInput.value = "";
      el.simulatedUpperInput.value = "";
      el.limitSimulationNote.textContent = "当前范围存在多种规格，请先在顶部选择单个文件后再模拟";
      el.yieldSimulation.innerHTML = `<div class="simulation-warning">多规格汇总时无法用一组 LSL / USL 准确模拟良率。</div>`;
      return;
    }

    const limits = getDistributionLimits(result);
    setLimitControlsDisabled(false, result);
    if (document.activeElement !== el.simulatedLowerInput) el.simulatedLowerInput.value = inputNumber(limits.lower);
    if (document.activeElement !== el.simulatedUpperInput) el.simulatedUpperInput.value = inputNumber(limits.upper);
    el.limitSimulationNote.textContent = "拖动两张图中的虚线会联动；也可以在输入框直接填写目标规格";
    renderYieldSimulation(result, limits);
  }

  function updateLimitFromInput(kind) {
    const result = state.distributionResult;
    if (!result || result.specVariant) return;
    const input = kind === "lower" ? el.simulatedLowerInput : el.simulatedUpperInput;
    const text = input.value.trim();
    const value = text === "" ? null : Number(text);
    if (value !== null && !Number.isFinite(value)) return;
    const current = getDistributionLimits(result);
    const next = { ...current, [kind]: value };
    state.distributionLimits.set(state.selectedDistributionReason, next);
    renderYieldSimulation(result, next);
    scheduleLimitChartRender();
  }

  function resetDistributionLimits() {
    const result = state.distributionResult;
    if (!result || result.specVariant) return;
    const limits = { lower: result.lower, upper: result.upper };
    state.distributionLimits.set(state.selectedDistributionReason, limits);
    el.simulatedLowerInput.value = inputNumber(limits.lower);
    el.simulatedUpperInput.value = inputNumber(limits.upper);
    renderYieldSimulation(result, limits);
    scheduleLimitChartRender();
  }

  function limitsAreValid(limits) {
    return limits.lower === null || limits.upper === null || limits.lower <= limits.upper;
  }

  function renderYieldSimulation(result, limits) {
    const valid = limitsAreValid(limits);
    el.simulatedLowerInput.classList.toggle("is-invalid", !valid);
    el.simulatedUpperInput.classList.toggle("is-invalid", !valid);
    if (!valid) {
      el.yieldSimulation.innerHTML = `<div class="simulation-warning">LSL 不能高于 USL，请调整后再计算。</div>`;
      return;
    }
    const simulation = Core.simulateLimitYield(state.analysis, result, limits.lower, limits.upper);
    const deltaClass = simulation.delta > 1e-12 ? "positive" : simulation.delta < -1e-12 ? "negative" : "";
    const changeText = formatPercentagePointDelta(simulation.delta);
    const metrics = [
      ["当前总良率", formatYieldPrecise(state.analysis.yield), ""],
      ["模拟总良率", formatYieldPrecise(simulation.yield), `highlight ${deltaClass}`],
      ["良率变化", changeText, deltaClass],
      ["预计 Pass", formatInteger(simulation.projectedPass), deltaClass],
      ["预计恢复", `${formatInteger(simulation.recovered)} 条`, simulation.recovered ? "positive" : ""],
      ["新增 Fail", `${formatInteger(simulation.newFails)} 条`, simulation.newFails ? "negative" : ""],
      ["模拟低 / 高超限", `${formatInteger(simulation.low)} / ${formatInteger(simulation.high)}`, ""],
      ["该参数合格率", formatYieldPrecise(simulation.parameterYield), ""],
    ];
    el.yieldSimulation.innerHTML = metrics.map(([label, value, className], index) => `
      <div class="simulation-metric ${index < 2 ? "metric-primary" : "metric-secondary"} ${className}">
        <span class="label">${label}</span>
        <span class="value">${value}</span>
      </div>`).join("") + `<p class="simulation-assumption">单项模拟：仅重新判定当前测试项，其他 Fail 原因保持不变。</p>`;
  }

  function scheduleLimitChartRender() {
    if (state.limitRenderFrame) return;
    state.limitRenderFrame = requestAnimationFrame(() => {
      state.limitRenderFrame = 0;
      if (state.activeTab === "distribution") drawDistributionCharts();
    });
  }

  function renderStability() {
    updateTestSelect();
    renderStabilityTable();
    renderSelectedTest();
  }

  function updateTestSelect() {
    const items = state.analysis?.stability || [];
    if (!items.some((item) => item.name === state.selectedTest)) {
      const preferred = items.some((item) => item.name === state.selectedDistributionReason)
        ? state.selectedDistributionReason : "";
      const fallback = preferred || items[0]?.name || "";
      if (fallback) setCurrentTestItem(fallback);
      else state.selectedTest = "";
    }
    el.testItemSelect.innerHTML = items.map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`).join("");
    el.testItemSelect.value = state.selectedTest;
  }

  function setCurrentTestItem(name) {
    const selected = String(name || "");
    if (!selected) return;
    state.selectedTest = selected;
    state.selectedDistributionReason = selected;
    const isFailItem = state.analysis?.failStats.some((item) => item.reason === selected && item.count > 0);
    if (state.activeTab === "stability" && !isFailItem) state.showAllDistributionTests = true;
  }

  function renderStabilityTable() {
    if (!state.analysis) return;
    const query = el.stabilitySearch.value.trim().toLowerCase();
    const rows = state.analysis.stability.filter((item) => item.name.toLowerCase().includes(query));
    if (!rows.length) {
      el.stabilityTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">没有匹配的测试项</td></tr>`;
      return;
    }
    el.stabilityTableBody.innerHTML = rows.map((item) => `
      <tr class="clickable-row${item.name === state.selectedTest ? " is-selected" : ""}" data-test="${escapeHtml(item.name)}" aria-selected="${item.name === state.selectedTest}">
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>${statusBadge(item.status)}</td>
        <td>${formatInteger(item.n)}</td>
        <td>${formatMeasurement(item.mean, item.unit)}</td>
        <td>${formatMeasurement(item.std, item.unit)}</td>
        <td>${formatPpk(item.ppk)}</td>
        <td>${formatRatio(item.utilization)}</td>
        <td>${formatRatio(item.centerOffset)}</td>
        <td>${formatSpec(item)}</td>
      </tr>`).join("");
  }

  function renderSelectedTest() {
    if (!state.analysis || !state.selectedTest) {
      el.selectedTestStats.innerHTML = "";
      return;
    }
    const result = Core.parameterSeries(state.analysis, state.selectedTest);
    const item = result.stability;
    if (!item) return;
    const metrics = [
      ["判定", statusBadge(item.status)],
      ["Pass 样本", formatInteger(item.n)],
      ["均值", formatMeasurement(item.mean, item.unit)],
      ["标准差", formatMeasurement(item.std, item.unit)],
      ["Ppk", formatPpk(item.ppk)],
      ["规格", formatSpec(item)],
    ];
    el.selectedTestStats.innerHTML = metrics.map(([label, value]) => `
      <div class="mini-metric"><span class="label">${label}</span><span class="value">${value}</span></div>`).join("");
    if (state.activeTab === "stability") requestAnimationFrame(() => drawParameterChart(result));
  }

  function getFilteredFailRecords() {
    let records = state.analysis.failRecords;
    if (state.selectedFailReason !== "all") records = records.filter((record) => record.failReason === state.selectedFailReason);
    if (state.detailSearch) {
      const fileMap = new Map(state.files.map((file) => [file.id, file]));
      records = records.filter((record) => {
        const file = fileMap.get(record.fileId);
        return [record.serial, record.site, record.hbin, record.sbin, record.failReason, file?.name, file?.stage, file?.testType, file?.fileTimeLabel]
          .some((value) => String(value || "").toLowerCase().includes(state.detailSearch));
      });
    }
    return records;
  }

  function renderFailDetails() {
    if (!state.analysis) return;
    const records = getFilteredFailRecords();
    const pageCount = Math.max(1, Math.ceil(records.length / state.pageSize));
    state.detailPage = Math.min(state.detailPage, pageCount);
    const start = (state.detailPage - 1) * state.pageSize;
    const page = records.slice(start, start + state.pageSize);
    const fileMap = new Map(state.files.map((file) => [file.id, file]));
    el.failDetailCount.textContent = `筛选后 ${formatInteger(records.length)} 条，当前显示 ${records.length ? start + 1 : 0}–${Math.min(start + state.pageSize, records.length)}`;
    if (!page.length) {
      el.detailTableBody.innerHTML = `<tr><td colspan="10" class="empty-state">没有匹配的 Fail 记录</td></tr>`;
    } else {
      el.detailTableBody.innerHTML = page.map((record) => {
        const file = fileMap.get(record.fileId);
        return `<tr>
          <td><span class="badge ${file?.isRetest ? "retest" : "unknown"}">${escapeHtml(fileStageText(file))}</span> <span class="truncate">${escapeHtml(file?.name || "")}</span></td>
          <td>${escapeHtml(record.serial)}</td>
          <td>${escapeHtml(record.site)}</td>
          <td>${escapeHtml(record.hbin || "—")}</td>
          <td>${escapeHtml(record.sbin)}</td>
          <td><button class="table-link" type="button" data-distribution-reason="${escapeHtml(record.failReason)}">${escapeHtml(record.failReason)}</button></td>
          <td>${formatMeasurement(record.failValue, record.failUnit)}</td>
          <td>${formatBounds(record.failLower, record.failUpper, record.failUnit)}</td>
          <td>${directionBadge(record.failDirection)}</td>
          <td>${escapeHtml(record.date)}</td>
        </tr>`;
      }).join("");
    }
    renderPagination(pageCount);
  }

  function renderPagination(pageCount) {
    el.detailPagination.innerHTML = `
      <button class="page-button" type="button" data-page="prev" ${state.detailPage <= 1 ? "disabled" : ""}>上一页</button>
      <span>${state.detailPage} / ${pageCount}</span>
      <button class="page-button" type="button" data-page="next" ${state.detailPage >= pageCount ? "disabled" : ""}>下一页</button>`;
    el.detailPagination.querySelectorAll("button[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        state.detailPage += button.dataset.page === "next" ? 1 : -1;
        renderFailDetails();
        el.detailsPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function renderFiles() {
    if (!state.analysis) return;
    const summaries = currentFileSummaries();
    const sourceMap = new Map([
      ...state.files.map((file) => [file.id, file]),
      ...state.summaryReports.map((report) => [report.id, report]),
    ]);
    el.fileTableBody.innerHTML = summaries.length ? summaries.map((item) => {
      const role = Core.factoryFileRole?.(sourceMap.get(item.id) || item) || (item.kind === "summary" ? "summary" : "initial");
      const roleInfo = factoryRolePresentation(role);
      return `
      <tr class="${item.kind === "summary" ? "" : "clickable-row file-analysis-row"}"
          ${item.kind === "summary" ? "" : `data-analysis-file-id="${escapeHtml(item.id)}"`}
          title="${item.kind === "summary" ? "Summary 汇总报告不含逐颗实测值" : "点击进入该 CSV 的 Fail 分布"}">
        <td><span class="badge ${item.isRetest ? "retest" : "unknown"}">${escapeHtml(item.stage)}</span></td>
        <td><span class="badge ${item.kind === "summary" ? "watch" : item.isRetest ? "retest" : "unknown"}">${escapeHtml(item.testType)}</span></td>
        <td><span class="badge ${roleInfo.badge}">${escapeHtml(roleInfo.label)}</span></td>
        <td>${escapeHtml(roleInfo.treatment)}</td>
        <td>${escapeHtml(item.fileTimeLabel || "—")}</td>
        <td><span class="badge ${item.kind === "summary" ? "watch" : "unknown"}">${escapeHtml(item.format)}</span></td>
        <td><span class="truncate" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span></td>
        <td>${escapeHtml(item.device || "—")}</td>
        <td>${escapeHtml(item.lot || item.custLot || "—")}</td>
        <td>${formatInteger(item.total)}</td>
        <td>${formatInteger(item.pass)}</td>
        <td>${formatInteger(item.fail)}</td>
        <td><span class="badge ${item.yield >= 0.95 ? "pass" : item.yield >= 0.8 ? "watch" : "fail"}">${formatPercent(item.yield)}</span></td>
        <td>${escapeHtml(item.topFail)}</td>
        <td><button class="remove-file-button" type="button" data-remove-id="${escapeHtml(item.id)}">移除</button></td>
      </tr>`;
    }).join("") : `<tr><td colspan="15" class="empty-state">没有已载入文件</td></tr>`;
  }

  function factoryRolePresentation(role) {
    const roles = {
      initial: { label: "初测", treatment: "计入有效投入", badge: "unknown" },
      retest: { label: "复测", treatment: "单独列示，暂不覆盖", badge: "retest" },
      qa: { label: "QA 验证", treatment: "工厂口径排除", badge: "watch" },
      disposition: { label: "处置 / BIN", treatment: "待确认流程规则", badge: "watch" },
      summary: { label: "Summary", treatment: "独立查看，不自动并入", badge: "watch" },
    };
    return roles[role] || roles.initial;
  }

  function currentFileSummaries() {
    const details = state.analysis?.fileSummaries || [];
    const reports = state.summaryReports.map((report) => Core.summarizeSummaryReport(report));
    return Core.sortFilesChronologically([...details, ...reports]);
  }

  function renderDataAudit() {
    if (!state.analysis) return;
    const files = state.analysis.selectedFiles || [];
    const records = state.analysis.records || [];
    const flow = state.productionFlow;
    const roleRows = files.map((file) => buildAuditFileRow(file));
    const missingSerial = roleRows.reduce((sum, row) => sum + row.missingSerial, 0);
    const missingSbin = roleRows.reduce((sum, row) => sum + row.missingSbin, 0);
    const missingHbin = roleRows.reduce((sum, row) => sum + row.missingHbin, 0);
    const duplicateSerial = countDuplicateSerialRecords(records);
    const hasNumericValue = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
    const missingFailValue = (state.analysis.failRecords || []).filter((record) => !hasNumericValue(record.failValue)).length;
    const specIssues = buildAuditSpecIssues(files, missingFailValue);
    const specConflictCount = specIssues.filter((item) => item.kind === "规格冲突").length;
    const criticalCount = [missingSbin, specConflictCount, missingFailValue].filter((value) => value > 0).length;
    const warningCount = [missingSerial, missingHbin, duplicateSerial, flow?.warnings?.length || 0].filter((value) => value > 0).length;
    const statusClass = criticalCount ? "fail" : warningCount ? "watch" : "pass";
    el.dataAuditStatus.className = `badge ${statusClass}`;
    el.dataAuditStatus.textContent = criticalCount ? `${criticalCount} 类风险` : warningCount ? `${warningCount} 类关注` : "审计通过";

    const metrics = [
      ["分析文件", files.length, "当前分析范围"],
      ["测试记录", records.length, "测试事件口径"],
      ["疑似重复 Serial", duplicateSerial, "同一文件与 Site 内重复出现"],
      ["缺 Serial", missingSerial, "影响跨阶段追踪"],
      ["缺 SBin", missingSbin, "影响 Pass / Fail 判定"],
      ["缺 HBin", missingHbin, "影响工厂分类"],
      ["规格冲突项", specConflictCount, "同名测试项存在多套规格"],
      ["Fail 缺实测值", missingFailValue, "无法判断偏低 / 偏高"],
    ];
    el.dataAuditMetrics.innerHTML = metrics.map(([label, value, note]) => `
      <div class="audit-metric${Number(value) > 0 && !["分析文件", "测试记录"].includes(label) ? " has-risk" : ""}">
        <span>${escapeHtml(label)}</span><strong>${formatInteger(value)}</strong><small>${escapeHtml(note)}</small>
      </div>`).join("");

    renderAuditFlow(flow, records.length);
    renderAuditIssues({ flow, files, missingSerial, missingSbin, missingHbin, duplicateSerial, missingFailValue, specConflictCount });
    el.dataAuditRoleTableBody.innerHTML = roleRows.length ? roleRows.map((row) => `
      <tr>
        <td><span class="truncate" title="${escapeHtml(row.file.name)}">${escapeHtml(shortName(row.file.name, 54))}</span></td>
        <td>${escapeHtml(row.file.format || "未知")}</td>
        <td><span class="badge ${row.presentation.badge}">${escapeHtml(row.presentation.label)}</span></td>
        <td>${escapeHtml(row.basis)}</td>
        <td>${formatInteger(row.file.records.length)}</td>
        <td class="${row.missingSerial ? "danger-text" : ""}">${formatInteger(row.missingSerial)}</td>
        <td class="${row.missingSbin ? "danger-text" : ""}">${formatInteger(row.missingSbin)}</td>
        <td class="${row.missingHbin ? "danger-text" : ""}">${formatInteger(row.missingHbin)}</td>
        <td>${escapeHtml(row.presentation.treatment)}</td>
      </tr>`).join("") : `<tr><td colspan="9" class="empty-state">当前范围没有明细 CSV</td></tr>`;
    el.dataAuditSpecTableBody.innerHTML = specIssues.length ? specIssues.map((item) => `
      <tr>
        <td><span class="badge ${item.badge}">${escapeHtml(item.kind)}</span></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${formatInteger(item.count)}</td>
        <td><span class="truncate" title="${escapeHtml(item.files.join("；"))}">${escapeHtml(item.files.map((name) => shortName(name, 28)).join("；"))}</span></td>
        <td>${escapeHtml(item.advice)}</td>
      </tr>`).join("") : `<tr><td colspan="5" class="empty-state">未发现规格冲突或实测值缺失</td></tr>`;
  }

  function buildAuditFileRow(file) {
    const role = Core.factoryFileRole?.(file) || "initial";
    const presentation = factoryRolePresentation(role);
    const name = String(file.name || "").replace(/\\/g, "/").split("/").pop() || "";
    const basis = role === "qa" ? "文件名包含独立 QA 字段"
      : role === "retest" ? `阶段 ${file.stage || "RT"} 或文件名包含 RT`
        : role === "disposition" ? "文件名包含 BIN 编号"
          : "未命中 RT / QA / BIN 规则，按初测处理";
    return {
      file,
      presentation,
      basis: `${basis}${name ? `（${name}）` : ""}`,
      missingSerial: file.records.filter((record) => !String(record.serial || "").trim()).length,
      missingSbin: file.records.filter((record) => !String(record.sbin || "").trim()).length,
      missingHbin: file.records.filter((record) => !String(record.hbin || "").trim()).length,
    };
  }

  function countDuplicateSerialRecords(records) {
    const seen = new Set();
    let duplicates = 0;
    records.forEach((record) => {
      const serial = String(record.serial || "").trim();
      if (!serial) return;
      const key = `${record.fileId}\u0000${record.site || ""}\u0000${serial}`;
      if (seen.has(key)) duplicates += 1;
      else seen.add(key);
    });
    return duplicates;
  }

  function buildAuditSpecIssues(files, missingFailValue) {
    const catalog = new Map();
    files.forEach((file) => (file.tests || []).forEach((test) => {
      if (!catalog.has(test.name)) catalog.set(test.name, { variants: new Map(), files: new Set(), missing: 0 });
      const item = catalog.get(test.name);
      const signature = `${test.lower ?? "—"} ~ ${test.upper ?? "—"} ${test.unit || ""}`;
      item.variants.set(signature, (item.variants.get(signature) || 0) + 1);
      item.files.add(file.name);
      if (test.lower === null && test.upper === null) item.missing += 1;
    }));
    const issues = [];
    catalog.forEach((item, name) => {
      if (item.variants.size > 1) issues.push({
        kind: "规格冲突", badge: "fail", name, count: item.variants.size, files: Array.from(item.files),
        advice: `发现 ${Array.from(item.variants.keys()).join("；")}，建议选择单文件或确认产品规格版本。`,
      });
      if (item.missing) issues.push({
        kind: "规格缺失", badge: "watch", name, count: item.missing, files: Array.from(item.files),
        advice: "缺少 LSL 与 USL，不能进行超限方向和规格模拟。",
      });
    });
    if (missingFailValue) issues.push({
      kind: "实测值缺失", badge: "watch", name: "Fail 记录", count: missingFailValue,
      files: files.filter((file) => file.records.some((record) => !record.isPass
        && (record.failValue === null || record.failValue === undefined || record.failValue === "" || !Number.isFinite(Number(record.failValue))))).map((file) => file.name),
      advice: "可保留 Fail 归因，但不能判断偏低 / 偏高或绘制该条实测分布。",
    });
    return issues.sort((a, b) => (a.badge === "fail" ? -1 : 1) - (b.badge === "fail" ? -1 : 1) || b.count - a.count);
  }

  function renderAuditFlow(flow, eventTotal) {
    if (!flow) {
      el.dataAuditFlow.innerHTML = `<div class="empty-state">当前范围没有可审计的生产流转数据</div>`;
      return;
    }
    const excluded = Math.max(0, flow.rawInitial.total - flow.productionInitial.total);
    const stages = [
      ["原始测试事件", eventTotal, "source"],
      ["排除复测事件", -flow.retest.total, "subtract"],
      ["排除 QA", -flow.qa.total, "subtract"],
      ["排除处置 / BIN", -flow.disposition.total, "subtract"],
      ["原始初测", flow.rawInitial.total, "result"],
      ["排除工程记录", -excluded, "subtract"],
      ["正式初测投入", flow.productionInitial.total, "result"],
      ["初测 Pass", flow.productionInitial.mainPass, "result"],
      ["推算复测恢复", flow.inferredRecovered, "add"],
      ["工厂最终产出", flow.factory ? flow.factory.output : null, "final"],
    ];
    el.dataAuditFlow.innerHTML = stages.map(([label, value, type], index) => `
      <div class="audit-flow-step ${type}">
        <span>${escapeHtml(label)}</span>
        <strong>${value === null ? "待确认" : `${value < 0 ? "−" : type === "add" && value ? "+" : ""}${formatInteger(Math.abs(value))}`}</strong>
        ${index < stages.length - 1 ? '<i aria-hidden="true">→</i>' : ""}
      </div>`).join("");
  }

  function renderAuditIssues(context) {
    const { flow, missingSerial, missingSbin, missingHbin, duplicateSerial, missingFailValue, specConflictCount } = context;
    const issues = [];
    if (missingSbin) issues.push(["风险", "缺少 SBin", `${formatInteger(missingSbin)} 条记录可能无法可靠判定 Pass / Fail。`, "fail"]);
    if (specConflictCount) issues.push(["风险", "同名测试项规格不一致", `${formatInteger(specConflictCount)} 个测试项存在多套规格，汇总模拟应先缩小到单文件。`, "fail"]);
    if (missingSerial) issues.push(["关注", "缺少 Serial", `${formatInteger(missingSerial)} 条记录无法用于跨 FT / RT 逐颗追踪。`, "watch"]);
    if (duplicateSerial) issues.push(["关注", "疑似重复标识", `${formatInteger(duplicateSerial)} 条记录在同一文件与 Site 内重复出现，需核对是否为合法复测。`, "watch"]);
    if (missingHbin) issues.push(["关注", "缺少 HBin", `${formatInteger(missingHbin)} 条记录会按原 Pass / Fail 兼容归类，工厂 Bin 构成可信度降低。`, "watch"]);
    if (missingFailValue) issues.push(["关注", "Fail 缺实测值", `${formatInteger(missingFailValue)} 条 Fail 无法判断超限方向。`, "watch"]);
    if (flow?.factory) {
      const initialYield = flow.productionInitial.yield;
      const difference = initialYield === null ? null : flow.factory.yield - initialYield;
      issues.push([difference && Math.abs(difference) >= 0.0005 ? "说明" : "通过", "软件与工厂良率差异",
        difference === null ? "缺少正式初测良率，暂不能比较。" : `正式初测 ${formatPercent(initialYield)}，工厂最终 ${formatPercent(flow.factory.yield)}，相差 ${difference >= 0 ? "+" : ""}${(difference * 100).toFixed(3)}%。差异可能来自复测恢复、工程记录排除或工厂最终处置。`,
        difference && Math.abs(difference) >= 0.0005 ? "watch" : "pass"]);
    } else issues.push(["说明", "缺少工厂良率锚点", "当前只能审计测试事件和正式初测口径，无法核对最终产出。", "unknown"]);
    (flow?.warnings || []).forEach((warning) => issues.push(["口径", "生产口径提示", warning, "unknown"]));
    if (!issues.length) issues.push(["通过", "未发现明显异常", "当前数据完整性和口径闭合检查通过。", "pass"]);
    el.dataAuditIssues.innerHTML = issues.map(([level, title, detail, badge]) => `
      <div class="audit-issue">
        <span class="badge ${badge}">${escapeHtml(level)}</span>
        <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>
      </div>`).join("");
  }

  function renderReleaseLog() {
    el.releaseLog.innerHTML = RELEASE_NOTES.map((release) => `
      <article class="release-entry${release.current ? " is-current" : ""}">
        <div class="release-marker" aria-hidden="true"></div>
        <div class="release-card">
          <div class="release-card-header">
            <div>
              <span class="release-version">${release.version}</span>
              ${release.current ? '<span class="badge pass">当前版本</span>' : ""}
            </div>
            <strong>${release.title}</strong>
          </div>
          <ul>${release.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}</ul>
        </div>
      </article>`).join("");
  }

  function openFileDistribution(fileId) {
    if (!state.files.some((file) => file.id === fileId)) return;
    state.filterId = fileId;
    state.selectedTest = "";
    state.selectedOverviewFailReason = "";
    state.selectedFailReason = "all";
    state.selectedDistributionReason = "";
    state.distributionLimits.clear();
    state.detailPage = 1;
    updateFileFilter();
    switchTab("distribution");
    analyzeAndRender();
    requestAnimationFrame(() => {
      document.getElementById("distributionPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function removeFile(id) {
    state.files = state.files.filter((file) => file.id !== id);
    state.summaryReports = state.summaryReports.filter((report) => report.id !== id);
    if (!state.files.length && !state.summaryReports.length) {
      clearAll();
      return;
    }
    if (state.filterId === id || state.filterId === `summary:${id}`) state.filterId = "all";
    state.distributionLimits.clear();
    updateFileFilter();
    analyzeAndRender();
    showMessage("已从当前分析中移除文件。", "success");
  }

  function clearAll() {
    state.files = [];
    state.summaryReports = [];
    state.factoryReports = [];
    state.analysis = null;
    state.factoryAnalysis = null;
    state.productionFlow = null;
    state.productionOverrides = {};
    state.summaryAggregate = null;
    state.filterId = "all";
    state.selectedTest = "";
    state.selectedOverviewFailReason = "";
    state.selectedFailReason = "all";
    state.selectedDistributionReason = "";
    state.distributionResult = null;
    state.showAllDistributionTests = false;
    state.distributionLimits.clear();
    state.distributionCache.clear();
    state.limitDrag = null;
    if (state.distributionRenderFrame) cancelAnimationFrame(state.distributionRenderFrame);
    state.distributionRenderFrame = 0;
    if (state.limitRenderFrame) cancelAnimationFrame(state.limitRenderFrame);
    state.limitRenderFrame = 0;
    state.detailSearch = "";
    state.detailPage = 1;
    el.fileInput.value = "";
    el.detailSearch.value = "";
    el.distributionTestMenu.innerHTML = "";
    el.distributionTestButton.textContent = "选择测试项";
    el.distributionTestButton.disabled = true;
    setDistributionPickerOpen(false);
    el.workspace.hidden = true;
    showMessage("已清空当前分析。可继续拖入新的 CSV、XLSX 或压缩包。", "success");
  }

  function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll(".tab").forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = true; });
    const target = document.getElementById(`${tabName}Panel`);
    if (target) target.hidden = false;
    if (tabName === "distribution") {
      updateDistributionTestSelect();
      renderDistributionFailList();
      renderSelectedDistribution();
    } else if (tabName === "stability") {
      updateTestSelect();
      renderStabilityTable();
      renderSelectedTest();
    }
    requestAnimationFrame(drawVisibleCharts);
  }

  function openFailDistribution(reason) {
    setCurrentTestItem(reason);
    switchTab("distribution");
    updateDistributionTestSelect();
    renderDistributionFailList();
    renderSelectedDistribution();
  }

  function openFailDetails(reason) {
    state.selectedFailReason = reason;
    state.detailPage = 1;
    switchTab("details");
    el.failReasonFilter.value = reason;
    renderFailDetails();
  }

  function exportAnalysis() {
    if (!state.analysis) return;
    const a = state.analysis;
    const summaryOnly = !a.total && Boolean(state.summaryAggregate?.reports.length);
    const source = summaryOnly ? state.summaryAggregate : a;
    const fileMap = new Map(state.files.map((file) => [file.id, file]));
    const rows = [];
    rows.push(["FT 数据分析结果"]);
    const selectedSummary = state.filterId.startsWith("summary:")
      ? state.summaryAggregate?.reports[0]?.name || ""
      : "";
    rows.push(["分析范围", state.filterId === "all" ? "全部明细 CSV 汇总" : selectedSummary || a.selectedFiles[0]?.name || ""]);
    rows.push(["数据来源", summaryOnly ? "Summary 汇总报告（不含逐颗实测值）" : "逐颗明细 CSV"]);
    const productionMode = ["initial", "factory"].includes(state.analysisMode) && !summaryOnly && Boolean(state.productionFlow);
    const factoryMode = state.analysisMode === "factory" && productionMode;
    rows.push(["统计口径", factoryMode ? "工厂最终口径" : productionMode ? "正式初测口径" : "测试事件口径"]);
    if (productionMode) {
      const f = state.productionFlow;
      rows.push([]);
      rows.push(["生产口径与工厂对账"]);
      rows.push(["原始初测记录", f.rawInitial.total, "正式初测投入", f.productionInitial.total, "排除工程记录", f.rawInitial.total - f.productionInitial.total, "正式初测良率", f.productionInitial.yield === null ? "" : (f.productionInitial.yield * 100).toFixed(3) + "%"]);
      rows.push(["初测 HBin1", f.productionInitial.mainPass, "初测 HBin8", f.productionInitial.hbin8, "初测电性(HBin3)", f.productionInitial.electrical, "初测 O/S(HBin5)", f.productionInitial.openShort]);
      rows.push(["复测事件（不重复投入）", f.retest.total, "QA 验证（已排除）", f.qa.total, "处置/BIN 文件", f.disposition.total, "置信度", confidenceText(f.confidence)]);
      if (f.factory) rows.push(["工厂投入", f.factory.input, "最终产出", f.factory.output, "最终良率", (f.factory.yield * 100).toFixed(3) + "%", "推算恢复", f.inferredRecovered, "最终不良", f.inferredFinalFail]);
      else rows.push(["工厂最终结果", "未匹配工厂良率 XLSX，不输出确定最终良率"]);
      f.warnings.forEach((warning) => rows.push(["口径提示", warning]));
      rows.push([]);
      rows.push(["正式生产区间审计"]);
      rows.push(["初测文件", "原始记录", "正式起始序号", "排除工程记录", "正式投入", "区间依据", "置信度"]);
      f.ranges.forEach((range) => rows.push([range.file.name, range.file.records.length, range.startSequence, range.excluded, range.included, rangeSourceText(range.source), confidenceText(range.confidence)]));
      rows.push([]);
      rows.push(["工厂报告锚点"]);
      rows.push(["报告文件", "行号", "子批号", "产品", "客户批号", "测试投入", "测试产出", "测试良率", "电性", "O/S"]);
      (f.factory?.rows || []).forEach((row) => rows.push([row.source, row.rowNumber, row.lot, row.product, row.customerLot, row.input, row.output, row.yield === null ? "" : (row.yield * 100).toFixed(3) + "%", row.electrical, row.openShort]));
      rows.push([]);
      rows.push(["测试事件参考"]);
    }
    rows.push([productionMode ? "测试事件记录" : "测试记录", source.total, "Pass", source.pass, "Fail", source.fail, "良率", (source.yield * 100).toFixed(3) + "%"]);
    rows.push([
      "单颗测试时间(ms)", rawNumber(source.testTimeMs),
      "Index 时间(ms)", source.indexTimeMs,
      "UPH", rawNumber(source.uph),
      "日产出", rawNumber(source.dailyOutput),
    ]);
    if (summaryOnly) {
      const report = state.summaryAggregate.reports[0];
      const check = report.consistency;
      const internallyValid = check.passFailMatchesTotal
        && check.yieldMatchesCounts
        && check.binMatchesTotal
        && check.failCountsMatchFail;
      rows.push([]);
      rows.push(["Summary 独立报告"]);
      rows.push(["Summary 文件", "内部校验", "Total", "Pass", "Fail", "报告良率", "报告测试时间(ms)", "理论 UPH", "理论日产出"]);
      rows.push([
        report.name,
        internallyValid ? "一致" : "有差异",
        report.total,
        report.pass,
        report.fail,
        (report.yield * 100).toFixed(3) + "%",
        rawNumber(report.testTimeMs),
        rawNumber(report.uph),
        rawNumber(report.dailyOutput),
      ]);
      rows.push([]);
      rows.push(["Summary SBin/HBin"]);
      rows.push(["SBin", "HBin", "Bin 描述", "数量", "批次占比"]);
      state.summaryAggregate.bins.forEach((item) => rows.push([
        item.sbin, item.hbin, item.description, item.count, (item.share * 100).toFixed(3) + "%",
      ]));
    }
    if (productionMode) {
      rows.push([]);
      rows.push(["文件角色审计"]);
      rows.push(["文件", "阶段", "角色", "工厂口径处理", "记录数", "测试事件 Pass", "测试事件 Fail", "测试事件良率"]);
      state.analysis.fileSummaries.forEach((item) => {
        const sourceFile = fileMap.get(item.id);
        const roleInfo = factoryRolePresentation(Core.factoryFileRole?.(sourceFile) || "initial");
        rows.push([
          item.name, item.stage, roleInfo.label, roleInfo.treatment, item.total, item.pass, item.fail,
          (item.yield * 100).toFixed(3) + "%",
        ]);
      });
    }
    rows.push([]);
    rows.push(["Fail 项汇总"]);
    rows.push(["Fail 测试项", "数量", "Fail 占比", "总测试占比", "偏低", "偏高", "无法判定"]);
    (summaryOnly ? state.summaryAggregate.failStats : a.failStats).forEach((item) => rows.push([
      item.reason, item.count, (item.failShare * 100).toFixed(3) + "%", (item.totalShare * 100).toFixed(3) + "%",
      summaryOnly ? "" : item.low,
      summaryOnly ? "" : item.high,
      summaryOnly ? "Summary 无方向数据" : item.unknown + item.within,
    ]));
    rows.push([]);
    rows.push(["Pass 稳定性"]);
    rows.push(["测试项", "状态", "样本数", "均值", "标准差", "Ppk", "6σ/规格宽度", "中心偏移", "下限", "上限", "单位"]);
    a.stability.forEach((item) => rows.push([
      item.name, statusText(item.status), item.n, rawNumber(item.mean), rawNumber(item.std), rawNumber(item.ppk),
      rawNumber(item.utilization), rawNumber(item.centerOffset), rawNumber(item.lower), rawNumber(item.upper), item.unit,
    ]));
    rows.push([]);
    rows.push(["Fail 明细"]);
    rows.push(["文件", "阶段", "类型", "文件名时间", "Serial", "Site", "HBIN", "SBIN", "Fail 测试项", "实测值", "下限", "上限", "单位", "判定", "测试日期时间", "单颗测试时间(ms)"]);
    a.failRecords.forEach((record) => {
      const file = fileMap.get(record.fileId);
      rows.push([
        file?.name || "", file?.stage || "", file?.testType || "", file?.fileTimeLabel || "",
        record.serial, record.site, record.hbin, record.sbin,
        record.failReason, rawNumber(record.failValue), rawNumber(record.failLower), rawNumber(record.failUpper),
        record.failUnit, directionText(record.failDirection), record.date, rawNumber(record.testTimeMs),
      ]);
    });
    const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadText(content, `FT分析结果_${timestampForFile()}.csv`, "text/csv;charset=utf-8");
    showMessage("分析结果已导出。", "success");
  }

  function drawVisibleCharts() {
    if (!state.analysis) return;
    if (state.activeTab === "overview") {
      drawParetoChart();
      drawYieldChart();
    } else if (state.activeTab === "stability") {
      drawParameterChart(Core.parameterSeries(state.analysis, state.selectedTest));
    } else if (state.activeTab === "distribution") {
      drawDistributionCharts();
    } else if (state.activeTab === "files") {
      drawFileYieldChart();
    }
  }

  function chartTheme() {
    const styles = getComputedStyle(document.documentElement);
    const get = (name) => styles.getPropertyValue(name).trim();
    return {
      text: get("--text"), muted: get("--muted"), border: get("--border"), surface: get("--surface"),
      accent: get("--accent"), success: get("--success"), danger: get("--danger"), warning: get("--warning"), violet: get("--violet"),
    };
  }

  function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = '12px Inter, "Microsoft YaHei", sans-serif';
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { ctx, width: rect.width, height: rect.height, theme: chartTheme() };
  }

  function drawEmptyChart(chart, text) {
    const setup = prepareCanvas(chart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.fillText(text, width / 2, height / 2);
  }

  function bindLimitDragging(canvas, orientation) {
    canvas.classList.add(orientation === "y" ? "limit-drag-y" : "limit-drag-x");
    canvas.addEventListener("pointerdown", (event) => {
      const result = state.distributionResult;
      if (!result?.points.length || result.specVariant || state.activeTab !== "distribution") return;
      const limits = getDistributionLimits(result);
      if (!limitsAreValid(limits)) return;
      const rect = canvas.getBoundingClientRect();
      const margin = orientation === "y"
        ? { top: 22, right: 24, bottom: 38, left: 72 }
        : { top: 24, right: 24, bottom: 44, left: 66 };
      const plotW = rect.width - margin.left - margin.right;
      const plotH = rect.height - margin.top - margin.bottom;
      const range = distributionRange(result, limits);
      const span = Math.max(range.max - range.min, Number.EPSILON);
      const pointerCoordinate = orientation === "y" ? event.clientY - rect.top : event.clientX - rect.left;
      const candidates = [
        { kind: "lower", value: limits.lower },
        { kind: "upper", value: limits.upper },
      ].filter((item) => item.value !== null).map((item) => {
        const coordinate = orientation === "y"
          ? margin.top + plotH - ((item.value - range.min) / span) * plotH
          : margin.left + ((item.value - range.min) / span) * plotW;
        return { ...item, distance: Math.abs(pointerCoordinate - coordinate) };
      }).sort((a, b) => a.distance - b.distance);
      if (!candidates.length || candidates[0].distance > 16) return;
      event.preventDefault();
      state.limitDrag = {
        canvas,
        orientation,
        kind: candidates[0].kind,
        pointerId: event.pointerId,
        range,
        margin,
        plotW,
        plotH,
        rect,
      };
      canvas.setPointerCapture?.(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      const drag = state.limitDrag;
      if (!drag || drag.canvas !== canvas || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      const current = getDistributionLimits();
      const span = Math.max(drag.range.max - drag.range.min, Number.EPSILON);
      let ratio;
      if (drag.orientation === "y") {
        const y = Math.max(drag.margin.top, Math.min(drag.margin.top + drag.plotH, event.clientY - drag.rect.top));
        ratio = 1 - (y - drag.margin.top) / drag.plotH;
      } else {
        const x = Math.max(drag.margin.left, Math.min(drag.margin.left + drag.plotW, event.clientX - drag.rect.left));
        ratio = (x - drag.margin.left) / drag.plotW;
      }
      let value = drag.range.min + ratio * span;
      if (drag.kind === "lower" && current.upper !== null) value = Math.min(value, current.upper);
      if (drag.kind === "upper" && current.lower !== null) value = Math.max(value, current.lower);
      const next = { ...current, [drag.kind]: value };
      state.distributionLimits.set(state.selectedDistributionReason, next);
      el.simulatedLowerInput.value = inputNumber(next.lower);
      el.simulatedUpperInput.value = inputNumber(next.upper);
      renderYieldSimulation(state.distributionResult, next);
      scheduleLimitChartRender();
    });

    const endDrag = (event) => {
      if (!state.limitDrag || state.limitDrag.canvas !== canvas) return;
      canvas.releasePointerCapture?.(event.pointerId);
      state.limitDrag = null;
      scheduleLimitChartRender();
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
  }

  function drawDistributionCharts() {
    const result = state.distributionResult;
    if (!result?.points.length) {
      drawEmptyChart(el.failSequenceChart, "该 Fail 项没有可用的实测数值");
      drawEmptyChart(el.failHistogramChart, "该 Fail 项没有可用的实测数值");
      return;
    }
    const requestedLimits = result.specVariant ? { lower: null, upper: null } : getDistributionLimits(result);
    const limits = limitsAreValid(requestedLimits) ? requestedLimits : { lower: result.lower, upper: result.upper };
    drawFailSequenceChart(result, limits);
    drawFailHistogramChart(result, limits);
  }

  function distributionRange(result, limits = { lower: result.lower, upper: result.upper }) {
    if (state.limitDrag?.range) return { ...state.limitDrag.range };
    if (
      state.distributionFocus
      && !result.specVariant
      && limits.lower !== null
      && limits.upper !== null
      && limits.upper > limits.lower
    ) {
      const specWidth = limits.upper - limits.lower;
      const padding = specWidth * 0.25;
      return { min: limits.lower - padding, max: limits.upper + padding, focused: true };
    }
    let min = result.min;
    let max = result.max;
    result.specs.forEach((spec) => {
      if (spec.lower !== null) min = Math.min(min, spec.lower);
      if (spec.upper !== null) max = Math.max(max, spec.upper);
    });
    if (limits.lower !== null) min = Math.min(min, limits.lower);
    if (limits.upper !== null) max = Math.max(max, limits.upper);
    const padding = (max - min || Math.abs(max) * 0.08 || 1) * 0.08;
    return { min: min - padding, max: max + padding, focused: false };
  }

  function simulatedDirection(point, limits, specVariant) {
    if (specVariant) return point.direction;
    if (limits.lower !== null && point.value < limits.lower) return "low";
    if (limits.upper !== null && point.value > limits.upper) return "high";
    return "within";
  }

  function rangeOverflow(points, range, representativeLimit = 6) {
    let low = 0;
    let high = 0;
    const representativesLow = new Map();
    const representativesHigh = new Map();
    const maxPointIndex = Math.max(points[points.length - 1]?.index || 1, 1);
    points.forEach((point) => {
      const bucket = Math.max(0, Math.min(representativeLimit - 1, Math.floor((point.index / maxPointIndex) * representativeLimit)));
      if (point.value < range.min) {
        low += 1;
        if (!representativesLow.has(bucket)) representativesLow.set(bucket, point);
      } else if (point.value > range.max) {
        high += 1;
        if (!representativesHigh.has(bucket)) representativesHigh.set(bucket, point);
      }
    });
    return {
      low,
      high,
      visible: points.length - low - high,
      representatives: [...representativesLow.values(), ...representativesHigh.values()],
    };
  }

  function drawFailSequenceChart(result, limits) {
    const setup = prepareCanvas(el.failSequenceChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const range = distributionRange(result, limits);
    const margin = { top: 22, right: 24, bottom: 38, left: 72 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    drawAxes(ctx, margin, plotW, plotH, range.min, range.max, theme, result.unit || "");
    const maxIndex = Math.max(state.analysis.records.length - 1, 1);
    const xFor = (point) => margin.left + ((point.index - 1) / maxIndex) * plotW;
    const yFor = (value) => margin.top + plotH - ((value - range.min) / Math.max(range.max - range.min, Number.EPSILON)) * plotH;
    const clippedYFor = (value) => Math.max(margin.top + 2, Math.min(margin.top + plotH - 2, yFor(value)));
    const overflow = rangeOverflow(result.points, range);

    if (!result.specVariant) {
      if (limits.upper !== null) {
        const y = Math.max(margin.top, Math.min(margin.top + plotH, yFor(limits.upper)));
        ctx.fillStyle = colorWithAlpha(theme.danger, 0.07);
        ctx.fillRect(margin.left, margin.top, plotW, Math.max(y - margin.top, 0));
      }
      if (limits.lower !== null) {
        const y = Math.max(margin.top, Math.min(margin.top + plotH, yFor(limits.lower)));
        ctx.fillStyle = colorWithAlpha(theme.danger, 0.07);
        ctx.fillRect(margin.left, y, plotW, Math.max(margin.top + plotH - y, 0));
      }
    }

    if (result.mean !== null && result.mean >= range.min && result.mean <= range.max) {
      const meanY = yFor(result.mean);
      ctx.strokeStyle = theme.success;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(margin.left, meanY); ctx.lineTo(margin.left + plotW, meanY); ctx.stroke();
      ctx.setLineDash([]);
      drawChartPill(ctx, `均值 ${formatNumber(result.mean)}`, margin.left + 8, meanY - 6, theme, "left", theme.success);
    }

    const points = downsample(result.points, 1100);
    ctx.save();
    ctx.beginPath();
    ctx.rect(margin.left, margin.top, plotW, plotH);
    ctx.clip();
    ctx.beginPath();
    let segmentOpen = false;
    points.forEach((point) => {
      if (point.value < range.min || point.value > range.max) {
        segmentOpen = false;
        return;
      }
      const xy = [xFor(point), yFor(point.value)];
      if (segmentOpen) ctx.lineTo(...xy);
      else ctx.moveTo(...xy);
      segmentOpen = true;
    });
    ctx.strokeStyle = colorWithAlpha(theme.accent, 0.42);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = theme.accent;
    points.filter((point) => simulatedDirection(point, limits, result.specVariant) === "within").forEach((point) => {
      ctx.beginPath(); ctx.arc(xFor(point), clippedYFor(point.value), 1.25, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = theme.danger;
    points.filter((point) => point.value >= range.min && point.value <= range.max
      && simulatedDirection(point, limits, result.specVariant) !== "within").forEach((point) => {
      ctx.beginPath(); ctx.arc(xFor(point), yFor(point.value), 2.4, 0, Math.PI * 2); ctx.fill();
    });

    overflow.representatives.forEach((point) => {
      ctx.beginPath();
      ctx.arc(xFor(point), point.value > range.max ? margin.top + 10 : margin.top + plotH - 10, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    if (!result.specVariant) drawHorizontalSpecLines(ctx, limits, margin, plotW, yFor, theme);

    if (range.focused && overflow.high) {
      drawOverflowBadge(ctx, `视窗外高值 ${formatInteger(overflow.high)}`, margin.left + 8, margin.top + 8, theme);
    }
    if (range.focused && overflow.low) {
      drawOverflowBadge(ctx, `视窗外低值 ${formatInteger(overflow.low)}`, margin.left + 8, margin.top + plotH - 27, theme);
    }

    ctx.fillStyle = theme.muted;
    ctx.textAlign = "left";
    ctx.fillText("测试记录 1", margin.left, height - 8);
    ctx.textAlign = "right";
    ctx.fillText(`测试记录 ${formatInteger(state.analysis.records.length)}`, margin.left + plotW, height - 8);
  }

  function drawHorizontalSpecLines(ctx, limits, margin, plotW, yFor, theme) {
    [[limits.lower, "LSL"], [limits.upper, "USL"]].forEach(([value, label]) => {
      if (value === null) return;
      const y = yFor(value);
      ctx.strokeStyle = theme.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      ctx.setLineDash([]);
      drawChartPill(ctx, `${label} ${formatNumber(value)}`, margin.left + plotW - 4, y - 7, theme, "right");
    });
  }

  function drawChartPill(ctx, text, anchorX, baselineY, theme, align = "right", color = theme.danger) {
    const horizontalPadding = 6;
    const height = 20;
    const width = Math.ceil(ctx.measureText(text).width) + horizontalPadding * 2;
    const left = align === "left" ? anchorX : align === "center" ? anchorX - width / 2 : anchorX - width;
    const top = baselineY - 14;
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.surface;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    roundRect(ctx, left, top, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = align === "left" ? "left" : align === "center" ? "center" : "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, align === "left" ? anchorX + horizontalPadding : align === "center" ? anchorX : anchorX - horizontalPadding, baselineY);
    ctx.restore();
  }

  function drawOverflowBadge(ctx, text, left, top, theme) {
    const horizontalPadding = 7;
    const height = 22;
    const width = Math.ceil(ctx.measureText(text).width) + horizontalPadding * 2;
    ctx.save();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.surface;
    ctx.strokeStyle = theme.danger;
    ctx.lineWidth = 1;
    roundRect(ctx, left, top, width, height, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.danger;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, left + horizontalPadding, top + height / 2);
    ctx.restore();
  }

  function drawFailHistogramChart(result, limits) {
    const setup = prepareCanvas(el.failHistogramChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const range = distributionRange(result, limits);
    const margin = { top: 24, right: 24, bottom: 44, left: 66 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const binCount = Math.max(18, Math.min(56, Math.round(plotW / 17)));
    const bins = Array.from({ length: binCount }, () => ({ within: 0, low: 0, high: 0 }));
    const span = Math.max(range.max - range.min, Number.EPSILON);
    const overflow = { low: 0, high: 0 };
    let visibleCount = 0;
    result.points.forEach((point) => {
      if (point.value < range.min) {
        overflow.low += 1;
        return;
      }
      if (point.value > range.max) {
        overflow.high += 1;
        return;
      }
      visibleCount += 1;
      const index = Math.max(0, Math.min(binCount - 1, Math.floor(((point.value - range.min) / span) * binCount)));
      bins[index][simulatedDirection(point, limits, result.specVariant)] += 1;
    });
    const maxCount = Math.max(...bins.map((bin) => bin.within + bin.low + bin.high), 1);
    drawAxes(ctx, margin, plotW, plotH, 0, maxCount, theme, "");

    const slot = plotW / binCount;
    const barW = Math.max(slot - 1, 1);
    bins.forEach((bin, index) => {
      const x = margin.left + index * slot + (slot - barW) / 2;
      let baseY = margin.top + plotH;
      const withinHeight = (bin.within / maxCount) * plotH;
      if (withinHeight > 0) {
        ctx.fillStyle = theme.accent;
        ctx.fillRect(x, baseY - withinHeight, barW, withinHeight);
        baseY -= withinHeight;
      }
      const outHeight = ((bin.low + bin.high) / maxCount) * plotH;
      if (outHeight > 0) {
        ctx.fillStyle = theme.danger;
        ctx.fillRect(x, baseY - outHeight, barW, outHeight);
      }
    });

    if (!result.specVariant) {
      [[limits.lower, "LSL"], [limits.upper, "USL"]].forEach(([value, label]) => {
        if (value === null) return;
        const x = margin.left + ((value - range.min) / span) * plotW;
        ctx.strokeStyle = theme.danger;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
        ctx.setLineDash([]);
        drawChartPill(ctx, `${label} ${formatNumber(value)}`, x, margin.top - 7, theme, "center");
      });
    }

    if (range.focused && overflow.low) {
      ctx.fillStyle = theme.danger;
      ctx.textAlign = "left";
      ctx.fillText(`← 视窗外低值 ${formatInteger(overflow.low)}`, margin.left + 6, margin.top + 15);
    }
    if (range.focused && overflow.high) {
      ctx.fillStyle = theme.danger;
      ctx.textAlign = "right";
      ctx.fillText(`视窗外高值 ${formatInteger(overflow.high)} →`, margin.left + plotW - 6, margin.top + 15);
    }

    ctx.fillStyle = theme.muted;
    ctx.textAlign = "left";
    ctx.fillText(`${formatNumber(range.min)}${result.unit ? ` ${result.unit}` : ""}`, margin.left, height - 8);
    ctx.textAlign = "center";
    ctx.fillText(
      range.focused
        ? `规格区视窗（显示 ${formatInteger(visibleCount)} / 共 ${formatInteger(result.total)} 个）`
        : `实测值（${formatInteger(result.total)} 个）`,
      margin.left + plotW / 2,
      height - 8,
    );
    ctx.textAlign = "right";
    ctx.fillText(`${formatNumber(range.max)}${result.unit ? ` ${result.unit}` : ""}`, margin.left + plotW, height - 8);
  }

  function drawParetoChart() {
    const items = overviewFailStats().slice(0, 12);
    if (!items.length) return drawEmptyChart(el.paretoChart, "当前范围没有 Fail");
    const setup = prepareCanvas(el.paretoChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const margin = { top: 12, right: 50, bottom: 30, left: Math.min(164, Math.max(112, width * 0.3)) };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const rowH = plotH / items.length;
    const max = Math.max(...items.map((item) => item.count), 1);
    const totalFail = items.reduce((sum, item) => sum + item.count, 0);
    let cumulative = 0;
    const linePoints = [];
    const hitBars = [];

    for (let tick = 0; tick <= 4; tick += 1) {
      const x = margin.left + (plotW * tick) / 4;
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
      ctx.fillStyle = theme.muted;
      ctx.textAlign = "center";
      ctx.fillText(formatCompact((max * tick) / 4), x, height - 8);
    }

    items.forEach((item, index) => {
      const y = margin.top + index * rowH + rowH * 0.16;
      const barH = rowH * 0.68;
      const barW = (item.count / max) * plotW;
      ctx.fillStyle = item.reason === state.selectedOverviewFailReason ? theme.danger : theme.accent;
      roundRect(ctx, margin.left, y, Math.max(barW, 2), barH, 4);
      ctx.fill();
      ctx.fillStyle = theme.text;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(ellipsize(ctx, item.reason, margin.left - 18), margin.left - 8, y + barH / 2);
      ctx.textAlign = "left";
      ctx.fillText(String(item.count), Math.min(margin.left + barW + 7, width - margin.right + 5), y + barH / 2);
      cumulative += item.count;
      linePoints.push({ x: margin.left + (cumulative / Math.max(totalFail, 1)) * plotW, y: y + barH / 2 });
      hitBars.push({ x: margin.left, y, width: plotW, height: barH, reason: item.reason });
    });
    ctx.strokeStyle = theme.warning;
    ctx.lineWidth = 2;
    ctx.beginPath();
    linePoints.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
    ctx.fillStyle = theme.warning;
    linePoints.forEach((point) => { ctx.beginPath(); ctx.arc(point.x, point.y, 3, 0, Math.PI * 2); ctx.fill(); });
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "right";
    ctx.fillStyle = theme.warning;
    ctx.fillText("累计 100%", width - 5, height - 8);
    el.paretoChart._hitBars = hitBars;
  }

  function onParetoClick(event) {
    if (!overviewFailStats().length) return;
    const canvas = el.paretoChart;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = (canvas._hitBars || []).find((bar) => x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height);
    if (hit) selectOverviewFailReason(hit.reason);
  }

  function drawYieldChart() {
    const blocks = state.analysis.yieldTrend;
    if (!blocks.length) return drawEmptyChart(el.yieldChart, "没有良率记录");
    const setup = prepareCanvas(el.yieldChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const margin = { top: 18, right: 18, bottom: 34, left: 48 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const values = blocks.map((block) => block.yield * 100);
    const dataMin = Math.min(...values, state.analysis.yield * 100);
    const yMin = Math.max(0, Math.floor((dataMin - 5) / 5) * 5);
    const yMax = 100;
    drawAxes(ctx, margin, plotW, plotH, yMin, yMax, theme, "%");

    const xFor = (index) => margin.left + (blocks.length === 1 ? plotW / 2 : (index / (blocks.length - 1)) * plotW);
    const yFor = (value) => margin.top + plotH - ((value - yMin) / Math.max(yMax - yMin, 1)) * plotH;
    const meanY = yFor(state.analysis.yield * 100);
    ctx.strokeStyle = theme.warning;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(margin.left, meanY); ctx.lineTo(margin.left + plotW, meanY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.warning;
    ctx.textAlign = "right";
    ctx.fillText(`总良率 ${formatPercent(state.analysis.yield)}`, margin.left + plotW, meanY - 7);

    const gradient = ctx.createLinearGradient(0, margin.top, 0, margin.top + plotH);
    gradient.addColorStop(0, colorWithAlpha(theme.accent, 0.28));
    gradient.addColorStop(1, colorWithAlpha(theme.accent, 0.01));
    ctx.beginPath();
    blocks.forEach((block, index) => {
      const point = [xFor(index), yFor(block.yield * 100)];
      index ? ctx.lineTo(...point) : ctx.moveTo(...point);
    });
    ctx.lineTo(xFor(blocks.length - 1), margin.top + plotH);
    ctx.lineTo(xFor(0), margin.top + plotH);
    ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();

    ctx.beginPath();
    blocks.forEach((block, index) => {
      const point = [xFor(index), yFor(block.yield * 100)];
      index ? ctx.lineTo(...point) : ctx.moveTo(...point);
    });
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 2; ctx.stroke();
    blocks.forEach((block, index) => {
      ctx.beginPath(); ctx.arc(xFor(index), yFor(block.yield * 100), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = block.yield + 0.00001 < state.analysis.yield ? theme.danger : theme.accent; ctx.fill();
    });
    ctx.fillStyle = theme.muted; ctx.textAlign = "left"; ctx.fillText("第 1 条", margin.left, height - 8);
    ctx.textAlign = "right"; ctx.fillText(`第 ${formatInteger(state.analysis.total)} 条`, margin.left + plotW, height - 8);
  }

  function drawParameterChart(result) {
    if (!result?.stability || !result.points.length) return drawEmptyChart(el.parameterChart, "该测试项没有 Pass 数值");
    const setup = prepareCanvas(el.parameterChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const item = result.stability;
    const points = downsample(result.points, 900);
    const candidates = points.map((point) => point.value);
    if (item.lower !== null) candidates.push(item.lower);
    if (item.upper !== null) candidates.push(item.upper);
    let min = Math.min(...candidates);
    let max = Math.max(...candidates);
    const padding = (max - min || Math.abs(max) * 0.05 || 1) * 0.1;
    min -= padding; max += padding;
    const margin = { top: 20, right: 20, bottom: 34, left: 66 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    drawAxes(ctx, margin, plotW, plotH, min, max, theme, item.unit || "");
    const xFor = (index) => margin.left + (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
    const yFor = (value) => margin.top + plotH - ((value - min) / Math.max(max - min, Number.EPSILON)) * plotH;
    [[item.lower, "LSL"], [item.upper, "USL"]].forEach(([value, label]) => {
      if (value === null) return;
      const y = yFor(value);
      ctx.strokeStyle = theme.danger; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = theme.danger; ctx.textAlign = "right";
      ctx.fillText(`${label} ${formatNumber(value)}`, margin.left + plotW, y - 6);
    });
    if (item.mean !== null) {
      const y = yFor(item.mean);
      ctx.strokeStyle = theme.success; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.beginPath();
    points.forEach((point, index) => {
      const xy = [xFor(index), yFor(point.value)];
      index ? ctx.lineTo(...xy) : ctx.moveTo(...xy);
    });
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 1.5; ctx.stroke();
    if (points.length < 220) {
      ctx.fillStyle = theme.accent;
      points.forEach((point, index) => { ctx.beginPath(); ctx.arc(xFor(index), yFor(point.value), 2, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.fillStyle = theme.muted; ctx.textAlign = "left"; ctx.fillText("Pass 样本 1", margin.left, height - 8);
    ctx.textAlign = "right"; ctx.fillText(`Pass 样本 ${formatInteger(result.points.length)}`, margin.left + plotW, height - 8);
  }

  function drawFileYieldChart() {
    const items = currentFileSummaries();
    if (!items.length) return drawEmptyChart(el.fileYieldChart, "没有文件");
    const setup = prepareCanvas(el.fileYieldChart);
    if (!setup) return;
    const { ctx, width, height, theme } = setup;
    const margin = { top: 26, right: 20, bottom: 62, left: 48 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    drawAxes(ctx, margin, plotW, plotH, 0, 100, theme, "%");
    const slot = plotW / items.length;
    const barW = Math.min(64, slot * 0.62);
    items.forEach((item, index) => {
      const value = item.yield * 100;
      const x = margin.left + index * slot + (slot - barW) / 2;
      const h = (value / 100) * plotH;
      const y = margin.top + plotH - h;
      ctx.fillStyle = value >= 95 ? theme.success : value >= 80 ? theme.warning : theme.danger;
      roundRect(ctx, x, y, barW, h, 5); ctx.fill();
      ctx.fillStyle = theme.text; ctx.textAlign = "center"; ctx.fillText(`${value.toFixed(1)}%`, x + barW / 2, y - 8);
      ctx.save(); ctx.translate(x + barW / 2, margin.top + plotH + 12); ctx.rotate(-0.35);
      const typeLabel = item.kind === "summary" ? "汇总" : `${item.testType} ${item.stage}`;
      ctx.fillStyle = theme.muted; ctx.textAlign = "right"; ctx.fillText(`${typeLabel} · ${shortName(item.name, 16)}`, 0, 0); ctx.restore();
    });
  }

  function drawAxes(ctx, margin, plotW, plotH, min, max, theme, unit) {
    for (let tick = 0; tick <= 4; tick += 1) {
      const y = margin.top + (plotH * tick) / 4;
      const value = max - ((max - min) * tick) / 4;
      ctx.strokeStyle = theme.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
      ctx.fillStyle = theme.muted; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(`${formatNumber(value)}${unit === "%" ? "%" : ""}`, margin.left - 8, y);
    }
    ctx.textBaseline = "alphabetic";
  }

  function downsample(points, maxPoints) {
    if (points.length <= maxPoints) return points;
    const result = [];
    const bucketSize = points.length / maxPoints;
    for (let i = 0; i < maxPoints; i += 1) {
      const start = Math.floor(i * bucketSize);
      const end = Math.min(points.length, Math.floor((i + 1) * bucketSize));
      let min = points[start];
      let max = points[start];
      for (let j = start + 1; j < end; j += 1) {
        if (points[j].value < min.value) min = points[j];
        if (points[j].value > max.value) max = points[j];
      }
      if (min.index < max.index) result.push(min, max); else result.push(max, min);
    }
    return result;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function colorWithAlpha(color, alpha) {
    if (/^#[0-9a-f]{6}$/i.test(color)) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  function ellipsize(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let result = text;
    while (result.length > 3 && ctx.measureText(`${result}…`).width > maxWidth) result = result.slice(0, -1);
    return `${result}…`;
  }

  function showMessage(text, type = "") {
    el.message.textContent = text;
    el.message.className = `message${type ? ` is-${type}` : ""}`;
  }

  function formatInteger(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function formatDecimal(value, maximumFractionDigits = 1) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "—";
    return Number(value).toLocaleString("zh-CN", {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    });
  }

  function formatPercent(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(value < 0.01 && value > 0 ? 2 : 1)}%` : "—";
  }

  function formatYieldPrecise(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(3)}%` : "—";
  }

  function formatPercentagePointDelta(value) {
    if (!Number.isFinite(value)) return "—";
    const points = value * 100;
    const decimals = Math.abs(points) < 0.1 && points !== 0 ? 3 : 2;
    return `${points > 0 ? "+" : ""}${points.toFixed(decimals)}%`;
  }

  function failDirectionStat(count, failTotal) {
    const share = failTotal ? count / failTotal : 0;
    return `<span class="direction-stat"><strong>${formatInteger(count)}</strong><small>${(share * 100).toFixed(2)}%</small></span>`;
  }

  function failTotalStat(count, batchShare) {
    const share = Number.isFinite(batchShare) ? batchShare : 0;
    return `<span class="direction-stat"><strong>${formatInteger(count)}</strong><small>${(share * 100).toFixed(2)}%</small></span>`;
  }

  function inputNumber(value) {
    if (value === null || value === undefined || !Number.isFinite(value)) return "";
    return String(Number(value.toFixed(6)));
  }

  function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    if (!Number.isFinite(value)) return value > 0 ? "∞" : "-∞";
    const absolute = Math.abs(value);
    if (absolute >= 1000) return value.toFixed(1);
    if (absolute >= 10) return value.toFixed(3);
    if (absolute >= 0.1) return value.toFixed(4);
    if (absolute === 0) return "0";
    return value.toFixed(5);
  }

  function formatCompact(value) {
    return Number(value).toLocaleString("zh-CN", { notation: "compact", maximumFractionDigits: 1 });
  }

  function formatMeasurement(value, unit) {
    return value === null || value === undefined ? "—" : `${formatNumber(value)}${unit ? ` ${escapeHtml(unit)}` : ""}`;
  }

  function formatBounds(lower, upper, unit) {
    const suffix = unit ? ` ${escapeHtml(unit)}` : "";
    if (lower !== null && upper !== null) return `${formatNumber(lower)} ～ ${formatNumber(upper)}${suffix}`;
    if (lower !== null) return `≥ ${formatNumber(lower)}${suffix}`;
    if (upper !== null) return `≤ ${formatNumber(upper)}${suffix}`;
    return "—";
  }

  function formatSpec(item) {
    const value = formatBounds(item.lower, item.upper, item.unit);
    return item.specVariant ? `${value} <span class="badge watch">多规格</span>` : value;
  }

  function formatPpk(value) {
    if (value === null || value === undefined) return "—";
    if (!Number.isFinite(value)) return value > 0 ? "∞" : "-∞";
    return value.toFixed(2);
  }

  function formatRatio(value) {
    return value === null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(1)}%`;
  }

  function statusText(status) {
    return { stable: "稳定", watch: "关注", risk: "风险", insufficient: "样本不足" }[status] || "未知";
  }

  function statusBadge(status) {
    return `<span class="badge ${escapeHtml(status)}">${statusText(status)}</span>`;
  }

  function directionText(direction) {
    return { low: "低于下限", high: "高于上限", within: "SBIN Fail/值在规格内", unknown: "缺少实测值" }[direction] || "无法判定";
  }

  function directionBadge(direction) {
    const className = direction === "low" || direction === "high" ? "fail" : "unknown";
    return `<span class="badge ${className}">${directionText(direction)}</span>`;
  }

  function fileStageText(file) {
    if (!file) return "FT";
    return file.isRetest ? `复测 · ${file.stage}` : file.stage || "FT";
  }

  function rawNumber(value) {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
    return String(value);
  }

  function shortName(value, maxLength) {
    const text = String(value || "");
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
  }

  function rangeFileName(file) {
    const name = String(file?.name || "");
    const archiveSeparator = name.lastIndexOf(" / ");
    const entryName = archiveSeparator >= 0 ? name.slice(archiveSeparator + 3) : name;
    return entryName.replace(/\\/g, "/").split("/").pop() || entryName;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadText(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function timestampForFile() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  }

  initialize();
})();
