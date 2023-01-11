import { createContext, useContext } from 'react'



export const SelectedContext = createContext(false)



export const useSelected = (): boolean => {
  return useContext(SelectedContext)
}
