# FT-REPORT · FT 数据分析工作台

面向半导体 Final Test 数据的本地离线分析工具。支持批量导入测试明细，查看测试事件良率、Fail 归因、参数稳定性和复测链统计，并通过调整规格试算良率变化。

**当前版本：v1.87** · [下载离线包](https://github.com/longxiaoxiaoqi/FT-REPORT/releases/latest) · [更新说明](CHANGELOG.md)

数据在本机浏览器内存中处理，无需上传测试文件，无需安装 Node.js、Python 或联网服务。建议使用新版 Microsoft Edge 或 Chrome。

## 快速开始

1. 下载 Release 中的 `FT-REPORT-v1.87.zip` 并完整解压。
2. 双击 `启动FT分析工具.bat`，或直接打开 `index.html`。
3. 拖入 CSV、XLSX、ZIP、7z、RAR 或文件夹；支持继续添加文件和文件内容去重。
4. 选择分析范围，在简易模式查看重点指标，或切换专业模式查看完整分析。
5. 点击导出按钮下载 CSV 报告。刷新或关闭页面后，需重新导入数据。

## 主要功能

| 模块 | 内容 |
| --- | --- |
| 总览 | 产品、测试记录、Pass/Fail、首要 Fail、测试时间、理论 UPH 和理论日产出；专业模式提供 Pareto、良率趋势及单项联动 |
| Fail 分布 | 全部测试项选择、Fail 搜索、趋势图/直方图/双图、规格区聚焦与全部范围切换 |
| 良率模拟 | 常驻数据统计和模拟双面板，支持拖动规格线、输入 LSL/USL、恢复原规格，分别显示恢复与新增 Fail |
| Pass 稳定性 | 均值、标准差、Ppk、规格利用率、参数趋势及搜索 |
| Fail 明细 | 页面内逐条查询、筛选失效记录和空封标记，联动参数分布 |
| 文件对比 | 多文件统计与良率对比，点击文件切换分析范围 |
| 数据审计 | 字段缺失、疑似重复、文件角色、规格冲突及数量流转提示 |
| 更新日志 | 页面内查看版本演进 |

- 简易/专业模式复用已有分析结果；Fail 分布左右独立滚动，支持收起侧栏与明暗主题。
- 默认趋势图，窄区域双图自动回退到单图；页面滚动不再改变图表高度。
- 规格模拟保留其他 Fail 原因，原规格模拟回到实际测试事件良率；多规格冲突时禁用模拟。
- 导出保留核心指标、Fail 汇总、参数稳定性及适用的批次统计；**不导出逐条 Fail 明细**。明细可在页面内查看。

## v1.87 更新摘要（相对 v1.56）

- 收紧工具栏与图表操作区，统一按钮、总览文字行高及统计/模拟面板边界。
- 全部测试项按测试顺序展开，默认趋势图；采用常驻统计/模拟双面板，分别呈现正负恢复数量。
- 合并连续规格拖动的模拟计算，修复滚动拉伸、首屏图表适配、总览刻度裁切及文字重叠。
- 明确数据良率与批次良率的区别，标注理论产能，精简页面说明及导出内容。
- 增补 1080p、2K、4K 七组视口/DPR 验收与合成数据回归记录。

完整说明见 [CHANGELOG.md](CHANGELOG.md)。中间曾试用的模拟抽屉、图表最大化和五 KPI 方案均已被后续界面取代。

## 支持的输入

| 格式 | 识别与用途 |
| --- | --- |
| ETS CSV | Date / Site / Serial / HBIN / SBIN 测试明细 |
| PowerTECH CSV | Site # / Serial # / SBin / HBin，以及 Test Name / Test Number 定义 |
| DataLog CSV | Data Log Site、TestItem、HiFBin/LoFBin 和规格定义 |
| ATX Datalog CSV | Device#、Pass Fail、Hard Bin / Soft Bin 等测试明细 |
| Loop XLSX | 循环宽表测试，每行按循环事件处理 |
| 工厂良率 XLSX | 工厂投入/产出参考，不作为逐颗测试明细混入总览 |
| Summary CSV | 独立报告视图，校验 Total、Pass/Fail、Bin 合计及报告良率 |
| ZIP / 7z / RAR、文件夹 | 批量读取支持文件，文件夹递归遍历；7z/RAR 使用随包提供的离线组件 |

Summary 不与明细自动关联，也不计入默认逐颗统计。文件名末尾的测试时间用于文件排序，FT/RT 阶段用于复测链识别；未知、缺失及冲突保留提示。

## 指标口径

- **数据良率**：当前所选测试记录的 Pass / 全部测试事件；复测与 Loop 不等于新增唯一产品，也不代表已确认的整批最终良率。
- **Fail 归因与参数超限**：归因来自测试格式及 Bin 规则，归因 Fail 数与参数实测超限数可能不同；页面红蓝数值图按规格判断。
- **批次复测链**：分母为初测投入，分子为初测 Pass 加各轮 RT Pass；依赖阶段与数量核对，缺轮或异常链不能强行输出确定良率。当前总览批次面板隐藏，计算与导出保留。
- **空封**：仅在已验证产品/格式下按前置 OS 特征识别，不按 HBin5 一概认定。排空封良率只扣各子批当前最高 RT 的空封，无 RT 时扣初测，不累加各轮。
- **空封备注**：明细单产品 LX1630H 且首要 Fail 为 IDD 时，卡片显示用户补充的“大部分为空封”备注；该文字不参与识别或统计。
- **Ppk**：普通生产使用 Pass 有效值，Loop 使用全部循环有效值；低样本保留提示，不能直接当作整批过程能力结论。
- **理论 UPH**：`3600 × 1000 / (单颗测试时间 ms + 150 ms Index 时间)`。
- **理论日产出**：`UPH × 20 小时 × 85% 稼动率`。单颗测试时间缺失时不推测产能。

详细边界见 [业务规则](docs/BUSINESS_RULES.md)。

## 验证与开发

运行软件无需测试环境。开发回归使用 Node.js，浏览器检查需外部 Playwright 与 Edge；可用 `FT_PLAYWRIGHT` 指定 Playwright 包路径。

```powershell
node --check app.js
node --test tests/core-regression.cjs tests/sub-lots.cjs tests/empty-seal.cjs
node tests/ui-acceptance.cjs
```

分辨率矩阵：设置 `FT_RESOLUTION_MATRIX=1` 后执行 `node tests/ui-acceptance.cjs`。验收记录见 [UI 验收](docs/UI_ACCEPTANCE.md) 和 [分辨率报告](docs/RESOLUTION_ACCEPTANCE.md)。这些是 Edge headless 视口/DPR 模拟与合成数据验证，不等于全部生产文件或实体显示器实测。

开发接续先读 [AGENTS.md](AGENTS.md)、[项目状态](docs/PROJECT_STATUS.md) 和 [交接说明](docs/HANDOFF.md)。

## 文件与离线组件

- `index.html` / `styles.css` / `app.js`：界面、图表和交互。
- `ft-core.js`：格式解析和统计计算。
- `sevenzip-loader.js` / `vendor/7z-wasm/`：离线解压组件及许可证，分发时须一并保留。
- `tests/` / `docs/`：合成回归与业务、验收、交接记录。

后续更新同步页面日志、版本及资源参数；发布时提交代码、创建版本标签和离线包。生产数据及临时输出不纳入仓库。
