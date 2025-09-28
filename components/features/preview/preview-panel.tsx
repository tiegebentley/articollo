"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, RefreshCw, ExternalLink, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp, useChat } from "@/providers"

interface PreviewPanelProps {
  className?: string
}

const DefaultContent = () => (
  <div className="flex h-full items-center justify-center p-8 text-center bg-[rgba(10,10,10,1)]">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
        A
      </div>
      <h2 className="text-xl font-medium text-gray-500">Preview</h2>
    </div>
  </div>
)

const ErrorContent = ({ error }: { error: string }) => (
  <div className="flex h-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-full bg-red-100 p-4">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Error Generating Component</h2>
      <p className="text-gray-600 max-w-md">{error}</p>
      <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
        Retry
      </Button>
    </div>
  </div>
)

const LoadingWithStatus = () => (
  <div className="flex h-full w-full items-center justify-center bg-primary-background">
    <div className="w-full max-w-xl space-y-4 p-4">
      <div className="flex items-center space-x-3 font-medium text-text-secondary">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <span>Generating component...</span>
      </div>
      <p className="text-sm text-text-muted">This may take a few moments.</p>
    </div>
  </div>
)

export function PreviewPanel({ className }: { className?: string }) {
  const { previewUrl, isGenerating: isLoading } = useApp()
  const { error } = useChat()
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  const isError = !!error
  const errorMessage = error

  // Sync local state with global state
  useEffect(() => {
    if (previewUrl && previewUrl !== localPreviewUrl) {
      // Small delay to ensure proper rendering in v0
      const timer = setTimeout(() => {
        setLocalPreviewUrl(previewUrl)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [previewUrl, localPreviewUrl])

  const handleIframeLoad = () => {}
  const handleIframeError = () => {}

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-12 items-center gap-4 border-b border-gray-800 px-4 shadow-sm bg-[rgba(15,15,15,1)]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={!localPreviewUrl}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" disabled={!localPreviewUrl}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400"
            disabled={!localPreviewUrl}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1">
          <Input
            type="text"
            value={localPreviewUrl || "v0.dev/preview"}
            className="h-8 w-full border-gray-300 text-sm rounded-full bg-[rgba(39,40,45,1)] border-none"
            readOnly
          />
        </div>

        <div className="flex items-center gap-2">
          {localPreviewUrl && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/5"
                onClick={() => window.open(localPreviewUrl, "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5" title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white overflow-hidden">
        {isLoading ? (
          <LoadingWithStatus />
        ) : isError ? (
          <ErrorContent error={errorMessage || "Unknown error"} />
        ) : localPreviewUrl ? (
          <div className="relative h-full w-full">
            <iframe
              key={localPreviewUrl} // Force re-render when URL changes
              src={localPreviewUrl}
              className="h-full w-full border-0"
              title="v0 Component Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              loading="eager"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          </div>
        ) : (
          <DefaultContent />
        )}
      </div>
    </div>
  )
}
