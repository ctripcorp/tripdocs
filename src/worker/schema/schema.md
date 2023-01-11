# Valid Tripdocs-sdk data schema

## Element
Slate.js 本身并不限定元素的形状，[并且能够使用`normalizeNode`对结构进行修正](https://docs.slatejs.org/general/changelog#breaking-7)。我们需要自己保证所有的 Slate 节点元素结构是正确的，否则会容易出错。

我们通过在 `validation.worker.js` 中对 Slate 的 `value` 对象进行全量递归校验，对不满足的结构返回 `invalidNode` 的响应，并且全局使用 `Editor.normalize(editor, {force: true})` 对页面结构进行强制重刷。这样就能够保证即使使用了 `defaultValue` 直接渲染的数据，也能够被自动修复。

我们的自定义元素通常可分为
### Text elements
通常情况下比较稳定，用于包裹文本内容。
子节点：内联元素以及文本。

### Block elements
块级元素，用于区块划分、功能组件。
子节点：通常**不包含**内联元素和文本。

### Inline elements
内联元素，用于行内组件。
需配置插件：isInline
子节点：通常只有一个，且多为空文本节点（除了 link）。

### Empty children element （ECE）
子节点为空文本节点的


```js
const ELTYPE = {
  // text element
  // ALERTMESSAGE: 'alertmessage',
  // ALERTDESCRIPTION: 'alertdescription',
  BLOCK_QUOTE: 'block-quote',
  HEADING_SIX: 'heading-six',
  HEADING_FIVE: 'heading-five',
  HEADING_FOUR: 'heading-four',
  HEADING_THREE: 'heading-three',
  HEADING_TWO: 'heading-two',
  HEADING_ONE: 'heading-one',
  OLLIST: 'numbered-list',
  PARAGRAPH: 'paragraph',
  TODO_LIST: 'todo-list',
  ULLIST: 'bulleted-list',


  // block element
  ALERTS: 'alerts',
  CODE_BLOCK: 'code-block', // （ECE）
  IMAGE: 'image', // （ECE）
  FILE: 'file', // （ECE）
  VIDEO: 'video', // （ECE）
  TABLE: 'table',
  TABLE_ROW: 'table-row',
  TABLE_CELL: 'table-cell',
  DIVIDE: 'hr', // （ECE）
  CARD: 'card',
  CARD_PRE: 'card-pre', 
  CARD_SUF: 'card-suf',
  EXCALIDRAW: 'excalidraw', // （ECE）

  // inline element
  INLINEIMAGE: 'inline-image', // （ECE）
  MENTION: 'mention', // （ECE）
  LINK: 'edit-link',
};
```