import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const moduleRoot=process.env.RUNTIME_NODE_MODULES || process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const artifact=moduleRoot ? await import(pathToFileURL(createRequire(path.join(moduleRoot,'__gdut_loader__.cjs')).resolve('@oai/artifact-tool')).href) : await import('@oai/artifact-tool');
const {Presentation,PresentationFile}=artifact;

// GDUT adaptation of the visible TemplateNKU / TemplateMC Beamer grammar.
// Source: https://github.com/GrokCV/TemplateNKU (master, retrieved 2026-11-01).
// Official artwork is embedded unchanged; no school artwork is redrawn.
const HERE=path.dirname(fileURLToPath(import.meta.url));
const OUT=path.resolve(process.argv[2] || 'gdut-template-rebuilt');
const BUILD=path.join(OUT,'.build');
const ROOT=OUT;
if(OUT===HERE) throw new Error('Choose a new output directory; do not overwrite bundled templates.');
const RUNTIME_PYTHON=process.env.PYTHON_EXECUTABLE || 'python';
await fs.mkdir(OUT,{recursive:true});
await fs.mkdir(path.join(BUILD,'renders'),{recursive:true});
await fs.mkdir(path.join(BUILD,'final'),{recursive:true});
const p=Presentation.create({slideSize:{width:1280,height:720}});
const RED='#C30D23', DARK='#A50B1E', LIGHT='#D53B4D', PALE='#FCF0F2', INK='#232323', GRAY='#696969';
const FONT='Microsoft YaHei';
p.theme.defaultFont=FONT;
p.theme.colorScheme={name:'广东工业大学 · 广工红',themeColors:{accent1:RED,accent2:DARK,accent3:'#B36D28',accent4:'#37735C',accent5:'#6D5E78',accent6:'#7B7B7B',bg1:'#FFFFFF',bg2:PALE,tx1:INK,tx2:GRAY,dk1:'#000000',dk2:INK,lt1:'#FFFFFF',lt2:'#F3F3F3',hlink:RED,folHlink:DARK}};
const profile={title:'学术汇报模板',subtitle:'论文阅读 / 课题研究 / 进展汇报',author:'汇报人姓名',department:'学院 / 专业',advisor:'导师姓名',date:'汇报日期'};
try {Object.assign(profile,JSON.parse(await fs.readFile(path.join(OUT,'profile.json'),'utf8')));} catch {}
const master=p.masters.add('广东工业大学 · 广工红');
master.background.fill='#FFFFFF';
function rect(s,name,x,y,w,h,fill,line='none',lw=0,r=0){return s.shapes.add({geometry:r?'roundRect':'rect',name,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:line,width:lw},...(r?{borderRadius:r}:{})});}
function text(s,name,str,x,y,w,h,size=28,color=INK,bold=false,align='left'){
 const sh=rect(s,name,x,y,w,h,'none');sh.text=str;sh.text.style={fontSize:size,typeface:FONT,color,bold,alignment:align,verticalAlignment:'middle',wrap:'square',autoFit:'none',insets:0,lineSpacing:1.18};return sh;
}
function line(s,name,x,y,w,color=RED,lw=2){return rect(s,name,x,y,w,lw,color);}
const logoBytes=await fs.readFile(path.join(HERE,'gdut-horizontal-official.png'));
const emblemBytes=await fs.readFile(path.join(HERE,'gdut-emblem-cropped.png'));
function image(s,bytes,name,x,y,w,h){s.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:'image/png',name,alt:name,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
function logo(s,x=1025,y=24,w=200){image(s,logoBytes,'广东工业大学官方校徽及中英文校名',x,y,w,w*441/1882);}
function titleSlot(l){const sh=l.placeholders.add({type:'title',index:0,text:'页面标题',geometry:'textbox',position:{left:48,top:23,width:945,height:55}});sh.text.style={typeface:FONT,fontSize:32,bold:false,color:INK,verticalAlignment:'middle',insets:0,autoFit:'none'};}
function footer(s,num){
 rect(s,'页脚·作者红段',0,686,384,34,LIGHT);rect(s,'页脚·主题深红段',384,686,768,34,RED);rect(s,'页脚·页码红段',1152,686,128,34,LIGHT);
 text(s,'页脚·汇报人',profile.author,25,687,334,30,14,'#FFFFFF',false,'center');
 text(s,'页脚·汇报题目',profile.title,400,687,735,30,14,'#FFFFFF',false,'center');
 text(s,'页脚·页码',String(num),1152,687,128,30,14,'#FFFFFF',false,'center');
}
function layout(name,mode='content'){
 const l=p.layouts.add(name);l.setParentLayoutId(master.id);
 if(mode==='content'){titleSlot(l);line(l,'版式·标题红线',0,92,1280,RED,2);logo(l);}
 return l;
}
function bodySlot(l,idx,x,y,w,h){const sh=l.placeholders.add({type:'body',index:idx,text:'内容待补充',geometry:'textbox',position:{left:x,top:y,width:w,height:h}});sh.text.style={typeface:FONT,fontSize:28,color:INK,verticalAlignment:'top',insets:0,autoFit:'none'};return sh;}
const layouts={
 cover:layout('01 封面','plain'),toc:layout('02 汇报提纲','plain'),
 body:layout('03 标题与正文'),columns:layout('04 左文右图'),gallery:layout('05 三图对比'),
 table:layout('06 三线表'),equation:layout('07 公式与变量'),algorithm:layout('08 算法伪代码'),
 block:layout('09 文字强调'),summary:layout('10 总结与计划'),qa:layout('11 提问与解答'),thanks:layout('12 致谢','plain')};
bodySlot(layouts.body,1,65,155,1150,440);
bodySlot(layouts.columns,1,65,155,510,430);
bodySlot(layouts.gallery,1,65,574,1150,58);
bodySlot(layouts.summary,1,65,158,1150,450);
for(const [key,l] of Object.entries(layouts)) if(!['cover','toc','thanks'].includes(key)) footer(l,'#');
function placeholderText(l,type,index,str,x,y,w,h,size,color,bold=false,align='center'){
 const sh=l.placeholders.add({type,index,text:str,geometry:'textbox',position:{left:x,top:y,width:w,height:h}});
 sh.text.style={typeface:FONT,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',insets:0};return sh;
}
placeholderText(layouts.cover,'title',0,profile.title,90,250,1100,100,52,'#FFFFFF',true);
placeholderText(layouts.cover,'subtitle',1,profile.subtitle,145,359,990,44,24,'#FFFFFF');
placeholderText(layouts.cover,'body',2,profile.author,475,545,330,54,29,INK);
placeholderText(layouts.cover,'body',3,`${profile.department}    导师：${profile.advisor}`,245,624,790,36,21,GRAY);
placeholderText(layouts.cover,'body',4,profile.date,440,665,400,27,18,GRAY);
placeholderText(layouts.thanks,'title',0,'致 谢',200,255,880,120,72,RED,true);
placeholderText(layouts.thanks,'subtitle',1,'感谢聆听，欢迎交流',200,405,880,55,29,RED);
placeholderText(layouts.thanks,'body',2,profile.author,240,545,800,40,23,RED);
image(layouts.cover,logoBytes,'广东工业大学官方横式标识',432,33,416,97.5);
line(layouts.cover,'封面·上红线',0,170,1280,RED,1.5);rect(layouts.cover,'封面·中央红色横幅',0,184,1280,282,RED);line(layouts.cover,'封面·下红线',0,478,1280,RED,1.5);
rect(layouts.cover,'封面·姓名胶囊',455,540,370,64,'none',RED,1.3,32);
layouts.thanks.background.fill='#FFFFFF';
const sourceNotes='视觉来源：GrokCV/TemplateNKU，https://github.com/GrokCV/TemplateNKU ，master，2026-11-01。继承16:9、中央横幅封面、红白目录、标题细线及分段页脚。校徽/校名：广东工业大学官方图库 https://photo.gdut.edu.cn/info/1324/1992.htm 。广工红印刷基准CMYK15/100/90/10；屏幕#C30D23取自官方矢量/PNG素材。此文件是个人定制模板，非学校官方发布模板。';
function slide(key,title){const s=p.slides.add();s.setLayout(layouts[key]);s.background.fill='#FFFFFF';s.speakerNotes.text=sourceNotes;s.placeholders.addFromLayout();if(title){s.placeholders.getItem('title').text=title;}return s;}
function fillBody(s,idx,str){const targets=s.placeholders.items.filter(v=>v.placeholder?.type==='body');const target=targets.find(v=>v.placeholder?.index===idx)||targets[idx-1]||s.placeholders.getItem('body');target.text=str;target.text.style={typeface:FONT,fontSize:28,color:INK,autoFit:'none',insets:0,verticalAlignment:'top',lineSpacing:1.3};return target;}
function bullet(s,label,desc,y,x=72,w=1110){text(s,'正文·项目符号','•',x,y,24,44,28,RED);text(s,'正文·'+label,label,x+36,y,w-36,44,28,INK,true);if(desc)text(s,'说明·'+label,desc,x+36,y+48,w-36,52,23,GRAY);}
function placeholder(s,name,x,y,w,h,caption){rect(s,name+'·占位框',x,y,w,h,'#F8F8F8','#B9B9B9',1);text(s,name+'·提示','插入图片',x+18,y+15,w-36,h-30,28,'#919191',false,'center');if(caption)text(s,name+'·图注',caption,x,y+h+14,w,42,21,GRAY,false,'center');}

// 01: the wide red banner follows the reference cover.
{
 const s=slide('cover');
 const values=[profile.title,profile.subtitle,profile.author,`${profile.department}    导师：${profile.advisor}`,profile.date];
 for(const sh of s.placeholders.items){sh.text=values[sh.placeholder.index];sh.bringToFront();}
}
// 02: source-aligned red rail and active/inactive TOC bands.
{
 const s=slide('toc');rect(s,'目录·红色边栏',0,0,280,720,RED);rect(s,'目录·白色面板',128,110,1100,500,'#FFFFFF','none',0,24);
 text(s,'目录·汇报提纲','汇 报\n提 纲',184,239,245,170,45,RED,true,'center');line(s,'目录·短线',258,430,94,RED,3);text(s,'目录·英文','CONTENTS',181,454,250,32,19,RED,true,'center');
 const items=['研究背景与问题','研究方法与设计','实验结果与讨论','总结与后续计划'];
 items.forEach((t,i)=>{rect(s,'目录·条目'+i,512,153+i*112,650,82,i===0?RED:'#EFEFEF');text(s,'目录·文字'+i,t,538,159+i*112,598,69,29,i===0?'#FFFFFF':'#666666',i===0,'center');});
 logo(s,1010,28,220);
}
{
 const s=slide('body','研究背景与问题');
 fillBody(s,1,'研究背景\n用一至两句话说明研究场景及其实际需求。\n\n核心问题\n说明现有方法的具体局限，明确本次汇报要解决的问题。\n\n研究目标\n写明研究对象、评价依据及预期达到的目标。');
}
{
 const s=slide('columns','方法设计与核心思路');
 fillBody(s,1,'核心机制\n说明方法的关键模块与输入输出。\n\n设计依据\n解释该模块如何针对已有问题。\n\n适用条件\n补充假设、边界条件与限制。');
 placeholder(s,'方法图',640,158,560,366,'图 1  方法框架或系统结构');
 text(s,'方法·证据来源','来源：填写论文、图号或自绘说明',640,598,560,35,17,GRAY,false,'center');
}
{
 const s=slide('gallery','可视化结果对比');
 [80,480,880].forEach((x,i)=>placeholder(s,'对比图'+i,x,186,320,280,['输入图像','对照方法','本方法'][i]));
 fillBody(s,1,'观察：填写由对比图直接支持的结论，并说明比较条件。');
 text(s,'对比·来源','来源：填写数据集、样本编号及图像来源',80,632,1120,30,17,GRAY);
}
{
 const s=slide('table','实验设置与结果表');
 text(s,'表格·说明','填写数据集、实验条件、指标定义与单位。',72,137,1120,45,25,INK);
 const table=s.tables.add({rows:5,columns:4,left:96,top:229,width:1088,height:300,columnWidths:[380,236,236,236],values:[['方法 / 设置','指标一 ↑','指标二 ↓','备注'],['对照方法 A','待填','待填','填写条件'],['对照方法 B','待填','待填','填写条件'],['本方法','待填','待填','填写条件'],['消融设置','待填','待填','填写条件']]});
 table.borders.assign({fill:'#FFFFFF',width:0});
 table.cells.block({row:0,column:0,rowCount:5,columnCount:4}).assign({fill:'#FFFFFF',textStyle:{typeface:FONT,fontSize:25,color:INK},margins:{top:8,bottom:8,left:18,right:12},anchor:'center'});
 table.cells.block({row:0,column:0,rowCount:1,columnCount:4}).assign({fill:'#FFFFFF',textStyle:{typeface:FONT,fontSize:25,bold:true,color:RED}});
 line(s,'表格·顶线',96,226,1088,INK,2.5);line(s,'表格·表头线',96,288,1088,INK,1.2);line(s,'表格·底线',96,530,1088,INK,2.5);
 text(s,'表格·表注','注：箭头表示指标优化方向。实际数值及有效位数由实验记录填写。',96,562,1088,56,20,GRAY);
}
{
 const s=slide('equation','公式与变量说明');
 text(s,'公式·引导','在此说明公式的作用及其对应的研究问题。',72,135,1125,50,26,INK);
 rect(s,'公式·浅红背景',170,238,940,126,PALE,RED,0.8,20);
 text(s,'公式·可编辑文本','L = L₁ + λ L₂',215,260,850,82,44,RED,false,'center');
 text(s,'公式·变量解释','L：总目标函数\nL₁：主要任务项\nL₂：约束项或辅助任务项\nλ：权重系数',200,405,900,178,27,INK);
 text(s,'公式·来源','公式来源：填写论文公式编号或推导依据',72,629,1120,29,17,GRAY);
 s.speakerNotes.text+='\n公式当前为原生可编辑Unicode文本，便于模板替换。复杂公式建议在PowerPoint中使用插入→公式并录入LaTeX，避免截图。';
}
{
 const s=slide('algorithm','算法伪代码');
 line(s,'算法·顶线',72,148,1136,INK,2);text(s,'算法·名称','算法名称：填写算法或处理流程',86,165,1100,45,26,INK,true);line(s,'算法·标题分隔',72,220,1136,INK,1);
 const rows=['输入：数据、参数与必要条件','输出：目标结果','1  初始化参数与中间状态','2  对每个输入样本执行以下步骤','    2.1  执行预处理或特征计算','    2.2  更新中间状态并记录结果','3  返回输出，并检查终止条件'];
 rows.forEach((t,i)=>text(s,'算法·行'+i,t,92,242+i*46,1095,42,25,INK));line(s,'算法·底线',72,584,1136,INK,2);
}
{
 const s=slide('block','关键概念与注意事项');
 [['概念定义','填写关键术语及其准确含义。',RED,PALE],['结论说明','填写由当前证据支持的结论及适用范围。','#37735C','#EFF6F2'],['注意事项','填写关键限制、可能偏差或待验证的问题。','#A56324','#FBF4EC']].forEach(([t,b,c,bg],i)=>{
 const y=148+i*158;rect(s,'强调·内容背景'+i,72,y,1136,126,bg,'none',0,10);rect(s,'强调·标题栏'+i,72,y,1136,43,c);text(s,'强调·标题'+i,t,90,y+3,1098,36,25,'#FFFFFF',true);text(s,'强调·内容'+i,b,90,y+52,1098,54,25,INK);
 });
}
{
 const s=slide('summary','总结与后续计划');
 fillBody(s,1,'本次进展\n概括已经完成的工作，并对应到可核验的证据。\n\n主要结论与局限\n填写结论，说明当前证据尚未覆盖的部分。\n\n下一步安排\n写明下一项工作、所需资源与预计完成时间。');
}
{
 const s=slide('qa','提问与解答');text(s,'问答·英文','Q&A',280,220,720,130,80,RED,true,'center');text(s,'问答·提示','欢迎提问与讨论',280,385,720,65,35,INK,false,'center');
}
{
 const s=slide('thanks');s.background.fill='#FFFFFF';
 const values=['致 谢','感谢聆听，欢迎交流',profile.author];for(const sh of s.placeholders.items)sh.text=values[sh.placeholder.index];
}

const inspect=await p.inspect({kind:'slide,table,layout',maxChars:40000});await fs.writeFile(path.join(BUILD,'inspect.ndjson'),inspect.ndjson);
for(let i=0;i<p.slides.items.length;i++){
 const s=p.slides.items[i];const stem='slide-'+String(i+1).padStart(2,'0');
 await fs.writeFile(path.join(BUILD,'renders',stem+'.png'),new Uint8Array(await (await p.export({slide:s,format:'png',scale:1})).arrayBuffer()));
 await fs.writeFile(path.join(BUILD,'renders',stem+'.layout.json'),await (await s.export({format:'layout'})).text());
}
await (await PresentationFile.exportPptx(p)).save(path.join(BUILD,'candidate.pptx'));
execFileSync(RUNTIME_PYTHON,[path.join(HERE,'package_template.py'),path.join(BUILD,'candidate.pptx'),path.join(BUILD,'candidate-clean.pptx')],{stdio:'inherit'});
await fs.writeFile(path.join(BUILD,'deck.json'),JSON.stringify(p.toProto ? p.toProto():{},null,2)).catch(()=>{});
execFileSync(RUNTIME_PYTHON,[path.join(HERE,'package_template.py'),path.join(BUILD,'candidate-clean.pptx'),path.join(OUT,'GDUT-Template.pptx'),'--potx',path.join(OUT,'GDUT-Template.potx')],{stdio:'inherit'});
console.log('Generated editable templates in '+OUT+'. Review renders and run the presentation package validator before delivery.');
