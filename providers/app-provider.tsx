"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// App Context Types
interface AppState {
  sidebarWidth: number
  currentPhase: "research" | "creation" | "amplification" | null
  completedPhases: string[]
}

interface AppContextType extends AppState {
  setSidebarWidth: (width: number) => void
  setCurrentPhase: (phase: "research" | "creation" | "amplification" | null) => void
  completePhase: (phase: string) => void
  resetWorkflow: () => void
}

// Initial state
const initialState: AppState = {
  sidebarWidth: 480,
  currentPhase: null,
  completedPhases: [],
}

// Context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider
interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [sidebarWidth, setSidebarWidth] = useState(initialState.sidebarWidth)
  const [currentPhase, setCurrentPhase] = useState(initialState.currentPhase)
  const [completedPhases, setCompletedPhases] = useState(initialState.completedPhases)

  const completePhase = (phase: string) => {
    setCompletedPhases((prev) => {
      if (!prev.includes(phase)) {
        return [...prev, phase]
      }
      return prev
    })
    setCurrentPhase(null)
  }

  const resetWorkflow = () => {
    setCurrentPhase(null)
    setCompletedPhases([])
  }

  const contextValue: AppContextType = {
    sidebarWidth,
    currentPhase,
    completedPhases,
    setSidebarWidth,
    setCurrentPhase,
    completePhase,
    resetWorkflow,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

// Hook to use the app context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
