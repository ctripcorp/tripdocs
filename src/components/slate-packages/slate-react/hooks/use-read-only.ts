import { createContext, useContext } from 'react'



export const ReadOnlyContext = createContext(false)



export const useReadOnly = (): boolean => {
  return useContext(ReadOnlyContext)
}
