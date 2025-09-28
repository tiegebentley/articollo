// Chat and Message types
export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  type?: "text" | "audio"
  audioUrl?: string
  audioData?: string
  suggestions?: string[]
}

export interface ChatSession {
  id: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

// Component generation types
export interface ComponentGenerationRequest {
  message: string
  system?: string
  model?: string
}

export interface ComponentGenerationResponse {
  success: boolean
  demoUrl?: string
  aiMessage?: string
  error?: string
  generatedFiles?: GeneratedFile[]
}

export interface GeneratedFile {
  name: string
  content: string
  status: "generated" | "modified" | "unchanged"
  type: "component" | "page" | "api" | "config"
}

// UI Component types
export interface ResizableLayoutProps {
  defaultSidebarWidth?: number
  minSidebarWidth?: number
  maxSidebarWidth?: number
}

export interface PreviewPanelProps {
  previewUrl: string | null
  isLoading?: boolean
}

export interface SidebarProps {
  setPreviewUrl: (url: string | null) => void
  className?: string
}

// Model and Configuration types
export interface V0Model {
  id: string
  name: string
  description?: string
  isAvailable: boolean
}

export interface AppConfig {
  models: V0Model[]
  defaultModel: string
  features: {
    imageGeneration: boolean
    codeExport: boolean
    realTimePreview: boolean
  }
}

// V0 API types (oficial - compatibles con OpenAI)
export interface V0ApiMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface V0ApiRequest {
  model: string
  messages: V0ApiMessage[]
  stream?: boolean
  tools?: any[]
  tool_choice?: string | object
}

export interface V0ApiResponse {
  id: string
  object: string
  created: number
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
}

export interface V0StreamResponse {
  id: string
  object: string
  choices: Array<{
    delta: {
      role?: string
      content?: string
    }
    index: number
    finish_reason: string | null
  }>
}
