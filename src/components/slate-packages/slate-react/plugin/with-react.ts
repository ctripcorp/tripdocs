import ReactDOM from 'react-dom'
import { Editor, Node, Operation, Path, Range, Transforms } from "@src/components/slate-packages/slate"
import { currentLineSelectAll } from '../../../../utils/selectionUtils'
import {
  ELTYPE,
  HEADING_MAP,
  HEADING_TYPES,
  TEXT_TAGS_MAP
} from '../../../docs/plugins/config'
import { isSameLineSelection } from '../../../docs/plugins/pluginsUtils/selectionUtils'
import { getPlainText, isDOMText } from '../utils/dom'
import { Key } from '../utils/key'
import { EDITOR_TO_KEY_TO_ELEMENT, EDITOR_TO_ON_CHANGE, NODE_TO_KEY } from '../utils/weak-maps'
import { ReactEditor } from './react-editor'
import { findCurrentLineRange } from '../utils/lines'
import { getCardInnerContentWhenCopy } from '@src/utils/helper/getInnerContentWhenCopy'




export const withReact = <T extends Editor>(editor: T) => {
  const e = editor as T & ReactEditor
  const { apply, onChange, deleteBackward } = e

  
  
  EDITOR_TO_KEY_TO_ELEMENT.set(e, new WeakMap())

  e.deleteBackward = unit => {
    if (unit !== 'line') {
      return deleteBackward(unit)
    }

    if (editor.selection && Range.isCollapsed(editor.selection)) {
      const parentBlockEntry = Editor.above(editor, {
        match: (n:any)  => Editor.isBlock(editor, n),
        at: editor.selection,
      })

      if (parentBlockEntry) {
        const [, parentBlockPath] = parentBlockEntry
        const parentElementRange = Editor.range(
          editor,
          parentBlockPath,
          editor.selection.anchor
        )

        const currentLineRange = findCurrentLineRange(e, parentElementRange)

        if (!Range.isCollapsed(currentLineRange)) {
          Transforms.delete(editor, { at: currentLineRange })
        }
      }
    }
  }
  e.apply = (op: Operation) => {
    const matches: [Path, Key][] = []

    switch (op.type) {
      case 'insert_text':
      case 'remove_text':
      case 'set_node': {
        for (const [node, path] of Editor.levels(e, { at: op.path })) {
          const key = ReactEditor.findKey(e, node)
          matches.push([path, key])
        }

        break
      }

      case 'insert_node':
      case 'remove_node':
      case 'merge_node':
      case 'split_node': {
        for (const [node, path] of Editor.levels(e, {
          at: Path.parent(op.path)
        })) {
          const key = ReactEditor.findKey(e, node)
          matches.push([path, key])
        }

        break
      }

      case 'move_node': {
        for (const [node, path] of Editor.levels(e, {
          at: Path.common(Path.parent(op.path), Path.parent(op.newPath)),
        })) {
          const key = ReactEditor.findKey(e, node)
          matches.push([path, key])
        }
        break
      }
    }

    apply(op)

    for (const [path, key] of matches) {
      const [node] = Editor.node(e, path)
      NODE_TO_KEY.set(node, key)
    }
  }

  (e as any).isBlockCard = (element) => false

  e.setFragmentData = (data: DataTransfer) => {
    const { selection } = e
    let isSelectionChanged = false;
    let sel = JSON.parse(JSON.stringify(selection))
    if (!selection) {
      return
    }

    const [start, end] = Range.edges(selection)
    const startVoid = Editor.void(e, { at: start.path })
    const endVoid = Editor.void(e, { at: end.path })
    const [parentNode, parentPath]: any = Editor.parent(e, start) 
    const [curNode, curPath]: any = Editor.node(e, start) 

    if (Range.isCollapsed(selection) && !startVoid) {
      return
    }

    
    
    
    const currentLineSelectAllRange = currentLineSelectAll(e);

    let contents
    let domRange
    if (!endVoid && isSameLineSelection(selection) && (Range.equals(currentLineSelectAllRange, selection) || Range.equals(currentLineSelectAllRange, { anchor: selection.focus, focus: selection.anchor }))) {
      const curLinePath = selection.focus.path;
      isSelectionChanged = true;
      const dom = ReactEditor.toDOMNode(e, Node.get(e, curLinePath.slice(0, -1)))
      contents = document.createDocumentFragment().appendChild(dom.cloneNode(true))
    } else {
      domRange = ReactEditor.toDOMRange(e, sel)
      contents = domRange.cloneContents()
      const contentsArr: HTMLElement[] = Array.from(contents.childNodes);
      const contentsRes = [];
      console.log("contentsArr", contentsArr)
      if(contentsArr.some((node: any) => node.tagName === 'OL' || node.tagName === 'UL'|| node && node.querySelector && node.querySelector('IMG'))) {
        
        let isList = false;
        
        let relativeFirstIndex = -1;
        let count = 0
        for (let i = 0; i < contentsArr.length; i++) {
          const node:any = contentsArr[i].cloneNode(true);
          let tempDocFrag;
          const imgSelector = node && node.querySelector && node.querySelector('IMG')
          if (imgSelector) {
            const img = imgSelector.cloneNode()
            imgSelector.parentNode.removeChild(imgSelector)
            contentsRes.push(node);
            contentsRes.push(img);
          } else {
            contentsRes.push(node);
          }
          if ((node.tagName === 'OL' || node.tagName === 'UL')) { 
   
            
            if (!isList) {
              relativeFirstIndex = i
              
              isList = true
            }
           
            if (relativeFirstIndex !== i && isList && contentsRes[i-count-1]) { 
            
              
              
              tempDocFrag = document.createDocumentFragment();
              tempDocFrag.appendChild(node.childNodes[0]);
              contentsRes[i-count-1].appendChild(tempDocFrag);
              contentsRes.pop();
              count++
            }
          } else {
            isList = false;
          }
        }
      }
      console.log('contents0', contentsRes)
      if(contentsRes.length > 0) {
        const tempDocFrag = document.createDocumentFragment();
        for (let j = 0; j < contentsRes.length; j++) {
          tempDocFrag.appendChild(contentsRes[j]);
        }
        contents = tempDocFrag;
      }
    }
    console.log('contents', contents, contents.childNodes)

    let attach = contents.childNodes[0] as HTMLElement
    
    contents.querySelector(".placeholder-title") && contents.removeChild(contents.querySelector(".placeholder-title"))
    contents.querySelector(".placeholder-content") && contents.removeChild(contents.querySelector(".placeholder-content"))
    
    contents.childNodes.forEach((node: any) => {
      if (node.textContent && node.textContent.trim() !== '') {
        attach = node as HTMLElement
      }
    })

    
    
    
    if (endVoid) {
      const [voidNode] = endVoid
      const r = domRange.cloneRange()
      const domNode = ReactEditor.toDOMNode(e, voidNode)
      r.setEndAfter(domNode)
      contents = r.cloneContents()
    }

    
    
    
    
    if (startVoid) {
      attach = contents.querySelector('[data-slate-spacer]')! as HTMLElement
    }

    
    
    Array.from(contents.querySelectorAll('[data-slate-zero-width]')).forEach(
      (zw: any) => {
        const isNewline = zw.getAttribute('data-slate-zero-width') === 'n'
        zw.textContent = isNewline ? '\n' : ''
      }
    )
    
    
    
    
    
    
    
    

    
    
    
    if (isDOMText(attach)) {
      
      let formats: any = [] 
      if (Object.keys(TEXT_TAGS_MAP).some((item: any) => curNode[item])) {
        formats = Object.keys(TEXT_TAGS_MAP).filter(
          (item: any) => curNode[item] && curNode[item]
        )
      }

      const span = document.createElement('span')
      
      
      span.style.whiteSpace = 'pre'
      let root: any = span
      let leaf: any = span
      formats.forEach((item: any, index: any) => {
        
        const el = document.createElement(TEXT_TAGS_MAP[item])
        if (item === 'backgroundColor') {
          
          el.setAttribute('data-backgroundcolor', curNode['backgroundColor'])
        }
        if (item === 'fontColor') {
          el.setAttribute('data-fontcolor', curNode['fontColor'])
        }

        leaf = leaf.appendChild(el)
        if (index === 0) root = leaf.parentNode
      })
      leaf.appendChild(attach)
      contents.appendChild(root)
      attach = root
      
      
      
    }

    let fragment = e.getFragment();
    console.log("[with-react]0", fragment)
    
    const isSingleCard = fragment.length === 1 && (fragment[0] as any).type === ELTYPE.CARD;
    if (isSingleCard) {
      getCardInnerContentWhenCopy(fragment, (frag) => {fragment = frag});
    }

    const string = JSON.stringify(fragment)
    const encoded = window.btoa(encodeURIComponent(string))
    attach.setAttribute('data-slate-fragment', encoded)
    data.setData('application/x-slate-fragment', encoded)
    console.log("[with-react]", fragment, string, encoded)
    
    const div = document.createElement('div')
    if (
      !isSelectionChanged && parentNode &&
      HEADING_TYPES.includes(parentNode.type) &&
      start.path[0] === end.path[0]
    ) {
      
      const hTag = document.createElement(HEADING_MAP[parentNode.type])
      hTag.style.whiteSpace = 'pre'
      hTag.setAttribute('data-align', parentNode['align'])

      let root: any = hTag
      root.appendChild(contents)
      div.appendChild(root)
    } else {
      div.appendChild(contents)
    }
    div.setAttribute('hidden', 'true')
    document.body.appendChild(div)
    data.setData('text/html', div.innerHTML)
    data.setData('text/plain', getPlainText(div))
    document.body.removeChild(div)
  }

  e.insertData = (data: DataTransfer) => {
    const fragment = data.getData('application/x-slate-fragment')

    if (fragment) {
      const decoded = decodeURIComponent(window.atob(fragment))
      const parsed = JSON.parse(decoded) as Node[]
      e.insertFragment(parsed)
      return
    }

    const text = data.getData('text/plain')

    if (text) {
      const lines = text.split(/\r\n|\r|\n/)
      let split = false

      for (const line of lines) {
        if (split) {
          Transforms.splitNodes(e, { always: true })
        }

        e.insertText(line)
        split = true
      }
    }
  }

  e.onChange = () => {
    
    
    
    
    ReactDOM.unstable_batchedUpdates(() => {
      const onContextChange = EDITOR_TO_ON_CHANGE.get(e)

      if (onContextChange) {
        onContextChange()
      }

      onChange()
    })
  }

  return e
}
