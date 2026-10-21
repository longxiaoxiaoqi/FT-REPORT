# 项目上下文接续单

## 2026-10-21 当前更新：v1.75（未发布）

- 按用户确认预览，并排统计/模拟面板通过共享 Grid 行轨道（subgrid）同步标题、主指标和次指标高度。以最小高度加内容自适应增长，保留完整数字及原字号；窄屏上下排列不变。
- 恢复与新增 Fail 同时发生时在同格分两行展示，正绿/负红规则不变；模拟主指标内部强制伸展，强调底色仍填满。
- 页面/资源 v1.75 / 1.75.0，当前日志页已验证。本次通过 simulation-drawer（双行/单行下左右行边界精确对齐、六视口、强调背景与输入/模拟边界）、distribution-layout、chart-layout、ui-acceptance、app.js 语法及 git diff --check。已查看 outputs/inline-simulation-v1.75.png；未实测生产数据或系统缩放，未提交发布。


## 2026-10-21 当前更新：v1.74（未发布）

- 修复模拟总良率强调底色未填满：统一主指标容器 padding: 0，覆盖旧 #yieldSimulation 上下 4px 内边距，保留单元格文字 padding 与容器圆角裁切。
- 页面/资源 v1.74 / 1.74.0，日志同步。本次通过 simulation-drawer 六视口回归：强调单元格上/下/右边界紧贴容器内边框（误差不超过 1.1px），以及模拟边界、标签、当前更新日志；app.js 语法与 git diff --check 通过。
- 不改统计/模拟算法，未提交发布。


## 2026-10-21 当前更新：v1.73（未发布）

- 优化规格线拖动：pointermove 只更新目标规格和输入值，模拟计算合并至动画帧；松开/取消/捕获丢失时刷新最终结果。保留抓取偏移减少起拖跳动。
- 冻结拖动范围时复用完整视窗外计数，不删异常、不改采样；只重绘可见图表，避免默认趋势图时扫描隐藏直方图。未改 Core 算法。
- 页面/资源版本 v1.73 / 1.73.0，实际页面日志已核对。
- 本次通过 tests/limit-drag.cjs（150000 合成记录、80 次同步移动合并为一次模拟、偏移抓取不跳、最终值/恢复）、chart-layout、distribution-layout、simulation-drawer、JS 语法与 git diff --check。自动化不是实际手感或生产数据验收，未提交发布。


## 2026-10-21 当前更新：v1.72（未发布）

- 用户确认紧凑布局预览后，应用预览 CSS：缩小当前项标题/规格说明、面板标题、卡片内边距、主次指标行高及工具栏留白；全部指标、两行结构和规格操作保留。
- 顶部缩小后原自适应 Canvas 逻辑将可用高度让给图表，不改数据/抽样/模拟算法。窄屏继续按既有断点排列。
- 页面/资源版本 v1.72 / 1.72.0，实际日志页已核对。
- 本次通过 simulation-drawer、chart-layout、distribution-layout、ui-acceptance、app.js 语法和 git diff --check；更新了原指标高度断言以匹配批准的紧凑行高。已查看 outputs/inline-simulation-v1.72.png，合成数据下布局/输入/恢复/拖线/最大化/多规格/缺失限及窄屏无溢出通过。未实测生产数据或 Windows 系统缩放，未提交发布。


## 2026-10-21 当前更新：v1.71（未发布）

- 按用户截图将 LSL、USL 标签分别放到对应输入框左侧；显式设置 label flex-direction: row，覆盖早期纵向排列规则。
- 页面/资源版本 v1.71 / 1.71.0，页面日志同步。
- 本次通过 simulation-drawer 浏览器回归：六视口验证标签位于输入框左侧且垂直居中、无横向溢出，同时核对模拟边界和日志。app.js 语法、git diff --check 通过；未提交发布。


## 2026-10-21 当前更新：v1.70（未发布）

- 按用户截图批注，左侧标题由“原始数据 测试统计”改为“数据统计”，右侧由“规格与良率模拟”改为“良率模拟”。
- 页面/资源版本 v1.70 / 1.70.0，更新日志已同步；仅文案修改。
- 本次通过 simulation-drawer 浏览器回归（标题精确断言、六视口与当前日志）、app.js 语法和 git diff --check；未提交发布。


## 2026-10-21 当前更新：v1.69（未发布）

- 按用户绿框标注删除模拟底部说明、趋势图独立标题栏，收紧面板底部留白。趋势图最大化按钮移到现有图表工具栏，功能保留。
- 自适应图高只扣实际存在的图表标题高度，避免标题删除后仍预留空间；模拟与统计计算不变。
- 页面/资源 v1.69 / 1.69.0，浏览器当前日志已验证。本次通过 simulation-drawer、chart-layout、distribution-layout、app.js 语法与 git diff --check，包含六视口、拖线、最大化/还原、窄屏及模拟边界。实际截图 outputs/inline-simulation-v1.69.png 已检查；未执行生产数据/真实系统缩放验收，未提交发布。


## 2026-10-21 当前更新：v1.68（未发布）

- 按用户确认的预览，两侧均为上排两大格、下排四小格。左侧下排：原规格低于下限/高于上限/超限率/均值；删除标准差与最小最大展示。右侧下排：良率变化/预计 Pass/恢复与新增 Fail/模拟低高超限；删除单独新增 Fail 格及参数合格率展示。
- 恢复用绿色 +数量、新增 Fail 用红色 −数量，同一格分别显示；同时存在时不做净额抵销，无变化显示 0 条。原始计数与 Core 模拟计算保持不变。
- 页面/资源版本 v1.68 / 1.68.0，已同步并在实际浏览器验证更新日志。极窄屏下排两列换行，避免文字被裁切。
- 本次通过 simulation-drawer（两行及正负数量/同时发生/无变化、六视口、非法/多规格/缺失限）、distribution-layout、chart-layout、ui-acceptance、app.js 语法与 git diff --check。实际截图 outputs/inline-simulation-v1.68.png 已检查。合成数据验证，未执行生产数据或真实系统缩放验收，未提交发布。


## 2026-10-19 当前更新：v1.67（未发布）

- 用户明确要求取消良率模拟抽屉、恢复参考图的常驻双面板；本次要求取代此前 KPI/抽屉布局保护要求。
- 顶部左侧测试统计：归因 Fail、有效数值、原规格低/高超限与超限率、均值/标准差、最小/最大；右侧 LSL/USL、恢复原规格、当前/模拟总良率及全部六项模拟明细。
- 删除抽屉 DOM、入口和相关事件；复用 distributionLimits、原输入/恢复/拖线及 Core 模拟算法。默认趋势图及全部测试项展开列表保留。内容宽度不足时双面板上下排列，可通过右侧独立滚动查看完整图表。
- 页面/资源版本 v1.67 / 1.67.0，已在实际浏览器验证当前更新日志。
- 本次通过 simulation-drawer.cjs（文件名保留兼容，内容已改为双面板验收）、distribution-layout、chart-layout、ui-acceptance、app.js 语法与 git diff --check，以及核心 15 项；查看 outputs/inline-simulation-v1.67.png 确认实际桌面布局。未使用生产数据验收，未提交或发布。


## 2026-10-19 当前更新：v1.66（未发布）

- 用户要求默认显示趋势图：初始状态、静态按钮与清空重置均改为 trend；保留直方图/双图手动切换。
- 页面及资源版本 v1.66 / 1.66.0，页面更新日志同步。
- 本次通过 chart-layout、distribution-layout 浏览器回归（含日志页）、app.js 语法及 git diff --check；未提交发布。


## 2026-10-19 当前接续：v1.65（未发布）

- 已按用户最终预览实施顶部“全部测试项”展开列表，移除排序控件和底部重复选择器；原 Fail 列表/搜索保留、按 Fail 数降序。
- 展开列表使用 distributionTestNames 的文件内测试顺序，多文件按选中文件顺序合并去重；包含无 Fail 项，蓝底条按最大归因 Fail 数归一化，0 不画条。
- 固定定位避开侧栏裁切，视口内限宽限高、独立滚动、长名换行；选择/外部点击/Esc/窗口变化/侧栏收起均关闭。
- 本次通过 node --check app.js、tests/distribution-layout.cjs（含实际日志页、顺序与 0 数量、七种视口边界）、tests/mode-switch.cjs（744561 合成记录）和 git diff --check。
- 已查看实际浏览器截图 outputs/test-picker-v1.65.png；未使用生产数据验收。页面/资源版本 v1.65 / 1.65.0，历史小节保留此前基线。
- 未改业务算法、未提交或发布，保留此前累计修改。


## 2026-10-19 接续修复：v1.64（未发布）

- 修复左下角全部参数菜单原 320px 右对齐超出 252px 侧栏而被裁切：改为侧栏内文档流展开、独立滚动，长参数名换行。
- 页面版本 v1.64，app/CSS 参数 1.64.0，已补页面更新日志；下文 v1.63 描述为此前交接基线。
- 本次通过 app.js 语法检查、distribution-layout 浏览器回归及 git diff --check；浏览器检查确认菜单左右边界位于侧栏内、选择有效、当前更新日志可见，覆盖既有桌面/窄屏流程。
- 未改业务算法，未提交或发布，保留累计未提交修改。


整理日期：2026-10-19。本文件供新对话快速接续，不是新增功能或发布授权；当前事实以 PROJECT_STATUS.md 为准。

## 已完成与当前目标

用户本轮完整要求是优化 1080P/Windows 125% 下的阅读布局，保留业务与图表交互，按五阶段实施：

1. 紧凑工具栏、导航、可折叠测试项侧栏：完成。
2. 五项 KPI 横排与详细统计：完成。
3. 双图布局、单图切换、最大化、响应式：完成。
4. 良率模拟抽屉，复用已有状态和算法：完成。
5. 累计 UI 检查、语法与回归、1080P 等效适配：自动化完成，生产数据/真实系统缩放未验收。

最新用户任务是整理上下文，本次未追加功能。应用保持 v1.63，HEAD 仍是 v1.56；累计改动未提交。继续前先检查 git status，不要把未跟踪测试或文档当临时文件删掉。

## 只读这些入口即可开始

| 需求 | 文件与定位 |
| --- | --- |
| 规则/当前状态 | AGENTS.md、docs/PROJECT_STATUS.md |
| 主 DOM | index.html：workspace-navigation、distributionLayout、distributionStats、distributionCharts、simulationDrawer |
| UI 状态与事件 | app.js：bindEvents；chartMode/chartSingle/maximizedChart/sidebarCollapsed；distributionLimits 为原模拟状态 |
| 侧栏 | renderDistributionFailList、setSidebarCollapsed、updateDistributionTestSelect |
| KPI | renderSelectedDistribution；5 项主指标、7 项详细统计，沿用现有 formatMeasurement/formatPercent 等格式 |
| 双图与尺寸 | updateDistributionChartLayout、scheduleDistributionChartLayout、fitDistributionPanels；drawFailSequenceChart/drawFailHistogramChart 是原画布绘制入口 |
| 模拟 | renderLimitSimulator、renderYieldSimulation、updateLimitFromInput、resetDistributionLimits；不另建一份模拟状态 |
| 抽屉/最大化 | simulationDrawer 与 chartMaxDialog 均为原生 dialog；最大化移动同一图表 DOM，关闭后归位 |
| 样式 | styles.css 末尾 Stage 1–4 规则及对应原选择器；留意旧规则的选择器优先级 |
| 日志/版本 | app.js 的 RELEASE_NOTES；index.html 页脚 v1.63、app/CSS 查询参数 1.63.0 |
| 验收证据 | docs/UI_ACCEPTANCE.md；tests/ui-acceptance.cjs；outputs/ui-acceptance.json 与 acceptance-* 截图 |

无需重新分析全项目；不涉及业务计算时不读 BUSINESS_RULES。原生 HTML/CSS/JS + Canvas，无 React/Vue、无 UI 库、无构建流水线；打开 index.html 可运行。

## 接续时必须保留

- 252/44px 侧栏、搜索/排序/选择、两列独立滚动；长名省略及悬停。
- KPI 数值精度/单位、单项超限与归因 Fail 的区别；模拟原规格必须回到真实事件良率。
- 图表原数据源、采样、异常计数、红蓝点和浅蓝连线；不得借 UI 修改或性能优化丢失异常数据。
- 模拟输入与图表拖线共用 distributionLimits；关闭抽屉保留输入，切换非分布页/简易模式或清空关闭抽屉；多规格/缺失限/非法值保留原处理。
- 模式切换不重新分析/重建统计；切换页签重渲染参数展示是既有行为，不把它误当模式切换回归。
- 总览批次面板保持隐藏，批次/复测链/空封计算及导出保留。ft-core.js 与 sevenzip-loader.js 当前无差异。
- 不回退到旧“完整统计/模拟面板常驻”的布局；新分阶段授权已取代相关早期撤回要求。

## 已通过的检查与重跑方法

最近完整执行为 2026-10-16，详见 UI_ACCEPTANCE；2026-10-19 本次只整理文档，没有重新执行下列回归。

在项目目录用 PowerShell：

```powershell
node --check app.js
node --check ft-core.js
node --check sevenzip-loader.js
node --test tests/core-regression.cjs tests/sub-lots.cjs tests/empty-seal.cjs

# 外部运行环境，不是项目依赖；若位置不同，指定实际 Playwright 包目录。
$env:FT_PLAYWRIGHT = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
node tests/distribution-layout.cjs
node tests/chart-layout.cjs
node tests/simulation-drawer.cjs
node tests/mode-switch.cjs
node tests/batch-ui.cjs
node tests/retest-ui.cjs
node tests/ui-acceptance.cjs
git diff --check
```

- 核心 15 项，浏览器 7 个脚本；mode-switch 使用 744,561 条合成记录。浏览器脚本依赖已安装 Edge 与外部 Playwright，不要为验收给应用添加依赖。
- 复测提示断言读 #message.textContent，因为载入后成功提示按既有设计隐藏；不能用 body.innerText 等待隐藏文本。
- ui-acceptance 覆盖 1920×1080/DPR1、1536×864/DPR1.25、1536×760/DPR1.25、1366×768/DPR1。DPR 等效检查不等于实际切换 Windows 缩放。
- outputs/tmp 被忽略，截图与测量不会随 Git 自动带走；必要合成证据可单独保存。不要把生产数据加进交付仓库。

## 未完成、未授权与历史记录

- 待真实 Windows 100%/125%、生产文件及其他浏览器实机反馈；未确认新功能需求。
- 未授权提交、打标签、打包或发布；整理不是发布授权。后续每次功能/布局/交互修改仍需更新实际页面日志、版本与资源参数，并验证日志页。
- 不自动实施旧“保存项目/备注/更多筛选/CPK”等建议；业务待确认仅在用户提出相关任务时处理，见当前状态边界。
- 旧 docs/PROJECT_STATUS 全文保存在 docs/history/PROJECT_STATUS_2026-10-16.md；其中各版本“本轮/待实施/已撤回”只代表当时，不构成当前指令。根目录旧 PROJECT_STATUS.md 也不是当前入口。

## 可粘贴到新对话

> 继续 FT-REPORT 项目，目录 D:/codex/FT数据/FT数据分析工具。先读 AGENTS.md、docs/PROJECT_STATUS.md，按需读 docs/HANDOFF.md。当前 v1.63，UI 五阶段自动化已完成，累计改动未提交；保留现有布局、计算与图表交互，不重复实施旧阶段。只有涉及业务计算时才读 BUSINESS_RULES。请围绕我本次给出的具体任务定位相关代码、最小修改、运行相关检查，并同步状态及页面更新日志；没有具体任务时先等我补充，不自动开发或发布。
