<div align="center">

<h1 style="border-bottom: none">
     <img width="350" src="tripdocslogo.png" alt="logo" /><br />
   现代在线协同文档编辑器应用框架
    <br>
</h1>

</div>


## TripDocsSDK | [English Version](readme_en.md)

<!-- MarkdownTOC -->

- [介绍](#介绍)
- [功能特色](#功能特色)
- [截图](#截图)
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [插件支持情况](#插件支持情况)
- [感谢](#感谢)
- [协议](#协议)

<!-- /MarkdownTOC -->

## 介绍

+ TripDocsSDK是基于携程内部在线文档编辑器内核，提炼的一款通用的，现代的、稳定的、支持协同的、可用于生产环境的在线文档编辑器。

+ 目前已在携程内部TripDocs系统、Trippal简报系统集成，iDev系统正在接入中。其中在TripDocs系统中，已运行1年以上，沉淀文档2000+。

+ TripDocsSDK依赖slatejs、yjs、reactjs。并在slatejs基础上，进行了二次的开发，包括丰富的组件和大量的纠错机制，使得编辑器更加稳定可靠。

## 功能特色

- 开箱即用：支持NPM包引入和CDN引入。

- 大量基础插件：提供大量常规插件，按需选择，即插即用，无需额外的开发成本。

- 稳定性：针对崩溃做了很多的处理。

- 其它特色功能：支持Markdown编辑和word解析。

## 截图
![截图](/tripdocs.png)

## 开发环境

```bash
# Install
npm install

# start up
npm run dev

# run 

# 启动会监听3001、5385两个端口

# 访问

http://127.0.0.1:3001/
```

## 生产环境

```bash
# 构建npm包
npm run buildPC 

or

# 构建cdn包
npm run buildNpm 
```


## 插件支持情况


- [x] 撤销/恢复
- [x] 字号
- [x] 字间距
- [x] 字体颜色
- [x] 加粗
- [x] 斜体
- [x] 下划线
- [x] 删除线
- [x] 清除样式
- [x] 增加缩进
- [x] 减少缩进
- [x] 左对齐
- [x] 居中对齐
- [x] 右对齐
- [x] 两端对齐
- [x] 标题样式
- [x] 无序列表
- [x] 有序列表
- [x] 引用
- [x] 代码
- [x] 链接
- [x] 表格
- [x] 水平线
- [x] 清除内容
- [x] 格式刷
- [x] 待办
- [x] 顶部栏
- [x] 悬浮菜单
- [x] 表格悬浮菜单
- [x] 表格右键菜单
- [x] word文件解析
- [x] markdown解析
- [x] markdown编辑
- [x] TOC
- [x] 快捷键
- [ ] 上标
- [ ] 下标
- [ ] 媒体-图片
- [ ] 媒体-视频
- [ ] 媒体-音频
- [ ] 媒体-媒体库
- [ ] emoji

## 感谢

感谢以下开源产品的支持

- [Yjs](https://github.com/yjs/yjs) & [Yrs](https://github.com/y-crdt/y-crdt) -- Fundamental support of CRDTs for our implementation on state management and data sync.
- [React](https://github.com/facebook/react) -- View layer support and web GUI framework.
- [slatejs](https://github.com/ianstormtaylor/slate) -- Customizable rich-text editor.
- [antd](https://ant.design/) -- Help designers/developers building beautiful products more flexible and working with happiness
- [@emotion](https://emotion.sh/docs/introduction) -- Emotion is a library designed for writing css styles with JavaScript.
- [@codemirror](https://codemirror.net/) -- CodeMirror is a code editor component for the web.
- [html2pdf](https://github.com/eKoopmans/html2pdf.js) -- html2pdf.js converts any webpage or element into a printable PDF entirely client-side using html2canvas and jsPDF.
- [prismjs](https://github.com/PrismJS/prism) -- Lightweight, robust, elegant syntax highlighting.

## 协议

本项目采用 [MIT](./License.md) 协议
