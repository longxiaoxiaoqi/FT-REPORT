# UI 重构自动化验收记录

## 2026-10-21 当前更新：v1.75（未发布）

- 按用户确认预览，并排统计/模拟面板通过共享 Grid 行轨道（subgrid）同步标题、主指标和次指标高度。以最小高度加内容自适应增长，保留完整数字及原字号；窄屏上下排列不变。
- 恢复与新增 Fail 同时发生时在同格分两行展示，正绿/负红规则不变；模拟主指标内部强制伸展，强调底色仍填满。
- 页面/资源 v1.75 / 1.75.0，当前日志页已验证。本次通过 simulation-drawer（双行/单行下左右行边界精确对齐、六视口、强调背景与输入/模拟边界）、distribution-layout、chart-layout、ui-acceptance、app.js 语法及 git diff --check。已查看 outputs/inline-simulation-v1.75.png；未实测生产数据或系统缩放，未提交发布。


## 2026-10-21 当前更新：v1.72（未发布）

- 用户确认紧凑布局预览后，应用预览 CSS：缩小当前项标题/规格说明、面板标题、卡片内边距、主次指标行高及工具栏留白；全部指标、两行结构和规格操作保留。
- 顶部缩小后原自适应 Canvas 逻辑将可用高度让给图表，不改数据/抽样/模拟算法。窄屏继续按既有断点排列。
- 页面/资源版本 v1.72 / 1.72.0，实际日志页已核对。
- 本次通过 simulation-drawer、chart-layout、distribution-layout、ui-acceptance、app.js 语法和 git diff --check；更新了原指标高度断言以匹配批准的紧凑行高。已查看 outputs/inline-simulation-v1.72.png，合成数据下布局/输入/恢复/拖线/最大化/多规格/缺失限及窄屏无溢出通过。未实测生产数据或 Windows 系统缩放，未提交发布。


## 2026-10-21 当前更新：v1.69（未发布）

- 按用户绿框标注删除模拟底部说明、趋势图独立标题栏，收紧面板底部留白。趋势图最大化按钮移到现有图表工具栏，功能保留。
- 自适应图高只扣实际存在的图表标题高度，避免标题删除后仍预留空间；模拟与统计计算不变。
- 页面/资源 v1.69 / 1.69.0，浏览器当前日志已验证。本次通过 simulation-drawer、chart-layout、distribution-layout、app.js 语法与 git diff --check，包含六视口、拖线、最大化/还原、窄屏及模拟边界。实际截图 outputs/inline-simulation-v1.69.png 已检查；未执行生产数据/真实系统缩放验收，未提交发布。


## 2026-10-21 当前更新：v1.68（未发布）

- 按用户确认的预览，两侧均为上排两大格、下排四小格。左侧下排：原规格低于下限/高于上限/超限率/均值；删除标准差与最小最大展示。右侧下排：良率变化/预计 Pass/恢复与新增 Fail/模拟低高超限；删除单独新增 Fail 格及参数合格率展示。
- 恢复用绿色 +数量、新增 Fail 用红色 −数量，同一格分别显示；同时存在时不做净额抵销，无变化显示 0 条。原始计数与 Core 模拟计算保持不变。
- 页面/资源版本 v1.68 / 1.68.0，已同步并在实际浏览器验证更新日志。极窄屏下排两列换行，避免文字被裁切。
- 本次通过 simulation-drawer（两行及正负数量/同时发生/无变化、六视口、非法/多规格/缺失限）、distribution-layout、chart-layout、ui-acceptance、app.js 语法与 git diff --check。实际截图 outputs/inline-simulation-v1.68.png 已检查。合成数据验证，未执行生产数据或真实系统缩放验收，未提交发布。


## v1.67 接续验收（2026-10-19）

用户明确取消模拟抽屉并恢复统计/模拟常驻双面板，以下旧 v1.63 抽屉与五 KPI 的要求属于历史基线。
本次实际通过：核心 15 项、simulation-drawer（已改为常驻双面板断言）、distribution-layout、chart-layout、ui-acceptance、app.js 语法与 git diff --check。
覆盖六种视口的并排/上下排列、原始统计精度、模拟输入/恢复/非法值、多规格和缺失规格、图表拖线/最大化、侧栏、全部测试项与更新日志。综合验收为 CSS 视口/DPR 等效合成数据，未执行真实 Windows 缩放及生产文件验收。
截图：outputs/inline-simulation-v1.67.png；综合测量 outputs/ui-acceptance.json 本次已刷新。


日期：2026-10-16；应用 v1.63，未提交或发布。检查第一至第四阶段累计修改；本次仅新增验收脚本、修正旧测试断言和更新文档，未改应用行为或版本。

## 1080P 与响应式

Edge headless，本地 file:// 加载；2 个合成 CSV、12,000 条事件、30 个测试项，覆盖长名称和可滚动侧栏。下表为初始双图模式、每张 Canvas 的 CSS 尺寸，均在首屏内；5 个 KPI 同排无数值截断。

| CSS 视口 | DPR | 单张 Canvas 宽×高 | Canvas 底部 Y | 结果 |
| --- | --- | --- | --- | --- |
| 1920×1080 | 1 | 793×552 | 940 | 通过 |
| 1536×864 | 1.25 | 601×445 | 833 | 通过 |
| 1536×760 | 1.25 | 601×341 | 729 | 通过 |
| 1366×768 | 1 | 516×349 | 737 | 通过 |

- 1536×864 / DPR 1.25 用于模拟 1080P 的 125% 显示比例；1536×760 另覆盖浏览器工具栏占用后的可用高度。未实际切换 Windows 显示缩放；DPR 测试不能代替用户实机验收。
- 检查导入、继续添加、导出、清空、设置、范围和模式按钮在视口内且互不重叠；7 页签均无页面横向溢出，简易/专业模式可用。
- 补测 1280、1024、980、800、780、761、760、600、390px 断点，无横向溢出；窄区按第三阶段规则切单图，图表 Canvas backing 尺寸按 DPR 正确重绘。
- 验证侧栏独立滚轮/折叠保留选中与统计，详细统计展开后主区可独立滚动；抽屉开关保留规格及当前测试项，内容独立滚动。
- 验证文件对比保留两文件和良率画布，点击文件进入对应范围，切回全部恢复统计；导出可完成。
- 综合验收未出现 pageerror、console.error 或 requestfailed。应用资源与本地解压运行文件存在。

## 本次执行的检查

项目为原生静态 HTML/CSS/JavaScript，无 package.json 或独立构建步骤；直接在浏览器执行源文件。未安装依赖或创建虚假的构建产物。

| 检查 | 结果 |
| --- | --- |
| node --check app.js / ft-core.js / sevenzip-loader.js | 全部通过 |
| node --test tests/core-regression.cjs tests/sub-lots.cjs tests/empty-seal.cjs | 15/15 通过 |
| node tests/distribution-layout.cjs | 通过：KPI 精度/Fail 数量比例、侧栏、导入清空、共享导航、模拟与两图拖线 |
| node tests/chart-layout.cjs | 通过：双图/单图、响应式、最大化/Esc、两图拖线、原 Canvas 和统计节点 |
| node tests/simulation-drawer.cjs | 通过：模拟/恢复、非法输入、关闭重开、多规格/缺失限、焦点、滚动与深色主题 |
| node tests/mode-switch.cjs | 通过：744,561 条记录，切换不重新分析或重建统计，导出/窄屏/刷新 |
| node tests/batch-ui.cjs | 通过：批次筛选、加权总量、导出、模式及窄屏 |
| node tests/retest-ui.cjs | 通过：重复/改名 CSV 去重、末轮 RT 空封及导出 |
| node tests/ui-acceptance.cjs | 通过：本页 1080P / DPR / 首屏 / 多文件 / 断点综合检查 |
| git diff --check | 通过 |

复测旧脚本等待 document.body.innerText 中的成功提示，紧凑工作区按既有样式隐藏该提示导致超时。现改为读取 #message.textContent，仍验证文件数和导出；未改变导入/提示功能来迎合旧断言。

ft-core.js 与 sevenzip-loader.js 相对已发布基线无差异；未修改解析、良率、FT/RT 链、空封或模拟算法。既有 Canvas 采样、规格拖线与数据处理维持当前实现。

## 证据与边界

- outputs/ui-acceptance.json：目标视口的几何测量。
- outputs/acceptance-1536x864-dpr1.25.png：125% 等效视口实际截图。
- outputs/acceptance-1366x768-dpr1.png：较小笔记本视口实际截图。
- outputs/acceptance-drawer-1536x864-dpr1.25.png：抽屉实际截图。

第五阶段自动化检查已完成。所有测试均使用合成数据；生产文件、其他浏览器与真实 Windows 缩放仍需用户实机验收，未据此宣称已完成这些检查。
