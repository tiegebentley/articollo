"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Mic, MicOff, Play, Pause, X, Copy, FileDown, Plus } from "lucide-react"
import { useVoiceRecording } from "@/hooks/use-voice-recording"
import { sendToWebhook } from "@/lib/webhook"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThemeToggle } from "@/components/ui/theme-toggle-new"
import { LanguageSelector } from "@/components/ui/language-selector"
import { CountrySelector } from "@/components/ui/country-selector"
import { SparklesText } from "@/components/ui/sparkles-text"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { ChatHistorySidebar } from "./chat-history-sidebar"
import { ChatStorage, type Chat, type Message } from "@/lib/chat-storage"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export function EnhancedChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [playingPreview, setPlayingPreview] = useState(false)
  const [isClosingPreview, setIsClosingPreview] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", code: "US" })
  const [selectedLanguage, setSelectedLanguage] = useState({ name: "English", code: "EN" })

  // Chat management state
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)

  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordingError,
  } = useVoiceRecording()

  // Initialize chat on mount
  useEffect(() => {
    const currentChatId = ChatStorage.getCurrentChatId()
    if (currentChatId) {
      const existingChat = ChatStorage.getChat(currentChatId)
      if (existingChat) {
        setCurrentChat(existingChat)
        setMessages(existingChat.messages)
      } else {
        // Chat was deleted, start new
        startNewChat()
      }
    } else {
      startNewChat()
    }
  }, [])

  const startNewChat = () => {
    const newChat = ChatStorage.createNewChat()
    setCurrentChat(newChat)
    setMessages([])
    ChatStorage.setCurrentChatId(newChat.id)
    ChatStorage.saveChat(newChat)
  }

  const loadChat = (chatId: string) => {
    const chat = ChatStorage.getChat(chatId)
    if (chat) {
      setCurrentChat(chat)
      setMessages(chat.messages)
      ChatStorage.setCurrentChatId(chatId)
    }
  }

  const deleteChat = (chatId: string) => {
    ChatStorage.deleteChat(chatId)
    if (currentChat?.id === chatId) {
      startNewChat()
    }
  }

  const saveCurrentChat = () => {
    if (!currentChat) return

    const updatedChat: Chat = {
      ...currentChat,
      messages,
      updatedAt: Date.now(),
      title: messages.length > 0 ? ChatStorage.generateChatTitle(messages) : "New Chat"
    }

    setCurrentChat(updatedChat)
    ChatStorage.saveChat(updatedChat)
  }

  // Save chat whenever messages change
  useEffect(() => {
    if (currentChat && messages.length > 0) {
      saveCurrentChat()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (content: string, role: "user" | "assistant", audioUrl?: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessage(messageId)
      setTimeout(() => setCopiedMessage(null), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const downloadAsPDF = async (content: string, messageId: string) => {
    try {
      const tempDiv = document.createElement("div")
      tempDiv.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        padding: 40px;
        background-color: white;
        color: black;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        overflow: visible;
        word-wrap: break-word;
        white-space: normal;
      `

      const headerHTML = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Articollo Response</h1>
          <p style="color: #666; margin: 0; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      `

      const htmlContent = content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/^### (.*$)/gm, '<h3 style="color: #333; margin: 20px 0 12px 0; font-size: 18px; font-weight: bold;">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 style="color: #333; margin: 24px 0 16px 0; font-size: 20px; font-weight: bold;">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 style="color: #333; margin: 28px 0 20px 0; font-size: 22px; font-weight: bold;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
        .replace(/```([\s\S]*?)```/g, '<pre style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0; font-family: monospace; font-size: 12px;">$1</pre>')
        .replace(/`([^`]+)`/g, '<code style="background: #f8f9fa; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;">$1</code>')
        .replace(/^\* (.*$)/gm, '<li style="margin: 6px 0;">$1</li>')
        .replace(/(<li.*?<\/li>\s*)+/g, '<ul style="margin: 12px 0; padding-left: 24px;">$&</ul>')
        .split("\n\n")
        .map(paragraph => {
          if (paragraph.trim() && !paragraph.includes("<") && !paragraph.includes("</")) {
            return `<p style="margin: 12px 0; line-height: 1.8;">${paragraph.replace(/\n/g, "<br>")}</p>`
          }
          return paragraph
        })
        .join("")

      tempDiv.innerHTML = headerHTML + htmlContent
      document.body.appendChild(tempDiv)

      await new Promise(resolve => setTimeout(resolve, 200))

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      })

      document.body.removeChild(tempDiv)

      const pdf = new jsPDF("p", "mm", "a4")
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const totalPages = Math.ceil(imgHeight / pageHeight)

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        const yPosition = -(i * pageHeight)
        pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, yPosition, imgWidth, imgHeight)
      }

      pdf.save(`articollo-response-${messageId.slice(0, 8)}.pdf`)
    } catch (error) {
      console.error("PDF generation failed:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    addMessage(userMessage, "user")
    setIsLoading(true)

    try {
      const response = await sendToWebhook(userMessage, undefined, selectedCountry, selectedLanguage)

      if (response.success && response.message) {
        addMessage(response.message, "assistant")
      } else {
        addMessage(response.error || "Failed to get response", "assistant")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      addMessage("Sorry, I encountered an error. Please try again.", "assistant")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVoiceMessage = async () => {
    if (!audioBlob || isLoading) return

    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      setPlayingPreview(false)
    }

    setIsClosingPreview(true)
    setTimeout(() => {
      clearRecording()
      setIsClosingPreview(false)
    }, 300)

    addMessage("[Voice Message]", "user")
    setIsLoading(true)

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        try {
          const response = await sendToWebhook("[Voice Message]", base64Audio, selectedCountry, selectedLanguage)

          if (response.success && response.message) {
            addMessage(response.message, "assistant")
          } else {
            addMessage(response.error || "Failed to process voice message", "assistant")
          }
        } catch (error) {
          console.error("Failed to send voice message:", error)
          addMessage("Sorry, I encountered an error processing your voice message.", "assistant")
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("Failed to send voice message:", error)
      setIsLoading(false)
    }
  }

  const toggleAudioPlayback = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setPlayingAudio(messageId)
      }
    }
  }

  const togglePreviewPlayback = () => {
    if (!audioBlob || !previewAudioRef.current) return

    if (playingPreview) {
      previewAudioRef.current.pause()
      setPlayingPreview(false)
    } else {
      const audioUrl = URL.createObjectURL(audioBlob)
      previewAudioRef.current.src = audioUrl
      previewAudioRef.current.play()
      setPlayingPreview(true)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const parseInlineSuggestions = (content: string) => {
    const suggestionRegex = /\[SUGGESTION\]\s*([^\n\r]+)/g
    const suggestions: string[] = []
    let match
    let cleanContent = content

    while ((match = suggestionRegex.exec(content)) !== null) {
      suggestions.push(match[1].trim())
    }

    if (suggestions.length === 0) {
      const lines = content.split("\n").map(line => line.trim()).filter(line => line)
      const potentialSuggestions = []

      for (let i = lines.length - 1; i >= 0 && potentialSuggestions.length < 5; i--) {
        const line = lines[i]
        if (line.length > 150 || line.length < 10) continue
        if (line.includes("?") && line.length > 100) continue
        if (line.includes(".") && line.endsWith(".") && line.length > 100) continue

        if (line.match(/^(Start|Create|Analyze|Research|Build|Write|Generate|Find|Explore|Review|Compare|Focus|Let|Can|What|How|Why|I)/i) ||
            line.includes("for ") || line.includes("about ") || line.includes("with ")) {
          potentialSuggestions.unshift(line)
        }
      }

      if (potentialSuggestions.length > 0) {
        suggestions.push(...potentialSuggestions)
        const suggestionLines = new Set(potentialSuggestions)
        const contentLines = content.split("\n")
        const filteredLines = contentLines.filter(line => !suggestionLines.has(line.trim()))
        cleanContent = filteredLines.join("\n").trim()
      }
    } else {
      cleanContent = content.replace(/\[SUGGESTION\]\s*[^\n\r]+/g, "").trim()
    }

    return { cleanContent, suggestions }
  }

  return (
    <div className="flex h-full bg-background">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} onPause={() => setPlayingAudio(null)} />
      <audio ref={previewAudioRef} onEnded={() => setPlayingPreview(false)} onPause={() => setPlayingPreview(false)} />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        currentChatId={currentChat?.id || ""}
        onChatSelect={loadChat}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
        className="w-80"
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={startNewChat}
                variant="ghost"
                size="sm"
                className="gap-2 lg:hidden"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              <SparklesText
                text="Articollo"
                className="text-lg sm:text-xl font-bold text-foreground font-serif"
                sparklesCount={8}
                colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
              />
              {currentChat && messages.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  • {currentChat.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <CountrySelector onSelectionChange={setSelectedCountry} />
              <LanguageSelector onSelectionChange={setSelectedLanguage} />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
            {messages.length === 0 && (
              <div className="flex gap-3 sm:gap-4 justify-start mb-6">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                  <AvatarImage
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Key-kun-4EQxThzfkXrIdn9AwfGxLG9bHrkAGU.png"
                    alt="Key-kun - Your AI Assistant"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                    K
                  </AvatarFallback>
                </Avatar>

                <div className="bg-card text-card-foreground border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 max-w-[85%] sm:max-w-[80%]">
                  <h2 className="font-serif text-base sm:text-xl font-bold text-foreground mb-1 sm:mb-2">
                    Hi, I'm Keywordo!
                  </h2>
                  <p className="text-muted-foreground text-xs sm:text-base mb-4 sm:mb-6">
                    I'm here to help you turn powerful insights into top-ranking content.
                    <br />
                    What are we working on today?
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                    {[
                      "Find questions people ask about my topic",
                      "Spy on a competitor's top keywords",
                      "Discover hidden low-competition gems",
                      "Analyze and improve my existing content",
                      "Find my perfect content niche",
                      "Build a topical authority roadmap",
                    ].map((buttonText, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => setInput(buttonText)}
                        className="h-auto py-2 px-3 sm:py-3 sm:px-4 text-left hover:bg-accent hover:text-accent-foreground transition-colors border border-gray-300 dark:border-gray-600 hover:border-primary/50 rounded-lg text-xs sm:text-sm leading-relaxed whitespace-normal break-words min-h-[44px] sm:min-h-[52px]"
                        disabled={isLoading}
                      >
                        <span className="font-medium leading-relaxed block w-full text-left">{buttonText}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const messageDate = new Date(message.timestamp)
              const { cleanContent, suggestions } = message.role === "assistant"
                ? parseInlineSuggestions(message.content)
                : { cleanContent: message.content, suggestions: [] }

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                      <AvatarImage
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Key-kun-4EQxThzfkXrIdn9AwfGxLG9bHrkAGU.png"
                        alt="Key-kun - Your AI Assistant"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                        K
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col max-w-[85%] sm:max-w-[80%]">
                    <div
                      className={`rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground border border-border"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="text-sm sm:text-base leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-table:text-foreground"
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-lg sm:text-2xl font-bold text-foreground mb-3 sm:mb-4 mt-4 sm:mt-6 first:mt-0">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base sm:text-xl font-bold text-foreground mb-2 sm:mb-3 mt-3 sm:mt-5 first:mt-0">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm sm:text-lg font-bold text-foreground mb-2 sm:mb-2 mt-2 sm:mt-4 first:mt-0">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 sm:mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-3 sm:my-4">
                                  <table className="min-w-full border-collapse border border-border rounded-lg">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm font-semibold text-foreground bg-muted/30">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-foreground">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {cleanContent}
                          </ReactMarkdown>

                          {suggestions.length > 0 && (
                            <div className="w-full mt-3 pt-3 border-t border-border/30">
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full overflow-hidden">
                                {suggestions.map((suggestion, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="h-auto min-h-[28px] px-2 sm:px-3 py-1.5 text-xs leading-tight hover:bg-muted hover:text-foreground transition-colors shadow-sm break-words whitespace-normal text-left"
                                    disabled={isLoading}
                                  >
                                    {suggestion}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">
                          {messageDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {message.role === "assistant" && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(cleanContent, message.id)}
                              className="h-6 px-2 text-xs hover:bg-muted hover:text-foreground transition-colors opacity-70 hover:opacity-100"
                              title="Copy message"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadAsPDF(cleanContent, message.id)}
                              className="h-6 px-2 text-xs hover:bg-muted hover:text-foreground transition-colors opacity-70 hover:opacity-100"
                              title="Download as PDF"
                            >
                              <FileDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                      <AvatarFallback className="text-primary-foreground bg-slate-300">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-3 sm:gap-4 justify-start">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                  <AvatarImage
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Key-kun-4EQxThzfkXrIdn9AwfGxLG9bHrkAGU.png"
                    alt="Key-kun - Your AI Assistant"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-bold">
                    K
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card text-card-foreground border border-border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                  <TextShimmer className="text-xs sm:text-sm text-muted-foreground" duration={1.5} spread={1.5}>
                    Articollo is thinking...
                  </TextShimmer>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card px-4 sm:px-6 py-3 sm:py-4 pb-6 sm:pb-4">
          <div className="mx-auto max-w-4xl">
            {audioBlob && (
              <div
                className={`mb-3 sm:mb-4 p-3 bg-muted rounded-xl flex items-center justify-between transition-all duration-300 ease-out ${
                  isClosingPreview ? "opacity-0 scale-95 -translate-y-2" : "opacity-100 scale-100 translate-y-0"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Mic className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Voice message recorded</span>
                  <Button size="sm" variant="ghost" onClick={togglePreviewPlayback} className="h-8 w-8 p-0">
                    {playingPreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSendVoiceMessage} disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearRecording}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {recordingError && (
              <div className="mb-3 sm:mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
                {recordingError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex gap-2 sm:gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="flex-1 bg-input border-border focus:ring-primary rounded-xl h-11 sm:h-12 text-sm sm:text-base px-4"
                  disabled={isLoading || isRecording}
                />

                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  variant={isRecording ? "destructive" : "outline"}
                  className={`h-11 sm:h-12 w-11 sm:w-12 rounded-xl ${isRecording ? "animate-pulse" : ""}`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading || isRecording}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground h-11 sm:h-12 w-11 sm:w-12 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}