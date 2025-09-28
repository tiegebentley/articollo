"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Mic, MicOff, Play, Pause, X, Copy, FileDown } from "lucide-react"
import { useChat } from "@/providers/chat-provider"
import { useVoiceRecording } from "@/hooks/use-voice-recording"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThemeToggle } from "@/components/ui/theme-toggle-new"
import { LanguageSelector } from "@/components/ui/language-selector"
import { CountrySelector } from "@/components/ui/country-selector"
import { SparklesText } from "@/components/ui/sparkles-text"
import { TextShimmer } from "@/components/ui/text-shimmer"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type?: "text" | "audio"
  audioUrl?: string
  suggestions?: string[]
}

export function MinimalChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [playingPreview, setPlayingPreview] = useState(false)
  const [isClosingPreview, setIsClosingPreview] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", code: "US" })
  const [selectedLanguage, setSelectedLanguage] = useState({ name: "English", code: "EN" })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)
  const { messages, sendMessage } = useChat()
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordingError,
  } = useVoiceRecording()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      console.log("[v0] Starting PDF generation for content length:", content.length)
      console.log("[v0] Full content preview:", content.substring(0, 500) + "...")

      // Create a temporary div to render the markdown with better styling
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

      // Add header with better styling
      const headerHTML = `
        <div style="margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px;">
          <h1 style="color: #333; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Articollo Response</h1>
          <p style="color: #666; margin: 0; font-size: 12px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
      `

      const htmlContent = content
        // First, preserve the original content by escaping HTML entities
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")

        // Handle tables with improved parsing - capture complete table blocks including multi-line content
        .replace(/(\|[^\n]*\|(?:\r?\n\|[^\n]*\|)*)/g, (match) => {
          console.log("[v0] Processing table match:", match.substring(0, 200) + "...")

          const lines = match
            .trim()
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && line.includes("|"))

          if (lines.length < 2) return match // Not a valid table

          console.log("[v0] Table lines:", lines.length)
          console.log("[v0] First few lines:", lines.slice(0, 3))

          // Find the separator line (contains only |, -, :, and spaces)
          let separatorIndex = -1
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].replace(/\s/g, "")
            if (/^\|[-:]+(\|[-:]+)*\|?$/.test(line)) {
              separatorIndex = i
              console.log("[v0] Found separator at line:", i, "->", lines[i])
              break
            }
          }

          if (separatorIndex === -1) {
            console.log("[v0] No separator found, treating first line as header")
            // If no separator found, treat first line as header and rest as data
            separatorIndex = 0
          }

          const headerLines = separatorIndex === 0 ? [lines[0]] : lines.slice(0, separatorIndex)
          const dataLines = separatorIndex === 0 ? lines.slice(1) : lines.slice(separatorIndex + 1)

          console.log("[v0] Header lines:", headerLines.length)
          console.log("[v0] Data lines:", dataLines.length)

          // Parse headers from the first header line
          const headers = headerLines[0]
            .split("|")
            .map((h) => h.trim())
            .filter((h) => h)

          console.log("[v0] Parsed headers:", headers)

          // Parse data rows
          const rows = dataLines
            .map((line) => {
              const cells = line.split("|").map((cell) => cell.trim())
              // Remove empty cells at start and end (from leading/trailing |)
              return cells.filter((cell, index) => {
                if (index === 0 && cell === "") return false
                if (index === cells.length - 1 && cell === "") return false
                return true
              })
            })
            .filter((row) => row.length > 0 && row.some((cell) => cell))

          console.log("[v0] Parsed rows:", rows.length)
          console.log("[v0] Sample row:", rows[0])

          if (headers.length === 0 || rows.length === 0) {
            console.log("[v0] Invalid table structure, returning original")
            return match
          }

          const headerHTML = headers
            .map(
              (h) =>
                `<th style="background: #f8f9fa; font-weight: bold; padding: 12px; border: 1px solid #dee2e6; text-align: left; font-size: 13px; word-wrap: break-word; max-width: 150px;">${h}</th>`,
            )
            .join("")

          const bodyHTML = rows
            .map((row) => {
              // Ensure row doesn't exceed header count and pad if necessary
              const paddedRow = [...row]
              while (paddedRow.length < headers.length) {
                paddedRow.push("")
              }

              return `<tr>${paddedRow
                .slice(0, headers.length)
                .map(
                  (cell) =>
                    `<td style="padding: 12px; border: 1px solid #dee2e6; font-size: 13px; vertical-align: top; word-wrap: break-word; max-width: 150px; overflow-wrap: break-word;">${cell}</td>`,
                )
                .join("")}</tr>`
            })
            .join("")

          const tableHTML = `<div style="margin: 20px 0; overflow-x: auto; page-break-inside: avoid;">
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #dee2e6; font-size: 13px; table-layout: fixed;">
              <thead><tr>${headerHTML}</tr></thead>
              <tbody>${bodyHTML}</tbody>
            </table>
          </div>`

          console.log("[v0] Generated table HTML length:", tableHTML.length)
          return tableHTML
        })

        // Headers with better spacing
        .replace(
          /^### (.*$)/gm,
          '<h3 style="color: #333; margin: 20px 0 12px 0; font-size: 18px; font-weight: bold; page-break-after: avoid;">$1</h3>',
        )
        .replace(
          /^## (.*$)/gm,
          '<h2 style="color: #333; margin: 24px 0 16px 0; font-size: 20px; font-weight: bold; page-break-after: avoid;">$1</h2>',
        )
        .replace(
          /^# (.*$)/gm,
          '<h1 style="color: #333; margin: 28px 0 20px 0; font-size: 22px; font-weight: bold; page-break-after: avoid;">$1</h1>',
        )

        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')

        // Code blocks
        .replace(/```([\s\S]*?)```/g, (match, code) => {
          return `<pre style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 16px 0; font-family: 'Courier New', monospace; font-size: 12px; overflow-x: auto; border: 1px solid #e9ecef; white-space: pre-wrap; word-wrap: break-word;">${code.trim()}</pre>`
        })

        // Inline code
        .replace(
          /`([^`]+)`/g,
          "<code style=\"background: #f8f9fa; padding: 3px 6px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 12px; border: 1px solid #e9ecef;\">$1</code>",
        )

        // Lists
        .replace(/^\* (.*$)/gm, '<li style="margin: 6px 0; line-height: 1.6;">$1</li>')
        .replace(
          /(<li.*?<\/li>\s*)+/g,
          '<ul style="margin: 12px 0; padding-left: 24px; list-style-type: disc;">$&</ul>',
        )

        // Convert line breaks to paragraphs - improved handling
        .split("\n\n")
        .map((paragraph) => {
          if (
            paragraph.trim() &&
            !paragraph.includes("<table") &&
            !paragraph.includes("<h1") &&
            !paragraph.includes("<h2") &&
            !paragraph.includes("<h3") &&
            !paragraph.includes("<ul") &&
            !paragraph.includes("<pre")
          ) {
            return `<p style="margin: 12px 0; line-height: 1.8; text-align: justify;">${paragraph.replace(/\n/g, "<br>")}</p>`
          }
          return paragraph
        })
        .join("")

      console.log("[v0] HTML content length:", htmlContent.length)
      console.log("[v0] HTML preview:", htmlContent.substring(0, 500) + "...")

      // Set the complete HTML content
      tempDiv.innerHTML = headerHTML + htmlContent

      document.body.appendChild(tempDiv)

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 200))

      console.log("[v0] Temp div final dimensions:", {
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        scrollHeight: tempDiv.scrollHeight,
        scrollWidth: tempDiv.scrollWidth,
      })

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        height: tempDiv.scrollHeight,
        width: tempDiv.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure all content is visible in the cloned document
          const clonedDiv = clonedDoc.querySelector("div")
          if (clonedDiv) {
            clonedDiv.style.height = "auto"
            clonedDiv.style.maxHeight = "none"
            clonedDiv.style.overflow = "visible"
          }
        },
      })

      console.log("[v0] Canvas final dimensions:", {
        width: canvas.width,
        height: canvas.height,
      })

      // Remove temp div
      document.body.removeChild(tempDiv)

      const pdf = new jsPDF("p", "mm", "a4")
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const totalPages = Math.ceil(imgHeight / pageHeight)

      console.log("[v0] PDF generation details:", {
        imgWidth,
        imgHeight,
        pageHeight,
        totalPages,
        canvasRatio: canvas.height / canvas.width,
      })

      // Add pages with proper positioning
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()

        const yPosition = -(i * pageHeight)
        pdf.addImage(canvas.toDataURL("image/png", 1.0), "PNG", 0, yPosition, imgWidth, imgHeight)
      }

      pdf.save(`articollo-response-${messageId.slice(0, 8)}.pdf`)
      console.log("[v0] PDF generated successfully with", totalPages, "pages")
    } catch (error) {
      console.error("[v0] PDF generation failed:", error)

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      let yPosition = 30

      // Header
      pdf.setFontSize(16)
      pdf.text("Articollo Response", margin, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition)
      yPosition += 20

      // Content
      pdf.setFontSize(12)
      const lines = pdf.splitTextToSize(content, maxWidth)

      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(lines[i], margin, yPosition)
        yPosition += 6
      }

      pdf.save(`articollo-response-${messageId.slice(0, 8)}.pdf`)
      console.log("[v0] Fallback PDF generated")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      await sendMessage(userMessage, undefined, selectedCountry, selectedLanguage)
    } catch (error) {
      console.error("Failed to send message:", error)
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

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        try {
          await sendMessage("[Voice Message]", base64Audio, selectedCountry, selectedLanguage)
        } catch (error) {
          console.error("Failed to send voice message:", error)
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

    // First, try to find [SUGGESTION] tags
    while ((match = suggestionRegex.exec(content)) !== null) {
      suggestions.push(match[1].trim())
    }

    // If no [SUGGESTION] tags found, try to parse plain text suggestions
    if (suggestions.length === 0) {
      // Split content into lines and look for potential suggestions at the end
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)

      // Look for the last few lines that could be suggestions
      // Suggestions are typically short, actionable statements
      const potentialSuggestions = []
      for (let i = lines.length - 1; i >= 0 && potentialSuggestions.length < 5; i--) {
        const line = lines[i]

        // Skip if line is too long (likely part of main content) or too short
        if (line.length > 150 || line.length < 10) continue

        // Skip if line contains typical content indicators
        if (line.includes("?") && line.length > 100) continue
        if (line.includes(".") && line.endsWith(".") && line.length > 100) continue

        // Check if line looks like a suggestion (actionable, starts with verb, etc.)
        if (
          line.match(
            /^(Start|Create|Analyze|Research|Build|Write|Generate|Find|Explore|Review|Compare|Focus|Let|Can|What|How|Why|I)/i,
          ) ||
          line.includes("for ") ||
          line.includes("about ") ||
          line.includes("with ")
        ) {
          potentialSuggestions.unshift(line)
        }
      }

      // If we found potential suggestions, use them
      if (potentialSuggestions.length > 0) {
        suggestions.push(...potentialSuggestions)

        // Remove these suggestions from the main content
        const suggestionLines = new Set(potentialSuggestions)
        const contentLines = content.split("\n")
        const filteredLines = contentLines.filter((line) => !suggestionLines.has(line.trim()))
        cleanContent = filteredLines.join("\n").trim()
      }
    } else {
      // Remove [SUGGESTION] tags from content
      cleanContent = content.replace(/\[SUGGESTION\]\s*[^\n\r]+/g, "").trim()
    }

    console.log("[v0] Original content length:", content.length)
    console.log("[v0] Clean content length:", cleanContent.length)
    console.log("[v0] Found suggestions:", suggestions.length)
    console.log("[v0] Suggestions:", suggestions)
    console.log("[v0] Content preview:", cleanContent.substring(0, 200) + "...")

    return { cleanContent, suggestions }
  }

  return (
    <div className="flex h-full flex-col relative">
      <audio ref={audioRef} onEnded={() => setPlayingAudio(null)} onPause={() => setPlayingAudio(null)} />
      <audio ref={previewAudioRef} onEnded={() => setPlayingPreview(false)} onPause={() => setPlayingPreview(false)} />

      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesText
              text="Articollo"
              className="text-lg sm:text-xl font-bold text-foreground font-serif"
              sparklesCount={8}
              colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
            />
            <div className="hidden sm:block"></div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <CountrySelector onSelectionChange={setSelectedCountry} />
            <LanguageSelector onSelectionChange={setSelectedLanguage} />
            <ThemeToggle />
          </div>
        </div>
      </div>

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
            const { cleanContent, suggestions } =
              message.role === "assistant"
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
                    {message.type === "audio" && message.audioUrl ? (
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAudioPlayback(message.audioUrl!, message.id)}
                          className="h-8 w-8 p-0"
                        >
                          {playingAudio === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <span className="text-sm">Voice Message</span>
                      </div>
                    ) : message.role === "assistant" ? (
                      <>
                        {console.log(
                          "[v0] Rendering markdown for message:",
                          message.id,
                          "Content length:",
                          cleanContent.length,
                        )}
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
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary pl-3 sm:pl-4 py-2 sm:py-2 my-3 sm:my-4 bg-muted/30 rounded-r-lg italic text-foreground">
                                {children}
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">{children}</strong>
                            ),
                            em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside space-y-1 sm:space-y-2 my-3 sm:my-4 pl-5 sm:pl-6">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside space-y-1 sm:space-y-2 my-3 sm:my-4 pl-5 sm:pl-6">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className="text-foreground leading-relaxed pl-1">{children}</li>,
                            code: ({ children }) => (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-foreground">
                                {children}
                              </code>
                            ),
                            pre: ({ children }) => (
                              <pre className="bg-muted p-3 sm:p-4 rounded-lg overflow-x-auto my-3 sm:my-4 text-xs sm:text-sm font-mono text-foreground border border-border">
                                {children}
                              </pre>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 sm:mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>
                            ),
                            hr: () => <hr className="my-4 sm:my-6 border-border" />,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 sm:my-4">
                                <table className="min-w-full border-collapse border border-border rounded-lg">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                            tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                            tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
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
                                  style={{
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    hyphens: "auto",
                                    maxWidth: "calc(100% - 0.375rem)", // Account for gap
                                    minWidth: "0", // Allow shrinking
                                    flex: "0 1 auto", // Allow flexible sizing
                                  }}
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
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {message.role === "assistant" && message.type !== "audio" && (
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

      <div className="h-4 sm:h-0" />
    </div>
  )
}
