# FT-REPORT 开发交接

更新日期：2026-10-21。当前 v1.87，资源 1.87.0；完整现状见 PROJECT_STATUS.md，发布介绍见根目录 README.md 和 CHANGELOG.md。

## 当前接续重点

用户已授权将本轮 v1.57–v1.87 累计更新提交 GitHub，并更新仓库介绍、发布说明及离线下载包。后续从发布后的 main/v1.87 继续，不恢复旧五 KPI、模拟抽屉或图表最大化按钮。

保留默认趋势、常驻双面板、两大格加四小格、正负数量分行、共享行高、滚动稳定、紧凑工具栏、蓝字浅底导出及页面 Fail 明细。导出报告不含逐条 Fail 明细。

## 代码定位

| 需求 | 定位 |
| --- | --- |
| 全部测试项 | app.js：distributionTestNames、updateDistributionTestSelect、setDistributionPickerOpen |
| 总览八卡 | renderSummary；空封文字只在 LX1630H/IDD 条件下作为备注 |
| 统计与模拟 | renderSelectedDistribution、renderLimitSimulator、renderYieldSimulation、Core.simulateLimitYield |
| 拖线 | bindLimitDragging、scheduleLimitChartRender、distributionRange |
| 布局与滚动 | fitDistributionPanels、updateDistributionChartLayout、scheduleDistributionChartLayout |
| 按钮 | styles.css 末尾共享控件规则及 --toolbar-control-height |
| 导出 | exportAnalysis、appendBatchExport；逐条 Fail 导出段已删除 |
| 版本 | app.js RELEASE_NOTES；index.html 页脚及 CSS/app 参数 |

## 验证命令

```powershell
node --check app.js
node --check ft-core.js
node --check sevenzip-loader.js
node --test tests/core-regression.cjs tests/sub-lots.cjs tests/empty-seal.cjs
# FT_PLAYWRIGHT 指向外部 Playwright 包目录
node tests/distribution-layout.cjs
node tests/simulation-drawer.cjs
node tests/chart-layout.cjs
node tests/limit-drag.cjs
node tests/ui-acceptance.cjs
node tests/mode-switch.cjs
node tests/batch-ui.cjs
node tests/retest-ui.cjs
git diff --check
```

完整分辨率矩阵：设置 FT_RESOLUTION_MATRIX=1 后执行 ui-acceptance.cjs，结束后清除该变量以恢复默认矩阵。

- simulation-drawer 文件名保留，实际验证常驻双面板，不能据名恢复抽屉。
- 部分测试输出保留旧阶段词，实际断言才是覆盖依据。
- ui-acceptance 会实际下载报告，验证保留汇总/参数稳定性、不含逐条 Fail 明细；页面明细筛选继续验证。
- limit-drag 的 15 万条/80 事件合并为一次模拟不代表实机 FPS。
- outputs/、tmp/ 被 Git 忽略；仅合成证据可单独迁移，不上传生产数据。

最新实际结果和版本时效见 UI_ACCEPTANCE.md；分辨率测试范围见 RESOLUTION_ACCEPTANCE.md。旧交接、阶段状态与 README 保留在 history/，仅用于追溯。
