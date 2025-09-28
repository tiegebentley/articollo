export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = "articollo-chats"
const CURRENT_CHAT_KEY = "articollo-current-chat"

export class ChatStorage {
  static getAllChats(): Chat[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static getChat(id: string): Chat | undefined {
    const chats = this.getAllChats()
    return chats.find(chat => chat.id === id)
  }

  static saveChat(chat: Chat): void {
    const chats = this.getAllChats()
    const existingIndex = chats.findIndex(c => c.id === chat.id)

    if (existingIndex !== -1) {
      chats[existingIndex] = chat
    } else {
      chats.unshift(chat)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  }

  static deleteChat(id: string): void {
    const chats = this.getAllChats()
    const filtered = chats.filter(chat => chat.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    // If we deleted the current chat, clear it
    if (this.getCurrentChatId() === id) {
      this.setCurrentChatId("")
    }
  }

  static createNewChat(): Chat {
    return {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  static generateChatTitle(messages: Message[]): string {
    if (messages.length === 0) return "New Chat"

    // Use first user message as title (truncated)
    const firstUserMessage = messages.find(m => m.role === "user")
    if (!firstUserMessage) return "New Chat"

    const title = firstUserMessage.content
    return title.length > 50 ? title.substring(0, 50) + "..." : title
  }

  static getCurrentChatId(): string {
    if (typeof window === "undefined") return ""
    return localStorage.getItem(CURRENT_CHAT_KEY) || ""
  }

  static setCurrentChatId(id: string): void {
    if (typeof window === "undefined") return
    localStorage.setItem(CURRENT_CHAT_KEY, id)
  }

  static clearAllChats(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_CHAT_KEY)
  }
}