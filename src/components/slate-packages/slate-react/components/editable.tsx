import throttle from 'lodash/throttle'
import * as getDirection from 'direction'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Editor,
  Element, Node, NodeEntry, Path, Range,
  Text,
  Transforms
} from "@src/components/slate-packages/slate"
import { ReactEditor } from '..'
import { useIsomorphicLayoutEffect } from '../hooks/use-isomorphic-layout-effect'
import { ReadOnlyContext } from '../hooks/use-read-only'
import { useSlate } from '../hooks/use-slate'
import {
  DOMElement,
  DOMNode,
  DOMRange, DOMStaticRange, isDOMElement,
  isDOMNode, isPlainTextOnlyPaste,
  getDefaultView,
} from '../utils/dom'
import {
  IS_CHROME,
  IS_CHROME_LEGACY, IS_EDGE_LEGACY, IS_FIREFOX,
  IS_SAFARI
} from '../utils/environment'
import Hotkeys from '../utils/hotkeys'
import {
  EDITOR_TO_ELEMENT,
  ELEMENT_TO_NODE, IS_FOCUSED, IS_READ_ONLY,
  NODE_TO_ELEMENT, PLACEHOLDER_SYMBOL, EDITOR_TO_WINDOW
} from '../utils/weak-maps'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'
import Children from './children'
import { getParentPathByTypes } from '@src/components/docs/plugins/pluginsUtils/getPathUtils'
import { ELTYPE, HEADING_TYPES, LIST_TYPES, TABBABLE_TYPES } from '@src/components/docs/plugins/config'
import { getCache, setCache } from '@src/utils/cacheUtils'
import scrollIntoView from 'scroll-into-view-if-needed'
import { is } from 'immer/dist/internal'
import { updateIdentities } from '@src/components/docs/plugins/deserializers/handleFragmentPlugins'




const HAS_BEFORE_INPUT_SUPPORT = !(
  IS_FIREFOX ||
  IS_EDGE_LEGACY ||
  IS_CHROME_LEGACY
)



export interface RenderElementProps {
  children: any
  element: Element
  attributes: {
    'data-slate-node': 'element'
    'data-slate-inline'?: true
    'data-slate-void'?: true
    dir?: 'rtl'
    ref: any
  },
  editorState: any, 
}



export interface RenderLeafProps {
  children: any
  leaf: Text
  text: Text
  attributes: {
    'data-slate-leaf': true
  }
}

type DeferredOperation = () => void



export type EditableProps = {
  decorate?: (entry: NodeEntry) => Range[]
  onDOMBeforeInput?: (event: Event) => void
  placeholder?: string
  readOnly?: boolean
  selectRow?: any
  width?: number
  setSelectCB?: Function
  editorId?: string
  refs?: any
  role?: string
  style?: React.CSSProperties
  renderElement?: (props: RenderElementProps) => JSX.Element
  renderLeaf?: (props: RenderLeafProps) => JSX.Element
  renderPlaceholder?: (props: RenderPlaceholderProps) => JSX.Element
  scrollSelectionIntoView?: (editor: ReactEditor, domRange: DOMRange) => void
  as?: React.ElementType
  [key: string]: unknown
} & React.TextareaHTMLAttributes<HTMLDivElement>



export const Editable = (props: EditableProps) => {
  const {
    autoFocus,
    decorate = defaultDecorate,
    onDOMBeforeInput: propsOnDOMBeforeInput,
    placeholder,
    readOnly = false,
    renderElement,
    renderLeaf,
    refs,
    selectRow,
    width,
    setSelectCB,
    editorId,
    scrollSelectionIntoView = defaultScrollSelectionIntoView,
    style = {},
    as: Component = 'div',
    ...attributes
  } = props
  const editor = useSlate()
  
  const [isComposing, setIsComposing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const deferredOperations = useRef<DeferredOperation[]>([])

  
  IS_READ_ONLY.set(editor, readOnly)

  
  const state = useMemo(
    () => ({
      isComposing: false,
      isUpdatingSelection: false,
      latestElement: null as DOMElement | null,
      isPlaceholderRemove: false,
    }),
    []
  )
  
  useEffect(() => {
    if (ref.current && ref.current.id.indexOf('editorarea') === 0) {
      refs && refs(ref.current)
    }
  }, [])
  
  useIsomorphicLayoutEffect(() => {
    
    let window
    if (ref.current && (window = getDefaultView(ref.current))) {
      EDITOR_TO_WINDOW.set(editor, window);
      EDITOR_TO_ELEMENT.set(editor, ref.current)
      NODE_TO_ELEMENT.set(editor, ref.current)
      ELEMENT_TO_NODE.set(ref.current, editor)
    } else {
      NODE_TO_ELEMENT.delete(editor)
    }
  })

  
  useIsomorphicLayoutEffect(() => {
    const { selection } = editor
    const domSelection = window.getSelection()
    

    if (state.isComposing || isComposing || !domSelection || !ReactEditor.isFocused(editor) || !Range.isRange(selection) || !ReactEditor.hasRange(editor, selection)) {
      return
    }

    const hasDomSelection = domSelection.type !== 'None'

    
    if (!selection && !hasDomSelection) {
      return
    }
    

    
    const editorElement = EDITOR_TO_ELEMENT.get(editor)!
    let hasDomSelectionInEditor = false
    if (
      editorElement.contains(domSelection.anchorNode) &&
      editorElement.contains(domSelection.focusNode)
    ) {
      hasDomSelectionInEditor = true
    }
    

    
    if (hasDomSelection && hasDomSelectionInEditor && selection) {
      const slateRange = ReactEditor.toSlateRange(editor, domSelection, {
        exactMatch: true,
        
        
        suppressThrow: true,
      })
      if (slateRange && Range.equals(slateRange, selection)) {
        return
      }
    }
    
    
    
    
    
    if (selection && !readOnly && !ReactEditor.hasRange(editor, selection)) {
      editor.selection = ReactEditor.toSlateRange(editor, domSelection, {
        exactMatch: false,
        suppressThrow: false,
      })
      return
    }

    
    const el = ReactEditor.toDOMNode(editor, editor)
    state.isUpdatingSelection = true
    
    
    
    
    
    
    
    
    
    
    
    
    
    const newDomRange = selection && ReactEditor.toDOMRange(editor, selection)
    
    if (newDomRange) {
      
      
      if (Range.isBackward(selection!)) {
        domSelection.setBaseAndExtent(
          newDomRange.endContainer,
          newDomRange.endOffset,
          newDomRange.startContainer,
          newDomRange.startOffset
        )
      } else {
        domSelection.setBaseAndExtent(
          newDomRange.startContainer,
          newDomRange.startOffset,
          newDomRange.endContainer,
          newDomRange.endOffset
        )
      }
      scrollSelectionIntoView(editor, newDomRange)
    } else {
      domSelection.removeAllRanges()
    }

    setTimeout(() => {
      
      
      if (newDomRange && IS_FIREFOX) {
        el.focus()
      }

      state.isUpdatingSelection = false
    })
  })

  
  
  useEffect(() => {
    if (ref.current && autoFocus) {
      ref.current.focus()
    }
  }, [autoFocus])

  
  
  
  
  const onDOMBeforeInput = useCallback(
    (
      event: Event & {
        data: string | null
        dataTransfer: DataTransfer | null
        getTargetRanges(): DOMStaticRange[]
        inputType: string
        isComposing: boolean
      }
    ) => {
      if (
        !readOnly &&
        hasEditableTarget(editor, event.target) &&
        !isDOMEventHandled(event, propsOnDOMBeforeInput)
      ) {
        const { selection } = editor
        const { inputType: type } = event
        const data = event.dataTransfer || event.data || undefined

        
        
        if (
          type === 'insertCompositionText' ||
          type === 'deleteCompositionText' ||
          !!document?.activeElement?.closest("[data-block-context]")
        ) {
          return
        }

        event.preventDefault()
        
        
        
        if (!type.startsWith('delete') || type.startsWith('deleteBy')) {
          const [targetRange] = event.getTargetRanges()

          if (targetRange) {
            const range = ReactEditor.toSlateRange(editor, targetRange, {
              exactMatch: false,
              suppressThrow: false,
            })


            
            
            
            
            
            
            if (!selection || !Range.equals(selection, range)) {
              Transforms.select(editor, range)
            }
          }
        }

        
        
        if (
          selection &&
          Range.isExpanded(selection) &&
          type.startsWith('delete')
        ) {
          
          const direction = type.endsWith('Backward') ? 'backward' : 'forward'
          Editor.deleteFragment(editor, { direction })
          return
        }

        switch (type) {
          case 'deleteByComposition':
          case 'deleteByCut':
          case 'deleteByDrag': {
            Editor.deleteFragment(editor)
            break
          }

          case 'deleteContent':
          case 'deleteContentForward': {
            Editor.deleteForward(editor)
            break
          }

          case 'deleteContentBackward': {
            Editor.deleteBackward(editor)
            break
          }

          case 'deleteEntireSoftLine': {
            Editor.deleteBackward(editor, { unit: 'line' })
            Editor.deleteForward(editor, { unit: 'line' })
            break
          }

          case 'deleteHardLineBackward': {
            Editor.deleteBackward(editor, { unit: 'block' })
            break
          }

          case 'deleteSoftLineBackward': {
            Editor.deleteBackward(editor, { unit: 'line' })
            break
          }

          case 'deleteHardLineForward': {
            Editor.deleteForward(editor, { unit: 'block' })
            break
          }

          case 'deleteSoftLineForward': {
            Editor.deleteForward(editor, { unit: 'line' })
            break
          }

          case 'deleteWordBackward': {
            Editor.deleteBackward(editor, { unit: 'word' })
            break
          }

          case 'deleteWordForward': {
            Editor.deleteForward(editor, { unit: 'word' })
            break
          }

          case 'insertLineBreak':
          case 'insertParagraph': {
            Editor.insertBreak(editor)
            break
          }

          
          
          
          
          
          
          
          
          
          case 'insertFromDrop':
          case 'insertFromPaste':
          case 'insertFromYank':
          case 'insertReplacementText':
          case 'insertText': {
            if (data instanceof DataTransfer) {
              ReactEditor.insertData(editor, data)
            } else if (typeof data === 'string') {
              Editor.insertText(editor, data)
            }

            break
          }
        }
      }
    },
    [readOnly, propsOnDOMBeforeInput]
  )

  
  
  
  
  useIsomorphicLayoutEffect(() => {
    if (ref.current && HAS_BEFORE_INPUT_SUPPORT) {
      
      ref.current.addEventListener('beforeinput', onDOMBeforeInput)
    }

    return () => {
      if (ref.current && HAS_BEFORE_INPUT_SUPPORT) {
        
        ref.current.removeEventListener('beforeinput', onDOMBeforeInput)
      }
    }
  }, [onDOMBeforeInput])

  
  
  
  
  
  const onDOMSelectionChange = useCallback(
    throttle(() => {
      if (!!document?.activeElement?.closest("[data-block-context]")) {
        
        return;
      }
      if (
        !readOnly &&
        !state.isComposing &&
        !state.isUpdatingSelection
      ) {
        const { activeElement } = window.document
        const el = ReactEditor.toDOMNode(editor, editor)
        const domSelection = window.getSelection()
        if (activeElement === el) {
          state.latestElement = activeElement
          IS_FOCUSED.set(editor, true)
        } else {
          IS_FOCUSED.delete(editor)
        }

        if (!domSelection) {
          return Transforms.deselect(editor)
        }


        const { anchorNode, focusNode } = domSelection

        const anchorNodeSelectable =
          hasEditableTarget(editor, anchorNode) ||
          isTargetInsideVoid(editor, anchorNode)

        const focusNodeSelectable =
          hasEditableTarget(editor, focusNode) ||
          isTargetInsideVoid(editor, focusNode)

        if (anchorNodeSelectable && focusNodeSelectable && !state.isComposing) {
          const range = ReactEditor.toSlateRange(editor, domSelection, {
            exactMatch: false,
            suppressThrow: false,
          })
          
          
          Transforms.select(editor, range)
          
          
          
        }
        
        
        
        
        
      }
    }, 100),
    [readOnly]
  )

  
  
  
  
  
  useIsomorphicLayoutEffect(() => {
    window.document.addEventListener('selectionchange', onDOMSelectionChange)

    return () => {
      window.document.removeEventListener(
        'selectionchange',
        onDOMSelectionChange
      )
    }
  }, [onDOMSelectionChange])

  
  
  
  
  
  
  
  

  
  
  
  
  
  
  
  
  
  
  

  
  
  
  
  

  
  
  
  

  const decorations: any = decorate([editor, []])

  if (
    placeholder &&
    editor.children.length === 1 &&
    Array.from(Node.texts(editor)).length === 1 &&
    Node.string(editor) === '' &&
    !isComposing
  ) {
    const start = Editor.start(editor, [])
    decorations.push({
      [PLACEHOLDER_SYMBOL]: true,
      placeholder,
      anchor: start,
      focus: start,
    })
  }
  return (
    <ReadOnlyContext.Provider value={readOnly}>
      <Component
        
        
        
        data-gramm={false}
        role={readOnly ? undefined : 'textbox'}
        {...attributes}
        
        
        spellCheck={
          !HAS_BEFORE_INPUT_SUPPORT ? undefined : attributes.spellCheck
        }
        autoCorrect={
          !HAS_BEFORE_INPUT_SUPPORT ? undefined : attributes.autoCorrect
        }
        autoCapitalize={
          !HAS_BEFORE_INPUT_SUPPORT ? undefined : attributes.autoCapitalize
        }
        data-slate-editor
        data-slate-node="value"
        contentEditable={readOnly ? undefined : true}
        suppressContentEditableWarning
        ref={ref}
        style={{
          
          outline: 'none',
          
          whiteSpace: 'pre-wrap',
          
          wordWrap: 'break-word',
          
          ...style,
        }}
        onBeforeInput={useCallback(
          (event: React.FormEvent<HTMLDivElement>) => {
            
            
            
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              !HAS_BEFORE_INPUT_SUPPORT &&
              !readOnly &&
              !isEventHandled(event, attributes.onBeforeInput) &&
              hasEditableTarget(editor, event.target)
            ) {
              event.preventDefault();
              if (!state.isComposing) {
                const text = (event as any).data as string
                Editor.insertText(editor, text)
              }
              
              
            }
          },
          [readOnly]
        )}
        onBlur={useCallback(
          (event: React.FocusEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              readOnly ||
              state.isUpdatingSelection ||
              !hasEditableTarget(editor, event.target) ||
              isEventHandled(event, attributes.onBlur)
            ) {
              return
            }

            
            
            
            
            if (state.latestElement === window.document.activeElement) {
              return
            }

            const { relatedTarget } = event
            const el = ReactEditor.toDOMNode(editor, editor)

            
            
            
            if (relatedTarget === el) {
              return
            }

            
            
            if (
              isDOMElement(relatedTarget) &&
              relatedTarget.hasAttribute('data-slate-spacer')
            ) {
              return
            }
            if (
              isDOMElement(relatedTarget) &&
              relatedTarget.hasAttribute('data-ignore-slate')
            ) {
              return
            }

            
            
            
            if (
              relatedTarget != null &&
              isDOMNode(relatedTarget) &&
              ReactEditor.hasDOMNode(editor, relatedTarget)
            ) {
              const node = ReactEditor.toSlateNode(editor, relatedTarget)

              if (Element.isElement(node) && !editor.isVoid(node)) {
                return
              }
            }

            IS_FOCUSED.delete(editor)
          },
          [readOnly, attributes.onBlur]
        )}
        onClick={useCallback(
          (event: React.MouseEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              !readOnly &&
              hasTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onClick) &&
              isDOMNode(event.target)
            ) {

              if (hasClass(event.target, 'ToolIcon')) {
                return
              }
              
              if (event.target && (event.target.parentElement.hasAttribute("data-ignore-slate") || (event.target as any).hasAttribute("data-ignore-slate"))) { 
                return
              }
              try { const node = ReactEditor.toSlateNode(editor, event.target) } catch (e) {
                handleSlateError(e.message, editor)
                return
              }
              const node = ReactEditor.toSlateNode(editor, event.target)
              if (!node) return; 
              const path = ReactEditor.findPath(editor, node)
              const start = Editor.start(editor, path)
              const end = Editor.end(editor, path)

              const startVoid = Editor.void(editor, { at: start })
              const endVoid = Editor.void(editor, { at: end })

              if (
                startVoid &&
                endVoid &&
                Path.equals(startVoid[1], endVoid[1])
              ) {
                const range = Editor.range(editor, start)
                Transforms.select(editor, range)
              }
            }
          },
          [readOnly, attributes.onClick]
        )}
        onCompositionEnd={useCallback(
          (event: React.CompositionEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onCompositionEnd)
            ) {
              event.preventDefault();
              state.isComposing && setIsComposing(false)
              state.isComposing = false
              if (!IS_FIREFOX && event.data) {
                console.log('onCompositionEnd', event.data.replace(/\n/g, ''))
                Editor.insertText(editor, event.data.replace(/\n/g, ''))
              }

            }
          },
          [attributes.onCompositionEnd]
        )}
        onCompositionStart={useCallback(
          (event: React.CompositionEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onCompositionStart)
            ) {
              
              
              
              const { selection, marks } = editor
              if (selection) {
                if (Range.isExpanded(selection)) {
                  Editor.deleteFragment(editor)

                  return
                }
                const inline = Editor.above(editor, {
                  match: n => Editor.isInline(editor, n),
                  mode: 'highest',
                })
                if (inline) {
                  const [, inlinePath] = inline
                  if (Editor.isEnd(editor, selection.anchor, inlinePath)) {
                    const point = Editor.after(editor, inlinePath)!
                    Transforms.setSelection(editor, {
                      anchor: point,
                      focus: point,
                    })
                  }
                }
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
                
              }
            }
          },
          [attributes.onCompositionStart]
        )}
        onCompositionUpdate={useCallback(
          (event: React.CompositionEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onCompositionUpdate)
            ) {
              event.preventDefault();
              !state.isComposing && setIsComposing(true)
              state.isComposing = true
            }
          },
          [attributes.onCompositionUpdate]
        )}
        onCopy={useCallback(
          (event: React.ClipboardEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              
              !isEventHandled(event, attributes.onCopy)
            ) {
              if (!hasEditableTarget(editor, event.target)) {
                const domSelection = window.getSelection();
                editor.selection = getSelectionFromDomSelection(editor, domSelection);
                if (!editor.selection) {
                  return;
                }
              }
              event.preventDefault()
              ReactEditor.setFragmentData(editor, event.clipboardData)
            }
          },
          [attributes.onCopy]
        )}
        onCut={useCallback(
          (event: React.ClipboardEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              !readOnly &&
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onCut)
            ) {
              event.preventDefault()
              ReactEditor.setFragmentData(editor, event.clipboardData)
              const { selection } = editor

              if (selection && Range.isExpanded(selection)) {
                Editor.deleteFragment(editor)
              }
            }
          },
          [readOnly, attributes.onCut]
        )}
        onDragOver={useCallback(
          (event: React.DragEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            
            
            if (
              hasTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onDragOver)
            ) {
              
              
              
              const node: any = ReactEditor.toSlateNode(editor, event.target)
              if (!node || (!node.text && ![...LIST_TYPES, ...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ELTYPE.PARAGRAPH].includes(node.type))) return; 
              
              if (Editor.isVoid(editor, node)) {
                event.preventDefault()
              }
            }
          },
          [attributes.onDragOver]
        )}
        onDragStart={useCallback(
          (event: React.DragEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            const isDragHandle = (event?.target as HTMLElement)?.closest('.drag-handle');
            const isInlineImage = (event?.target as HTMLElement)?.closest('.imageContainer-outer-wrap');
            if (!isDragHandle && !isInlineImage) {
              event.preventDefault();
              console.log("[onDragStart] preventDefault", event.target)
              return;
            }
            
            
            
            
            
            
            
            

            
            
            
            
            
            

            
            
          },
          [attributes.onDragStart]
        )}
        onDrop={useCallback(
          (event: React.DragEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            
            console.log("[onDrop]", event)
            if (
              hasTarget(editor, event.target) &&
              !readOnly &&
              !isEventHandled(event, attributes.onDrop)
            ) {
              event.dataTransfer.dropEffect = 'copy';
              const node: any = ReactEditor.toSlateNode(editor, event.target)
              console.log("[onDrop]", node, !node || (!node.text && ![...LIST_TYPES, ...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ELTYPE.PARAGRAPH].includes(node.type)))
              if (!node || (!node.text && ![...LIST_TYPES, ...HEADING_TYPES, ELTYPE.BLOCK_QUOTE, ELTYPE.PARAGRAPH].includes(node.type))) {
                event.preventDefault();
                return; 
              }

              let dragDataTransfer = getCache(editor.docId, 'drag-data-transfer') || null;
              if (!dragDataTransfer) return;

              const { dragData, dragOriginalPath, isInline } = dragDataTransfer;

              event.preventDefault()

              console.log('[onDrop] preventDefault', dragData, dragOriginalPath, !HAS_BEFORE_INPUT_SUPPORT, (!IS_SAFARI && event.dataTransfer.files.length > 0))
              if (dragData && dragOriginalPath) {
                const fragment = dragData.getData("text/plain");
                console.log('[onDrop]', event.target, fragment);
                const newFragment = updateIdentities(fragment);
                const parsed = JSON.parse(newFragment) as Node[];

                if (isInline) {
                  const range = ReactEditor.findEventRange(editor, event)
                  const isTargetBefore = Path.isBefore(range.anchor.path, dragOriginalPath);
                  if (isTargetBefore) {
                    Transforms.delete(editor, { at: dragOriginalPath });
                  }
                  Transforms.select(editor, range);
                  
                  Transforms.insertFragment(editor, parsed);

                  if (!isTargetBefore) {
                    Transforms.delete(editor, { at: dragOriginalPath });
                  }
                } else {
                  Transforms.delete(editor, { at: dragOriginalPath });
                  Transforms.insertNodes(editor, { type: ELTYPE.PARAGRAPH, children: [{ text: '' }] } as any, { at: dragOriginalPath });

                  const range = ReactEditor.findEventRange(editor, event)
                  Transforms.select(editor, range);

                  const targetLineContentLength = range?.focus?.path && Node.string(Node.get(editor, range.focus.path))?.length;
                  if (typeof targetLineContentLength === 'number' && targetLineContentLength > 0) {
                    Transforms.insertNodes(editor, parsed);
                  } else {
                    
                    Transforms.insertFragment(editor, parsed);
                  }
                }

              }
            }
            setCache(editor.docId, 'drag-data-transfer', { dragData: null, dragOriginalPath: null, isInline: null })
          },
          [readOnly, attributes.onDrop]
        )}
        onFocus={useCallback(
          (event: React.FocusEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            if (
              !readOnly &&
              !state.isUpdatingSelection &&
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onFocus)
            ) {
              const el = ReactEditor.toDOMNode(editor, editor)
              state.latestElement = window.document.activeElement

              
              
              
              if (IS_FIREFOX && event.target !== el) {
                el.focus()
                return
              }

              IS_FOCUSED.set(editor, true)
            }
          },
          [readOnly, attributes.onFocus]
        )}
        onKeyDown={useCallback(
          (event: React.KeyboardEvent<HTMLDivElement>) => {
            let isBlockContext = false;
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              console.log("[activeElement] onKeyDown prevented")
              isBlockContext = true;
            }
            if (
              !readOnly &&
              !state.isComposing &&
              !isBlockContext &&
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onKeyDown)
            ) {
              const { nativeEvent } = event
              const { selection } = editor

              const element =
                editor.children[
                selection !== null ? selection.focus.path[0] : 0
                ]
              const isRTL = getDirection(Node.string(element)) === 'rtl'

              
              
              
              
              if (Hotkeys.isRedo(nativeEvent)) {
                event.preventDefault()
                const maybeHistoryEditor: any = editor

                if (typeof maybeHistoryEditor.redo === 'function') {
                  maybeHistoryEditor.redo()
                }

                return
              }

              if (Hotkeys.isUndo(nativeEvent)) {
                event.preventDefault()
                const maybeHistoryEditor: any = editor

                if (typeof maybeHistoryEditor.undo === 'function') {
                  maybeHistoryEditor.undo()
                }

                return
              }

              
              
              
              
              if (Hotkeys.isMoveLineBackward(nativeEvent)) {
                event.preventDefault()
                Transforms.move(editor, { unit: 'line', reverse: true })
                return
              }

              if (Hotkeys.isMoveLineForward(nativeEvent)) {
                event.preventDefault()
                Transforms.move(editor, { unit: 'line' })
                return
              }

              if (Hotkeys.isExtendLineBackward(nativeEvent)) {
                event.preventDefault()
                Transforms.move(editor, {
                  unit: 'line',
                  edge: 'focus',
                  reverse: true,
                })
                return
              }

              if (Hotkeys.isExtendLineForward(nativeEvent)) {
                event.preventDefault()
                Transforms.move(editor, { unit: 'line', edge: 'focus' })
                return
              }

              
              
              
              
              
              if (Hotkeys.isMoveBackward(nativeEvent)) {
                event.preventDefault()

                if (selection && Range.isCollapsed(selection)) {
                  Transforms.move(editor, { reverse: !isRTL })
                } else {
                  Transforms.collapse(editor, { edge: 'start' })
                }

                return
              }

              if (Hotkeys.isMoveForward(nativeEvent)) {
                event.preventDefault()

                if (selection && Range.isCollapsed(selection)) {
                  Transforms.move(editor, { reverse: isRTL })
                } else {
                  Transforms.collapse(editor, { edge: 'end' })
                }

                return
              }


              if (Hotkeys.isMoveWordBackward(nativeEvent)) {
                event.preventDefault()

                if (selection && Range.isExpanded(selection)) {
                  Transforms.collapse(editor, { edge: 'focus' })
                }

                Transforms.move(editor, { unit: 'word', reverse: !isRTL })
                return
              }

              if (Hotkeys.isMoveWordForward(nativeEvent)) {
                event.preventDefault()

                if (selection && Range.isExpanded(selection)) {
                  Transforms.collapse(editor, { edge: 'focus' })
                }

                Transforms.move(editor, { unit: 'word', reverse: isRTL })
                return
              }

              
              
              
              if (!HAS_BEFORE_INPUT_SUPPORT) {
                
                
                if (
                  Hotkeys.isBold(nativeEvent) ||
                  Hotkeys.isItalic(nativeEvent) ||
                  Hotkeys.isTransposeCharacter(nativeEvent)
                ) {
                  event.preventDefault()
                  return
                }

                if (Hotkeys.isSplitBlock(nativeEvent)) {
                  event.preventDefault()
                  Editor.insertBreak(editor)
                  return
                }

                if (Hotkeys.isDeleteBackward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'backward' })
                  } else {
                    Editor.deleteBackward(editor)
                  }

                  return
                }

                if (Hotkeys.isDeleteForward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'forward' })
                  } else {
                    Editor.deleteForward(editor)
                  }

                  return
                }

                if (Hotkeys.isDeleteLineBackward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'backward' })
                  } else {
                    Editor.deleteBackward(editor, { unit: 'line' })
                  }

                  return
                }

                if (Hotkeys.isDeleteLineForward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'forward' })
                  } else {
                    Editor.deleteForward(editor, { unit: 'line' })
                  }

                  return
                }

                if (Hotkeys.isDeleteWordBackward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'backward' })
                  } else {
                    Editor.deleteBackward(editor, { unit: 'word' })
                  }

                  return
                }

                if (Hotkeys.isDeleteWordForward(nativeEvent)) {
                  event.preventDefault()

                  if (selection && Range.isExpanded(selection)) {
                    Editor.deleteFragment(editor, { direction: 'forward' })
                  } else {
                    Editor.deleteForward(editor, { unit: 'word' })
                  }

                  return
                }
              } else {
                if (IS_CHROME || IS_SAFARI) {
                  
                  
                  if (
                    selection &&
                    (Hotkeys.isDeleteBackward(nativeEvent) ||
                      Hotkeys.isDeleteForward(nativeEvent)) &&
                    Range.isCollapsed(selection)
                  ) {
                    const currentNode = Node.parent(
                      editor,
                      selection.anchor.path
                    )

                    if (
                      Element.isElement(currentNode) &&
                      Editor.isVoid(editor, currentNode) &&
                      Editor.isInline(editor, currentNode)
                    ) {
                      event.preventDefault()
                      Editor.deleteBackward(editor, { unit: 'block' })

                      return
                    }
                  }
                }
              }
            }
          },
          [readOnly, attributes.onKeyDown]
        )}
        onPaste={useCallback(
          (event: React.ClipboardEvent<HTMLDivElement>) => {
            if (!!document?.activeElement?.closest("[data-block-context]")) {
              return;
            }
            
            
            
            
            
            if (
              hasEditableTarget(editor, event.target) &&
              !isEventHandled(event, attributes.onPaste) &&
              (!HAS_BEFORE_INPUT_SUPPORT ||
                isPlainTextOnlyPaste(event.nativeEvent)) &&
              !readOnly
            ) {
              event.preventDefault()
              ReactEditor.insertData(editor, event.clipboardData)
            }
          },
          [readOnly, attributes.onPaste]
        )}
      >
        {}
        <Children
          decorate={decorate}
          decorations={decorations}
          node={editor}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          selection={editor.selection}
          editorState={{ ...props }}
        />
      </Component>
    </ReadOnlyContext.Provider >
  )
}


export type RenderPlaceholderProps = {
  children: any
  attributes: {
    'data-slate-placeholder': boolean
    dir?: 'rtl'
    contentEditable: boolean
    ref: React.RefObject<any>
    style: React.CSSProperties
  }
}


export const DefaultPlaceholder = ({
  attributes,
  children,
}: RenderPlaceholderProps) => <span {...attributes}>{children}</span>


export const defaultDecorate: (entry: NodeEntry) => Range[] = () => []


export const defaultScrollSelectionIntoView = (
  editor: ReactEditor,
  domRange: DOMRange
) => {
  const readonly = IS_READ_ONLY.get(editor);
  console.log('defaultScrollSelectionIntoView', readonly);
  if (readonly) return;

  
  
  
  if (
    !editor.selection ||
    (editor.selection && Range.isCollapsed(editor.selection))
  ) {
    const leafEl = domRange.startContainer.parentElement!
    leafEl.getBoundingClientRect = domRange.getBoundingClientRect.bind(domRange)
    scrollIntoView(leafEl, {
      scrollMode: 'if-needed',
    })
    delete leafEl.getBoundingClientRect
  }
}



const isRangeEqual = (a: DOMRange, b: DOMRange) => {
  return (
    (a.startContainer === b.startContainer &&
      a.startOffset === b.startOffset &&
      a.endContainer === b.endContainer &&
      a.endOffset === b.endOffset) ||
    (a.startContainer === b.endContainer &&
      a.startOffset === b.endOffset &&
      a.endContainer === b.startContainer &&
      a.endOffset === b.startOffset)
  )
}



export const hasTarget = (
  editor: ReactEditor,
  target: EventTarget | null
): target is DOMNode => {
  return isDOMNode(target) && ReactEditor.hasDOMNode(editor, target)
}



const hasEditableTarget = (
  editor: ReactEditor,
  target: EventTarget | null
): target is DOMNode => {
  return (
    isDOMNode(target) &&
    ReactEditor.hasDOMNode(editor, target, { editable: true })
  )
}



const isTargetInsideVoid = (
  editor: ReactEditor,
  target: EventTarget | null
): boolean => {
  const slateNode =
    hasTarget(editor, target) && ReactEditor.toSlateNode(editor, target)
  return Editor.isVoid(editor, slateNode)
}



const isEventHandled = <
  EventType extends React.SyntheticEvent<unknown, unknown>
>(
  event: EventType,
  handler?: (event: EventType) => void
) => {
  if (!handler) {
    return false
  }

  handler(event)
  return event.isDefaultPrevented() || event.isPropagationStopped()
}



const isDOMEventHandled = (event: Event, handler?: (event: Event) => void) => {
  if (!handler) {
    return false
  }

  handler(event)
  return event.defaultPrevented
}
function hasCardTarget(node: any) {
  return node && (node.parentElement.hasAttribute('card-target') || (node instanceof HTMLElement && node.hasAttribute('card-target')));
}
function hasClass(element, className) {
  return (" " + element.className + "  ").indexOf(" " + className + " ") > -1;
}

export function getSelectionFromDomSelection(editor: ReactEditor, domSelection: Selection): Range | null {
  const { anchorNode, focusNode } = domSelection
  const anchorNodeSelectable =
    hasTarget(editor, anchorNode) ||
    isTargetInsideVoid(editor, anchorNode)

  const focusNodeSelectable =
    hasTarget(editor, focusNode) ||
    isTargetInsideVoid(editor, focusNode)
  const check = checkText(anchorNode) && checkText(focusNode);
  if (anchorNodeSelectable && focusNodeSelectable && check) {
    try {
      const range = ReactEditor.toSlateRange2(editor, domSelection, {
        exactMatch: true,
        suppressThrow: false,
      })
      return range
    } catch (error) {
      console.log('getSelectionFromDomSelection error', error)
      return null
    }

  }
  return null
}

function checkText(domPoint: any) {
  if (!isDOMNode(domPoint)) {
    return false
  }
  let leafNode = domPoint.parentElement.closest('[data-slate-leaf]')
  if (!leafNode) {
    return false
  }
  const textNode = leafNode.closest('[data-slate-node="text"]')!
  return !!textNode
}