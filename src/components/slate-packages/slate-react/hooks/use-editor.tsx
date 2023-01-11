import { createContext, useContext } from 'react'
import { ReactEditor } from '../plugin/react-editor'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'



export const EditorContext = createContext<ReactEditor | null>(null)



export const useEditor = () => {
  const editor = useContext(EditorContext)

  if (!editor) {
    handleSlateError( 
      `The \`useEditor\` hook must be used inside the <Slate> component's context.`
    )
    return
  }

  return editor
}
