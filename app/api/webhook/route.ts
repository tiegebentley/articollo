import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Webhook API called")

    let body
    try {
      body = await request.json()
      console.log("[v0] Request body parsed:", {
        type: body.type,
        hasAudioData: !!body.audioData,
        country: body.country,
        language: body.language,
        message: body.message?.substring(0, 50) + (body.message?.length > 50 ? "..." : ""),
      })
    } catch (parseError) {
      console.error("[v0] JSON parsing error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minutes

    if (body.type === "voice" && body.audioData) {
      try {
        // Convert base64 audio to binary
        const base64Data = body.audioData.split(",")[1]
        if (!base64Data) {
          throw new Error("Invalid base64 audio data")
        }

        const audioBuffer = Buffer.from(base64Data, "base64")
        console.log("[v0] Audio buffer created, size:", audioBuffer.length)

        // Create FormData for multipart request
        const formData = new FormData()
        formData.append("type", "voice")
        formData.append("message", body.message || "")
        formData.append("timestamp", new Date().toISOString())
        if (body.country) formData.append("country", body.country)
        if (body.language) formData.append("language", body.language)
        formData.append("audio", new Blob([audioBuffer], { type: "audio/webm" }), "voice")

        console.log("[v0] Sending voice message to webhook with country:", body.country, "language:", body.language)
        const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://workflows.lustre-agency.com/webhook/articollo"
        const response = await fetch(webhookUrl, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Webhook response error:", response.status, errorText)
          throw new Error(`Webhook request failed: ${response.status} - ${errorText}`)
        }

        let data
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const textResponse = await response.text()
          data = { message: textResponse }
        }

        console.log("[v0] Voice webhook response:", data)
        return NextResponse.json({
          success: true,
          message: data.output || data.message || data.response || "Voice message sent",
          phase: data.phase,
          data: data,
        })
      } catch (audioError) {
        clearTimeout(timeoutId)

        if (audioError.name === "AbortError") {
          console.error("[v0] Webhook timeout after 5 minutes")
          return NextResponse.json(
            { success: false, error: "Request timed out after 5 minutes. Please try again." },
            { status: 408 },
          )
        }

        console.error("[v0] Audio processing error:", audioError)
        return NextResponse.json(
          { success: false, error: `Audio processing failed: ${audioError.message}` },
          { status: 500 },
        )
      }
    } else {
      if (!body.message || typeof body.message !== "string") {
        clearTimeout(timeoutId)
        return NextResponse.json({ success: false, error: "Message is required for text messages" }, { status: 400 })
      }

      const webhookPayload = {
        type: "text",
        message: body.message,
        timestamp: new Date().toISOString(),
        country: body.country || "Unknown",
        language: body.language || "Unknown",
      }

      console.log("[v0] Sending text message to webhook:", {
        type: webhookPayload.type,
        message: webhookPayload.message.substring(0, 50) + (webhookPayload.message.length > 50 ? "..." : ""),
        country: webhookPayload.country,
        language: webhookPayload.language,
      })

      const webhookUrl = process.env.N8N_WEBHOOK_URL || "https://workflows.lustre-agency.com/webhook/articollo"
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Webhook response error:", response.status, errorText)
        throw new Error(`Webhook request failed: ${response.status} - ${errorText}`)
      }

      let data
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const textResponse = await response.text()
        data = { message: textResponse }
      }

      console.log("[v0] Text webhook response:", data)

      let responseMessage = ""
      let suggestions: string[] = []

      if (data.output && typeof data.output === "object") {
        responseMessage = data.output.output || data.output.message || "Response received"
        suggestions = data.output.suggestions || []
      } else {
        responseMessage = data.output || data.message || data.response || "Response received"
      }

      return NextResponse.json({
        success: true,
        message: responseMessage,
        suggestions: suggestions,
        phase: data.phase,
        data: data,
      })
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[v0] Webhook timeout after 5 minutes")
      return NextResponse.json(
        { success: false, error: "Request timed out after 5 minutes. Please try again." },
        { status: 408 },
      )
    }

    console.error("[v0] Webhook API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      },
      { status: 500 },
    )
  }
}
