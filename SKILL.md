---
name: gdut-presentation-skill
description: 制作或更新广东工业大学个人学术汇报，复用广工红和官方校徽、TemplateNKU 风格版式，支持可编辑 PowerPoint、POTX 模板和 LaTeX Beamer。用于广工组会、论文汇报、开题和答辩；不用于其他学校品牌。
---

# 广东工业大学个人汇报模板

以本 skill 目录为资源根目录，所有路径相对此目录解析。模板沿用 TemplateNKU 的横幅封面、红白目录、细线标题和分段页脚，已经替换为广工身份；致谢页使用白底、广工红文字。

## 选择输出

- PowerPoint：复制 `assets/powerpoint/GDUT-Template.pptx` 后编辑原生对象。需要在 PowerPoint 中“新建”使用时，提供同目录 `.potx`。默认采用此格式。
- LaTeX：复制 `assets/beamer/`，填写 `profile.tex`，编辑 `main.tex` 或从 `starter.tex` 开始。交付完整源码和编译后的 PDF。
- 用户要两种时分别交付。两种格式独立编辑，不声称它们会自动同步或 PDF 可以无损转成可编辑 PPTX。

可用初始化脚本完成复制和个人字段替换，目标必须为新目录：

```text
python scripts/init_deck.py --output <新目录> --format both --title <标题> --name <汇报人> --college <学院或专业> --supervisor <导师> --date <日期>
```

字段未知时保留显式占位文字，不猜姓名、学院、导师或研究结论。未来汇报的页数、内容顺序和版式按材料调整，样例页不要求全部使用。

## 品牌与编辑规则

读 [design.md](references/design.md) 了解精确色板、版式和两种格式的编辑入口；核对或替换品牌资产时读 [sources.md](references/sources.md)。

- 屏幕主色 `#C30D23` 来自广工官方资产实色。印刷基准为 CMYK 15/100/90/10，两者不称为唯一数学换算关系。
- 校徽和书法校名直接使用随包官方素材，保持比例，不重画或替换成普通字体。深红背景使用白色底托上的原校徽。
- PowerPoint 的标题、正文、公式文字、表格和边框应保留可编辑对象。图片占位区域填入真实图表，保留来源，不把整页渲染图作为可编辑模板。
- 复制或修改已有用户报告时另存新版，保留源文件。模板中的待填写文本不构成科研证据；实际报告中移除无用示例页。

## 编译和检查

```text
python scripts/build_beamer.py <报告目录>/main.tex --render
```

脚本使用 XeLaTeX、禁用 shell escape，运行两回合，输出到报告目录的 `build/`。`--render` 需要 PyMuPDF。用户以 `starter.tex` 为入口时显式传入该文件。缺少编译器或字体时说明具体缺口，保留源码，不静默改成图片幻灯片。

完成后检查每页：标题和页脚、校徽比例、长中文断行、公式和表格边界、个人信息替换、缺字。PPTX 修改后用可用的演示文稿工具渲染检查，确认母版和版式仍可选、表格仍可编辑。PDF 编译成功不能替代视觉检查。交付最终文件及影响使用的限制。

本 skill 不授予 GitHub 上传或其他外部发布权限；只在当前用户明确要求时发布。
