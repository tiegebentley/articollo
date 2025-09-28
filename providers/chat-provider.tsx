"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Message, ChatSession } from "@/types/types"
import { sendToWebhook } from "@/lib/webhook"

// Chat Context Types
interface ChatState {
  currentSession: ChatSession | null
  messages: Message[]
  isLoading: boolean
  error: string | null
}

interface ChatContextType extends ChatState {
  sendMessage: (
    content: string,
    audioData?: string,
    country?: { name: string; code: string },
    language?: { name: string; code: string },
  ) => Promise<void>
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

// Actions
type ChatAction =
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_SESSION"; payload: ChatSession }

// Initial state
const initialState: ChatState = {
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,
}

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.payload }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "CLEAR_MESSAGES":
      return { ...state, messages: [], error: null }
    case "SET_SESSION":
      return { ...state, currentSession: action.payload, messages: action.payload.messages }
    default:
      return state
  }
}

// Context
const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Provider
interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  const sendMessage = async (
    content: string,
    audioData?: string,
    country?: { name: string; code: string },
    language?: { name: string; code: string },
  ): Promise<void> => {
    if (!content.trim() && !audioData) return

    let audioUrl: string | undefined
    if (audioData) {
      // Convert base64 to blob URL for playback
      try {
        const base64Data = audioData.split(",")[1] // Remove data:audio/webm;base64, prefix
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: "audio/webm" })
        audioUrl = URL.createObjectURL(blob)
      } catch (error) {
        console.error("[v0] Error creating audio URL:", error)
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      type: audioData ? "audio" : "text",
      audioData: audioData,
      audioUrl: audioUrl,
    }

    dispatch({ type: "ADD_MESSAGE", payload: userMessage })
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    try {
      const webhookResponse = await sendToWebhook(content, audioData, country, language)

      if (webhookResponse.success && webhookResponse.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: webhookResponse.message,
          timestamp: new Date(),
          type: "text",
          suggestions: webhookResponse.suggestions || [],
        }
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage })
      } else {
        dispatch({ type: "SET_ERROR", payload: webhookResponse.error || "Failed to get response from Articollo" })
      }
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to send message to Articollo AI" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error })
  }

  const contextValue: ChatContextType = {
    ...state,
    sendMessage,
    clearMessages,
    setLoading,
    setError,
  }

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
}

// Hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
