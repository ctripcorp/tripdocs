import { Editor, Node, Path, Point, Range, Transforms } from "@src/components/slate-packages/slate"
import { NodeEntry } from '../../slate/interfaces/node'
import {
  DOMElement,
  DOMNode,
  DOMPoint,
  DOMRange,
  DOMSelection,
  DOMStaticRange,
  hasShadowRoot,
  isDOMElement,
  isDOMSelection,
  normalizeDOMPoint
} from '../utils/dom'
import { Key } from '../utils/key'
import {
  EDITOR_TO_ELEMENT,
  EDITOR_TO_KEY_TO_ELEMENT,
  ELEMENT_TO_NODE,
  IS_FOCUSED,
  IS_READ_ONLY,
  NODE_TO_INDEX,
  NODE_TO_KEY,
  NODE_TO_PARENT
} from '../utils/weak-maps'
import { IS_CHROME, IS_FIREFOX } from '../utils/environment'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'
import { getStart } from "@src/utils/selectionUtils"



export interface ReactEditor extends Editor {
  insertData: (data: DataTransfer) => void
  insertFragmentData: (data: DataTransfer) => boolean
  setFragmentData: (data: DataTransfer) => void
  insertTextData: (data: DataTransfer) => boolean
  hasRange: (editor: ReactEditor, range: Range) => boolean
}

export const ReactEditor = {
  

  findKey(editor: ReactEditor, node: Node): Key {
    let key = NODE_TO_KEY.get(node)

    if (!key) {
      key = new Key()
      NODE_TO_KEY.set(node, key)
    }

    return key
  },

  

  findPath(editor: ReactEditor, node: Node): Path {
    const path: Path = []
    let child = node

    while (true) {
      const parent = NODE_TO_PARENT.get(child)

      if (parent == null) {
        if (Editor.isEditor(child)) {
          return path
        } else {
          break
        }
      }

      const i = NODE_TO_INDEX.get(child)

      if (i == null) {
        break
      }

      path.unshift(i)
      child = parent
    }

    handleSlateError( 
      `Unable to find the path for Slate node: ${JSON.stringify(node)}`, editor
    )
    return
  },

  

  isFocused(editor: ReactEditor): boolean {
    return !!IS_FOCUSED.get(editor)
  },

  

  isReadOnly(editor: ReactEditor): boolean {
    return !!IS_READ_ONLY.get(editor)
  },

  

  blur(editor: ReactEditor): void {
    const el = ReactEditor.toDOMNode(editor, editor)
    IS_FOCUSED.set(editor, false)

    if (window.document.activeElement === el) {
      el.blur()
    }
  },

  

  focus(editor: ReactEditor): void {
    const el = ReactEditor.toDOMNode(editor, editor)
    IS_FOCUSED.set(editor, true)
    console.log("FOCUSING",)
    
    if (window.document.activeElement !== el) {
      el.focus({ preventScroll: true })
    }
  },

  

  deselect(editor: ReactEditor): void {
    const { selection } = editor
    const domSelection = window.getSelection()

    if (domSelection && domSelection.rangeCount > 0) {
      domSelection.removeAllRanges()
    }

    if (selection) {
      Transforms.deselect(editor)
    }
  },

  

  hasDOMNode(
    editor: ReactEditor,
    target: DOMNode,
    options: { editable?: boolean } = {}
  ): boolean {
    const { editable = false } = options
    const editorEl = ReactEditor.toDOMNode(editor, editor)
    let targetEl

    
    
    
    
    try {
      targetEl = (isDOMElement(target)
        ? target
        : target.parentElement) as HTMLElement
    } catch (err) {
      if (
        !err.message.includes('Permission denied to access property "nodeType"')
      ) {
        throw err
      }
    }

    if (!targetEl) {
      return false
    }

    return (
      targetEl.closest(`[data-slate-editor]`) === editorEl &&
      (!editable ||
        targetEl.isContentEditable ||
        !!targetEl.getAttribute('data-slate-zero-width'))
    )
  },

  

  insertData(editor: ReactEditor, data: DataTransfer): void {
    editor.insertData(data)
  },

  

  setFragmentData(editor: ReactEditor, data: DataTransfer): void {
    editor.setFragmentData(data)
  },

  

  toDOMNode(editor: ReactEditor, node: Node): HTMLElement {
    const KEY_TO_ELEMENT = EDITOR_TO_KEY_TO_ELEMENT.get(editor)
    const domNode = Editor.isEditor(node)
      ? EDITOR_TO_ELEMENT.get(editor)
      : KEY_TO_ELEMENT?.get(ReactEditor.findKey(editor, node))
      
    if (!domNode) {
      handleSlateError( 
        `Cannot resolve a DOM node from Slate node: ${JSON.stringify(node)}; KEY_TO_ELEMENT: ${KEY_TO_ELEMENT}, key: ${ReactEditor.findKey(editor, node)}`, editor
      )
      return
    }

    return domNode
  },

  

  toDOMPoint(editor: ReactEditor, point: Point): DOMPoint {
    const [node] = Editor.node(editor, point.path)
    const el = ReactEditor.toDOMNode(editor, node)

    
    if (!point || !node || !el) {
      console.log("[toDOMPoint] !el:", point, node, el)
      return
    }

    let domPoint: DOMPoint | undefined

    
    
    if (Editor.void(editor, { at: point })) {
      point = { path: point.path, offset: 0 }
    }

    
    
    
    const selector = `[data-slate-string], [data-slate-zero-width]`
    const texts = Array.from(el.querySelectorAll(selector))
    let start = 0

    for (const text of texts) {
      const domNode = text.childNodes[0] as HTMLElement

      if (domNode == null || domNode.textContent == null) {
        continue
      }

      const { length } = domNode.textContent
      const attr = text.getAttribute('data-slate-length')
      const trueLength = attr == null ? length : parseInt(attr, 10)
      const end = start + trueLength

      if (point.offset <= end) {
        const offset = Math.min(length, Math.max(0, point.offset - start))
        domPoint = [domNode, offset]
        break
      }

      start = end
    }

    if (!domPoint) {
      console.error("[toDOMPoint] !domPoint:", point && JSON.stringify(point), node, el)
      return null
      handleSlateError( 
        `Cannot resolve a DOM point from Slate point: ${JSON.stringify(point)}`, editor
      )
      return null
    }

    return domPoint
  },

  

  toDOMRange(editor: ReactEditor, range: Range): DOMRange {
    const { anchor, focus } = range
    const isBackward = Range.isBackward(range)
    const domAnchor = ReactEditor.toDOMPoint(editor, anchor)
    const domFocus = Range.isCollapsed(range)
      ? domAnchor
      : ReactEditor.toDOMPoint(editor, focus)

    const domRange = window.document.createRange()
    const startEntry = isBackward ? domFocus : domAnchor
    const endEntry = isBackward ? domAnchor : domFocus

    if(!startEntry || !endEntry) { 
      return null
    }
    const [startNode, startOffset] = startEntry;
    const [endNode, endOffset] = endEntry;
    
    
    
    const startEl = (isDOMElement(startNode)
      ? startNode
      : startNode.parentElement) as HTMLElement
    const isStartAtZeroWidth = !!startEl.getAttribute('data-slate-zero-width')
    const endEl = (isDOMElement(endNode)
      ? endNode
      : endNode.parentElement) as HTMLElement
    const isEndAtZeroWidth = !!endEl.getAttribute('data-slate-zero-width')

    domRange.setStart(startNode, isStartAtZeroWidth ? 1 : startOffset)
    domRange.setEnd(endNode, isEndAtZeroWidth ? 1 : endOffset)
    return domRange
  },

  

  toSlateNode(editor: ReactEditor, domNode: DOMNode): Node {
    if(!domNode || (domNode as any)?.hasAttribute?.("data-ignore-slate")) { 
      

      return


      
      
      
      
      
    }
    
    let domEl = isDOMElement(domNode) ? domNode : domNode.parentElement

    if (domEl && !domEl.hasAttribute('data-slate-node')) {
      domEl = domEl.closest(`[data-slate-node]`)
    }

    
    if(isDOMElement(domNode) && ['card-table-wrap', 'table-wrap', 'table-inner-wrap', 'table-element'].some((cls) => Array.from(domNode.classList).includes(cls))) {
      domEl = domEl.getElementsByTagName('tbody')[0];
      
    }

    

    const node = domEl ? ELEMENT_TO_NODE.get(domEl as HTMLElement) : null

    if (!node) {
      handleSlateError( `Cannot resolve a Slate node from DOM node: ${domEl}`, editor)
      return
    }

    return node
  },

  

  findEventRange(editor: ReactEditor, event: any): Range {
    if ('nativeEvent' in event) {
      event = event.nativeEvent
    }

    const { clientX: x, clientY: y, target } = event

    if (x == null || y == null) {
      handleSlateError( `Cannot resolve a Slate range from a DOM event: ${event}`, editor)
      return
    }

    const node = ReactEditor.toSlateNode(editor, event.target)
    if(!node) return; 
    const path = ReactEditor.findPath(editor, node)

    
    
    
    if (Editor.isVoid(editor, node)) {
      const rect = target.getBoundingClientRect()
      const isPrev = editor.isInline(node)
        ? x - rect.left < rect.left + rect.width - x
        : y - rect.top < rect.top + rect.height - y

      const edge = Editor.point(editor, path, {
        edge: isPrev ? 'start' : 'end',
      })
      const point = isPrev
        ? Editor.before(editor, edge)
        : Editor.after(editor, edge)

      if (point) {
        const range = Editor.range(editor, point)
        return range
      }
    }

    
    let domRange
    const { document } = window

    
    if (document.caretRangeFromPoint) {
      domRange = document.caretRangeFromPoint(x, y)
    } else {
      const position = (document as any).caretPositionFromPoint(x, y)

      if (position) {
        domRange = document.createRange()
        domRange.setStart(position.offsetNode, position.offset)
        domRange.setEnd(position.offsetNode, position.offset)
      }
    }

    if (!domRange) {
      handleSlateError( `Cannot resolve a Slate range from a DOM event: ${event}`, editor)
      return
    }
    
    const range = ReactEditor.toSlateRange(editor, domRange,{
      exactMatch: false,
      suppressThrow: false,
    })
    return range
  },

  

  toSlatePoint<T extends boolean>(
    editor: ReactEditor, 
    domPoint: DOMPoint, 
    options: {
      exactMatch: T
      suppressThrow: T
    }): T extends true ? Point | null : Point {
    const { exactMatch, suppressThrow } = options;
    const [nearestNode, nearestOffset] = exactMatch ? domPoint : normalizeDOMPoint(domPoint);
    const el = domPoint[0] as DOMElement
    const isOnlyReadEL = el?.hasAttribute && el?.hasAttribute('data-ignore-slate')
    const isText = typeof el === 'string' || el?.nodeName === '#text'
    const parentIsOnlyReadEL = isText && (el?.parentNode as any)?.hasAttribute && (el?.parentNode as any)?.hasAttribute('data-ignore-slate')
    if (isOnlyReadEL || parentIsOnlyReadEL) { 
    
      
      
      
      
      
      

      
      
      
      
      
      
      
      
      
      
      
      
      
      
    }
    const parentNode = nearestNode.parentNode as DOMElement
    let textNode: DOMElement | null = null
    let offset = 0

    if (parentNode) {
      const voidNode = parentNode.closest('[data-slate-void="true"]')
      let leafNode = parentNode.closest('[data-slate-leaf]')
      let domNode: DOMElement | null = null

      
      
      if (leafNode) {
        textNode = leafNode.closest('[data-slate-node="text"]')!
        const range = window.document.createRange()
        range.setStart(textNode, 0)
        range.setEnd(nearestNode, nearestOffset)
        const contents = range.cloneContents()
        const removals = [
          ...Array.prototype.slice.call(
            contents.querySelectorAll('[data-slate-zero-width]')
          ),
          ...Array.prototype.slice.call(
            contents.querySelectorAll('[contenteditable=false]')
          ),
        ]

        removals.forEach(el => {
          el!.parentNode!.removeChild(el)
        })
        
        
        
        
        
        
        
        
        
        offset = contents.textContent!.length;
        
        domNode = textNode
      } else if (voidNode) {
        
        

        leafNode = voidNode.querySelector('[data-slate-leaf]')!
        
          if (!leafNode) {
          offset = 1
        } else {
          textNode = leafNode.closest('[data-slate-node="text"]')!
          domNode = leafNode
          offset = domNode.textContent!.length
          domNode.querySelectorAll('[data-slate-zero-width]').forEach(el => {
            offset -= el.textContent!.length
          })
        }
      }
      if (
        domNode &&
        offset === domNode.textContent!.length &&
        
        
        
        
        
        (parentNode.hasAttribute('data-slate-zero-width') ||
          
          
          
          (IS_FIREFOX && domNode.textContent?.endsWith('\n\n')))
      ) {
        offset--
      }
    }
    if (!textNode) {
      const textContent = domPoint && domPoint[0] && domPoint[0]?.parentElement
      const parentElementInnerHTML = domPoint && domPoint[0] && domPoint[0]?.parentElement?.innerHTML
      const innerHTML = domPoint && domPoint[0] && domPoint[0]?.innerHTML
      
      !suppressThrow && console.error(`Cannot resolve a Slate point from DOM point:  textContent:${textContent} ， parentElementInnerHTML:${parentElementInnerHTML}， innerHTML:${innerHTML}，`, editor)
      if (suppressThrow || true) {
        return null as T extends true ? Point | null : Point
      }
    }
    
    
    
    const slateNode = ReactEditor.toSlateNode(editor, textNode!)
    const path = ReactEditor.findPath(editor, slateNode)
    return { path, offset } as T extends true ? Point | null : Point
  },

  

   toSlateRange<T extends boolean>(
    editor: ReactEditor,
    domRange: DOMRange | DOMStaticRange | DOMSelection,
    options: {
      exactMatch: T
      suppressThrow: T
    }
  ): T extends true ? Range | null : Range {
    const { exactMatch, suppressThrow } = options
    const el = isDOMSelection(domRange)
      ? domRange.anchorNode
      : domRange.startContainer
    let anchorNode
    let anchorOffset
    let focusNode
    let focusOffset
    let isCollapsed
    if (el) {
      if (isDOMSelection(domRange)) {
        anchorNode = domRange.anchorNode
        anchorOffset = domRange.anchorOffset
        focusNode = domRange.focusNode
        focusOffset = domRange.focusOffset
        
        
        
        
        if (IS_CHROME && hasShadowRoot()) {
          isCollapsed =
            domRange.anchorNode === domRange.focusNode &&
            domRange.anchorOffset === domRange.focusOffset
        } else {
          isCollapsed = domRange.isCollapsed
        }
      } else {
        anchorNode = domRange.startContainer
        anchorOffset = domRange.startOffset
        focusNode = domRange.endContainer
        focusOffset = domRange.endOffset
        isCollapsed = domRange.collapsed
      }
    }
    if (
      anchorNode == null ||
      focusNode == null ||
      anchorOffset == null ||
      focusOffset == null
    ) {
      handleSlateError( 
        `Cannot resolve a Slate range from DOM range: ${domRange}`, editor
      )
    }
    const anchor = ReactEditor.toSlatePoint(
      editor,
      [anchorNode, anchorOffset],
      { exactMatch, suppressThrow }
    )
     if (!anchor || !Point.isPoint(anchor)) {
      anchor && !Point.isPoint(anchor) &&  console.error('toSlateRange anchor undefined')
      return null as T extends true ? Range | null : Range
    }
    const focus = isCollapsed
      ? anchor
      : ReactEditor.toSlatePoint(editor, [focusNode, focusOffset], {
          exactMatch,
          suppressThrow,
        })
    if (!focus || !Point.isPoint(focus)) {
      focus && !Point.isPoint(anchor) &&  console.error('toSlateRange focus undefined')
      return null as T extends true ? Range | null : Range
    }
    let range: Range = { anchor: anchor as Point, focus: focus as Point }
    
    
    
    
    if (
      Range.isExpanded(range) &&
      Range.isForward(range) &&
      isDOMElement(focusNode) &&
      Editor.void(editor, { at: range.focus, mode: 'highest' })
    ) {
      range = Editor.unhangRange(editor, range, { voids: true })
    }
    return (range as unknown) as T extends true ? Range | null : Range
  },
 

  toSlateRange2<T extends boolean>(
    editor: ReactEditor,
    domRange: DOMRange | DOMStaticRange | DOMSelection,
    options: {
      exactMatch: T
      suppressThrow: T
    }
  ): T extends true ? Range | null : Range {
    const { exactMatch, suppressThrow } = options
    const el = isDOMSelection(domRange)
      ? domRange.anchorNode
      : domRange.startContainer
    let anchorNode
    let anchorOffset
    let focusNode
    let focusOffset
    let isCollapsed
    if (el) {
      if (isDOMSelection(domRange)) {
        anchorNode = domRange.anchorNode
        anchorOffset = domRange.anchorOffset
        focusNode = domRange.focusNode
        focusOffset = domRange.focusOffset
        
        
        
        
        if (IS_CHROME && hasShadowRoot()) {
          isCollapsed =
            domRange.anchorNode === domRange.focusNode &&
            domRange.anchorOffset === domRange.focusOffset
        } else {
          isCollapsed = domRange.isCollapsed
        }
      } else {
        anchorNode = domRange.startContainer
        anchorOffset = domRange.startOffset
        focusNode = domRange.endContainer
        focusOffset = domRange.endOffset
        isCollapsed = domRange.collapsed
      }
    }
    if (
      anchorNode == null ||
      focusNode == null ||
      anchorOffset == null ||
      focusOffset == null
    ) {
      console.error( 
        `Cannot resolve a Slate range from DOM range: ${domRange}`, editor
      )
    }
    const anchor = ReactEditor.toSlatePoint(
      editor,
      [anchorNode, anchorOffset],
      { exactMatch, suppressThrow }
    )
    if (!anchor) {
      return null as T extends true ? Range | null : Range
    }
    const focus = isCollapsed
      ? anchor
      : ReactEditor.toSlatePoint(editor, [focusNode, focusOffset], {
          exactMatch,
          suppressThrow,
        })
    if (!focus) {
      return null as T extends true ? Range | null : Range
    }
    let range: Range = { anchor: anchor as Point, focus: focus as Point }
    
    
    
    
    if (
      Range.isExpanded(range) &&
      Range.isForward(range) &&
      isDOMElement(focusNode) &&
      Editor.void(editor, { at: range.focus, mode: 'highest' })
    ) {
      range = Editor.unhangRange(editor, range, { voids: true })
    }
    return (range as unknown) as T extends true ? Range | null : Range
  },
  hasRange(editor: ReactEditor, range: Range): boolean {
    const { anchor, focus } = range
    return (
      Editor.hasPath(editor, anchor.path) && Editor.hasPath(editor, focus.path)
    )
  },

  hasCardTarget(node: DOMNode) {
    return node && (node.parentElement.hasAttribute('card-target') || (node instanceof HTMLElement && node.hasAttribute('card-target')));
  },

  getCardTargetAttribute(node: DOMNode) {
    return node.parentElement.getAttribute('card-target') || (node instanceof HTMLElement && node.getAttribute('card-target'));
  },

  getCardCursorNode(editor: ReactEditor, blockCardNode: Node, options: {
    direction: 'left' | 'right' | 'center'
  }) {
    const blockCardElement = ReactEditor.toDOMNode(editor, blockCardNode);
    const cardCenter = blockCardElement.parentElement;
    return options.direction === 'left'
      ? cardCenter.previousElementSibling
      : cardCenter.nextElementSibling;
  },

  isCardLeft(node: DOMNode) {
    const cardTarget = ReactEditor.getCardTargetAttribute(node);
    return cardTarget && cardTarget === 'card-left';
  },

  isCardLeftByTargetAttr(targetAttr: any) {
    return targetAttr && targetAttr.nodeValue === 'card-left';
  },

  isCardRightByTargetAttr(targetAttr: any) {
    return targetAttr && targetAttr.nodeValue === 'card-right';
  },

  isCardCenterByTargetAttr(targetAttr: any) {
    return targetAttr && targetAttr.nodeValue === 'card-center';
  },

  toSlateCardEntry(editor: ReactEditor, node: DOMNode): NodeEntry {
    const element = node.parentElement
      .closest('.sla-block-card-element')?.querySelector('[card-target="card-center"]')
      .firstElementChild;
    const slateNode = ReactEditor.toSlateNode(editor, element);
    const path = ReactEditor.findPath(editor, slateNode);
    return [slateNode, path];
  },

  moveBlockCard(editor: ReactEditor, blockCardNode: Node, options: {
    direction: 'left' | 'right'
  }) {
    const cursorNode = ReactEditor.getCardCursorNode(editor, blockCardNode, options);
    const domSelection = window.getSelection();
    domSelection.setBaseAndExtent(cursorNode, 1, cursorNode, 1);
  }
}
