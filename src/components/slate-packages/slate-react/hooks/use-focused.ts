import { createContext, useContext } from 'react'



export const FocusedContext = createContext(false)



export const useFocused = (): boolean => {
  return useContext(FocusedContext)
}
