# 源码修改记录

记录修改源码 package 的主要内容，以便以后升级版本使用。

> 修改源码时，都加上注释标记： // TRIPDOCS CHANGES: ...

## components\slate-packages\slate-react\components\editable.tsx

- line 69: 增加editorState给RenderElementProps，用于存储editor的状态，比如宽高 
- line 94: 增加editorState相关属性 
- line 121: 增加editorState相关属性 
- line 137: 增加refs属性，可以获取editor的ref
- line 205: 删除了内联的选项 block: 'nearest'，使其变得自动跟随父组件滚动
- line 457: 将事件直接绑定到 DOM -> ReactEditor.toDOMNode(editor, editor) 上面
- line 1036:  接收editorState相关属性 

## components\slate-packages\slate-react\components\string.tsx

- line 62: fix ime input on decroation node error #3205 https://github.com/ianstormtaylor/slate/pull/3205/files

## components/slate-packages/slate-react/components/children.tsx

- line 23: 增加editorState给RenderElementProps，用于存储editor的状态，比如宽高
- line 32: 增加editorState给RenderElementProps，用于存储editor的状态，比如宽高
- line 69: 增加editorState给RenderElementProps，用于存储editor的状态，比如宽高

## components/slate-packages/slate-react/components/element.tsx
- line 30: 接收editorState
- line 40: 接收editorState
- line 56: 接收editorState
- line 132: 接收editorState

## components\slate-packages\slate-react\plugin\react-editor.ts
- line 398: 将凡是要选中到 div#editorarea 节点的，默认返回一个默认指定值 {path: [0], offset: 0}

## components\slate-packages\slate-history\with-history.ts
- line 18: 在撤销栈中对 setNodes 过滤
- line 46: 在撤销栈中对 setNodes 过滤

## components\slate-packages\slate-react\plugin\with-react.ts
- line 73: 复制 H 标签一部分文本时，保持 H 标签的样式，而不是只复制 SPAN 中文本
- line 125: 复制 H 标签一部分文本时，保持 H 标签的样式，而不是只复制 SPAN 中文本

## components\slate-packages\slate-react\components\editable.tsx
- line 628 [onClick] : TRIPDOC CHANGES: 增加对相应 data-ignore-slate 组件的过滤，防止报错