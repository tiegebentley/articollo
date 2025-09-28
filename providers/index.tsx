"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { AppProvider, useApp } from "./app-provider"
import { ChatProvider, useChat } from "./chat-provider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <AppProvider>
        <ChatProvider>{children}</ChatProvider>
      </AppProvider>
    </ThemeProvider>
  )
}

export { useApp, useChat };
