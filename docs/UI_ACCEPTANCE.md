# FT-REPORT 验收状态

## v1.88 首页导入提示验收（2026-10-21）

- Edge headless：1920/390 宽度标题可见且无横向溢出，文件选择器实际导入成功，页面更新日志 v1.88 可见；截图 outputs/landing-v1.88-*.png。
- app.js 语法及 git diff --check 通过。本次仅文案变更，未重跑核心统计或完整分辨率矩阵。

## v1.87 GitHub 发布前复验（2026-10-21）

- 核心三脚本 15/15 通过；mode-switch 的 744561 条记录模式切换、limit-drag 的 150000 条记录/80 事件合并模拟通过。
- distribution-layout、simulation-drawer、chart-layout、batch-ui、retest-ui 均通过；实际更新日志 v1.87 可见。
- ui-acceptance 完整七组 1080p/2K/4K 视口/DPR、七模块明暗主题、专业与简易导出通过；实际专业报告含汇总和参数稳定性、不含逐条 Fail 明细。
- 首次并行跑大数据与分辨率时截图超时；大数据任务结束后单独重跑完整矩阵通过。无功能失败被忽略。
- 三个运行脚本语法及 git diff --check 通过。验收仍是 Edge headless/合成数据，不等同全部生产文件或实体设备。
- 本次只整理发布文档，应用保持 v1.87；README 及 CHANGELOG 已按最终行为重写，中间方案归档。

## v1.87 简易说明精简验收（2026-10-21）

- 四宽度总览检查及 ui-acceptance 通过；已目视确认标题下排序/计算说明段落删除，截图 outputs/overview-v1.87.png。页面实际更新日志 v1.87、模式、导出和各页访问通过。
- app.js 语法及 git diff --check 通过。

## v1.86 导出报告验收（2026-10-21）

- Edge headless：ui-acceptance 通过，实际下载专业报告验证仍含 Fail 项汇总、参数稳定性、12000 记录统计，不含 Fail 明细段及逐条记录表头；页面明细筛选和实际日志 v1.86 通过。
- retest-ui、batch-ui 通过，末轮空封与批次统计/导出有效。app.js 语法和 git diff --check 通过。

## v1.85 总览文案验收（2026-10-21）

- Edge headless：四种宽度总览对齐、无横向溢出及空封备注产品范围检查通过；目视确认数据良率提示、首要 Fail 无次数、理论 UPH/日产出，截图 outputs/overview-v1.85.png。数据良率与非批次真实良率分两行。
- distribution-layout、ui-acceptance 通过，含实际更新日志 v1.85、模式、导出及多视口；最后分行微调后复测四宽度总览。app.js 语法与 git diff --check 通过。

## v1.84 按钮高度验收（2026-10-21）

- Edge headless、1536×864/DPR1.25：实测导入、继续添加、导出、清空、主题、模式容器、查看 Fail 明细均为 36 CSS px / 10px 圆角。修改前当前代码亦相同，本次主要统一高度约束。
- distribution-layout 通过，包含明细跳转、主题、模式、多视口及实际日志 v1.84；app.js 语法及 git diff --check 通过。

## v1.83 导出按钮验收（2026-10-21）

- Edge headless：distribution-layout、ui-acceptance 通过；包含桌面/窄屏、主题、模式、导出实际下载及实际更新日志 v1.83。
- 已目视确认导出按钮为浅底细边框蓝字，与相邻按钮保持相同高度和圆角。app.js 语法及 git diff --check 通过。

## v1.82 按钮统一验收（2026-10-21）

- Edge headless：distribution-layout、simulation-drawer、ui-acceptance 全部通过，覆盖桌面/窄屏、共享工具栏、导入点击、主题、模式、导出下载、规格模拟及实际更新日志 v1.82。
- app.js 语法及 git diff --check 通过。目视检查 acceptance-1536x864-dpr1.25.png，按钮高度、圆角及导出字重已更新。
- 此次未重跑完整 2K/4K 矩阵及核心算法测试，上一轮结果保留原版本标注。

## v1.81 多分辨率整体验收（2026-10-21）

详见 [分辨率验收报告](RESOLUTION_ACCEPTANCE.md)。七组 Edge 视口与 DPR、七页面明暗主题、98 张截图通过；修复总览两处文字问题后已复跑。核心 15 项、74 万条模式切换、15 万条拖线及批次/复测/导出等本次回归通过，具体版本时效见报告。

## v1.80 本次验证（2026-10-21）

- Edge headless：总览合成数据在 1920/1536/980/390 宽度逐行核对标题、主值底边及说明位置，对齐且无横向溢出；LX1630H/IDD 显示备注，其他产品不显示。目视检查 outputs/overview-v1.80.png。
- distribution-layout、simulation-drawer 通过，包含实际浏览器更新日志 v1.80；app.js 语法和 git diff --check 通过。

## v1.79 本次验证（2026-10-21）

- Edge headless：chart-layout、distribution-layout、simulation-drawer、ui-acceptance 通过，覆盖完整首屏、滚动稳定、响应式布局、规格拖线及页面更新日志 v1.79。
- app.js 语法和 git diff --check 通过。真实生产数据滚动手感未测量。

## v1.78 本次验证（2026-10-21）

- Edge headless：chart-layout、distribution-layout、simulation-drawer 全部通过；确认最大化按钮不存在，图表切换、滚动稳定、响应式、输入模拟及拖线保持可用，实际更新日志显示 v1.78。
- app.js 语法及 git diff --check 通过。

## v1.77 本次验证（2026-10-21）

- Edge headless：chart-layout、distribution-layout、simulation-drawer、ui-acceptance 全部通过；包含首屏完整图表、滚动不重绘、窗口缩放、最大化/拖线、窄屏、页面更新日志 v1.77。
- app.js 语法及 git diff --check 通过。已目视检查 acceptance-1536x864-dpr1.25.png，图表坐标轴完整可见。
- 本次未重跑 15 万条拖线性能检查，沿用下方 v1.76 历史记录；真实 Windows 手感未测量。


更新日期：2026-10-21。本次 v1.76 使用 Edge headless 实际执行以下浏览器回归，历史记录单独保留。

## v1.76 本次验证

- chart-layout：通过；新增页面滚动和右侧滚动不改变图表尺寸且 Canvas clearRect 次数为 0，滚动后窗口缩放与页顶缩放结果一致；桌面绘图区扩大、三模式、侧栏、最大化、拖线及窄屏通过。
- distribution-layout、simulation-drawer：通过；双面板、指标对齐、输入模拟、主题、响应式布局及实际浏览器更新日志 v1.76 可见。
- limit-drag：通过；150000 条合成数据、80 次同步移动合并为一次模拟，抓取、松开与恢复通过。
- ui-acceptance：通过；1080P、DPR1.25 等视口、独立滚动、模式、导出及断点，无页面脚本或网络错误。
- app.js 语法与 git diff --check：通过。

本次截图：outputs/inline-simulation-v1.76.png、outputs/acceptance-*；已目视检查 1536×864 / DPR1.25 截图。截图为合成数据，实际生产数据与 Windows 滚动主观手感尚未测量。

| 最近执行版本 | 检查 | 结果与覆盖 |
| --- | --- | --- |
| v1.75 | simulation-drawer.cjs | 通过；左右标题/两排指标上下边界对齐，正负数量分两行、单行与 0，强调色填满、LSL/USL 左侧标签，六视口/多规格/缺失限/非法规格/恢复/日志 |
| v1.75 | distribution-layout.cjs | 通过；统计精度、展开参数顺序/0 数量、视口内菜单、搜索/侧栏/主题、模拟和图表拖线、版本日志等；旧高度断言随已批准布局同步 |
| v1.75 | chart-layout.cjs | 通过；图表切换/响应式双图回退/最大化还原/拖线/同一 Canvas 和统计 DOM/无重新分析 |
| v1.75 | ui-acceptance.cjs | 通过；1080P 与 DPR1.25 等效视口、布局/滚动/页签/模式/文件范围/导出/CSS 断点，无页面脚本或网络错误 |
| v1.75 | app.js 语法、git diff --check | 通过 |
| v1.73 | limit-drag.cjs | 150000 合成行、80 连续事件仅一次模拟，抓取不跳、松开最终值和恢复通过；不是实机流畅度保证 |
| v1.67 | 核心三脚本共 15 项 | 通过；Core 此后未改，但不能说 v1.75 已重跑 |
| v1.65 | mode-switch.cjs | 744561 合成行、模式不重分析/重建统计，导出/移动端/重新导入通过 |
| v1.63（2026-10-16） | batch-ui、retest-ui | 通过；批次面板隐藏、复测去重/空封及导出；此后未声称重跑 |

实际截图：outputs/inline-simulation-v1.75.png；综合测量：outputs/ui-acceptance.json 与 acceptance-* 截图。它们均为 Git 忽略输出，普通提交不携带。旧文件可能被重跑覆盖；方案 preview 不是最终程序或业务准确性证据。

浏览器为 Edge headless + 合成数据；CSS viewport/DPR 不等于真实 Windows 100%/125% 系统缩放。生产文件、其他浏览器、真实可用高度和拖线主观手感仍需实机反馈。v1.75 使用 CSS subgrid，非当前 Edge 浏览器的兼容性未单独验收。

命令见 HANDOFF.md。旧验收全文见 history/UI_ACCEPTANCE_2026-10-21_before-consolidation.md，旧五 KPI/模拟抽屉要求已被用户后续授权替代。
