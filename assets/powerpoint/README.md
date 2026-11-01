# PowerPoint 模板

`GDUT-Template.potx` 是 PowerPoint 模板，`GDUT-Template.pptx` 是含 12 页布局示例的可编辑演示文稿。包含 1 个广工母版、12 个命名版式、原生标题/正文占位符、原生表格、可编辑公式文本与标准自动页码字段。

直接双击 POTX 新建演示文稿，或复制 PPTX 后修改。通过“开始 → 新建幻灯片 / 版式”选择布局，通过“视图 → 幻灯片母版”统一改页眉与页脚。图片占位矩形是原生形状，删除后插入自己的图片；校徽为嵌入图片，保留原比例。公式当前为 Unicode 可编辑文本，可用 PowerPoint 的“插入 → 公式”替换成复杂公式。字体为 Microsoft YaHei，未嵌入商业字体文件。

## 高级重建

普通使用不需要 Node 或 Artifact Tool。`build_template.mjs` 保留重建源码，需可用的 Node.js、`@oai/artifact-tool`、Python 3 与 Pillow（PNG 渲染依赖由 Artifact Tool runtime 提供）。在 Codex 中先调用 `load_workspace_dependencies`，将工具返回的包目录设为 `RUNTIME_NODE_MODULES`，Python 路径设为 `PYTHON_EXECUTABLE`，运行：

```text
node build_template.mjs <新的输出目录>
```

可先在新输出目录放置 `profile.json` 覆盖元信息。源脚本会生成 PPTX、POTX 与逐页渲染文件。重建后需按 Presentations skill 的 finalization 工作流做结构验证，并检查每一页。此处不包含或自动下载 Artifact Tool，也不假设任何用户目录。

## 来源

视觉布局基于 [GrokCV/TemplateNKU](https://github.com/GrokCV/TemplateNKU) 的 Beamer 模板，重新构建为 PowerPoint 原生对象，不能声称保留了原始 PPTX 结构（上游没有 PPTX）。[广东工业大学官方图库](https://photo.gdut.edu.cn/info/1324/1992.htm) 提供校徽与横式校名。屏幕主色 `#C30D23` 与官方素材一致，印刷基准 CMYK 15/100/90/10。此为个人定制模板，非学校官方发布模板。
