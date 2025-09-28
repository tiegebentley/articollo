"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChatStorage, type Chat } from "@/lib/chat-storage"
import { MessageSquare, Plus, Trash2, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatHistorySidebarProps {
  currentChatId: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  className?: string
}

export function ChatHistorySidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  className
}: ChatHistorySidebarProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const loadChats = () => {
    setChats(ChatStorage.getAllChats())
  }

  useEffect(() => {
    loadChats()

    // Listen for storage changes to sync across tabs
    const handleStorageChange = () => {
      loadChats()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Refresh chats when currentChatId changes (new chat created)
  useEffect(() => {
    loadChats()
  }, [currentChatId])

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteChat(chatId)
    loadChats()
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <Button
          onClick={() => {
            onNewChat()
            setIsOpen(false)
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-accent transition-colors",
                    currentChatId === chat.id && "bg-accent"
                  )}
                  onClick={() => {
                    onChatSelect(chat.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(chat.updatedAt)} • {chat.messages.length} messages
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 w-8 p-0"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            ChatStorage.clearAllChats()
            loadChats()
            onNewChat()
          }}
          className="w-full"
        >
          Clear All Chats
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:flex flex-col border-r bg-background", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            Chats
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}