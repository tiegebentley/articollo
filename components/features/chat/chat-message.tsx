import { Brain, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"

interface ChatMessageProps {
  message: Message
  className?: string
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-interactive-active flex items-center justify-center">
            <User className="w-4 h-4 text-text-primary" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{isUser ? "You" : "Articollo"}</span>
          {message.timestamp && (
            <time className="text-xs text-text-muted">{new Date(message.timestamp).toLocaleTimeString()}</time>
          )}
        </div>
        <div className="prose prose-sm max-w-none text-text-primary">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  )
}
