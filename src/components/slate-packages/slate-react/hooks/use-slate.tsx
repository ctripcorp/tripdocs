import { createContext, useContext } from 'react'
import { ReactEditor } from '../plugin/react-editor'
import { handleSlateError } from '@src/components/docs/plugins/ErrorHandle/handleSlateError'




export const SlateContext = createContext<[ReactEditor] | null>(null)



export const useSlate = () => {
  const context = useContext(SlateContext)

  if (!context) {
    handleSlateError( 
      `The \`useSlate\` hook must be used inside the <SlateProvider> component's context.`
    )
    return
  }

  const [editor] = context
  return editor
}
