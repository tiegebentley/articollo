export interface WebhookResponse {
  success: boolean
  message?: string
  error?: string
  phase?: "research" | "creation" | "amplification"
  data?: any
}

export async function sendToWebhook(
  message: string,
  audioData?: string,
  country?: { name: string; code: string },
  language?: { name: string; code: string },
): Promise<WebhookResponse> {
  try {
    const response = await fetch("/api/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        audioData,
        type: audioData ? "voice" : "text",
        country: country?.name || "United States",
        language: language?.name || "English",
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Webhook error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    }
  }
}
