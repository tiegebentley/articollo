"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "./chat-message"
import { Brain, FileText, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChat } from "@/providers"

export function ChatSidebar({ className }: { className?: string }) {
  const { messages, isLoading, sendMessage, error } = useChat()
  const [input, setInput] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const currentInput = input.trim()
    setInput("") // Clear input immediately to improve UX

    await sendMessage(currentInput)
  }

  return (
    <aside className={cn("flex h-full flex-col overflow-hidden rounded-lg bg-[rgba(15,15,15,1)]", className)}>
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-interactive-border px-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="h-auto p-1 text-text-primary hover:bg-interactive-hover">
            Chat with Articollo
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-text-primary">Welcome to Articollo AI</h3>
              <p className="text-text-secondary max-w-sm">
                Your AI research and content creation assistant. I'll help you through the complete process from
                research to amplification.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-interactive-border">
                <Brain className="w-5 h-5 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium text-text-primary">Research Phase</div>
                  <div className="text-xs text-text-secondary">Deep topic analysis & insights</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-interactive-border">
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium text-text-primary">Creation Phase</div>
                  <div className="text-xs text-text-secondary">Content writing & optimization</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-interactive-border">
                <Zap className="w-5 h-5 text-purple-500" />
                <div className="text-left">
                  <div className="font-medium text-text-primary">Amplification Phase</div>
                  <div className="text-xs text-text-secondary">Distribution & engagement</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
      </div>
    </aside>
  )
}
