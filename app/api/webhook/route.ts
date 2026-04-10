import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const maxDuration = 60 // Vercel function timeout limit

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
  }
  return new OpenAI({ apiKey })
}

// System prompt for Keywordo/Articollo
const SYSTEM_PROMPT = `You are Keywordo, an expert SEO and content strategy assistant built into Articollo.

Your mission is to help users:
- Find high-value keywords and content opportunities
- Analyze competitor strategies
- Discover low-competition keyword gems
- Build topical authority roadmaps
- Improve existing content
- Answer questions about their niche and target audience

Always provide:
1. Actionable insights and specific recommendations
2. Data-driven suggestions when possible
3. Clear next steps the user can take immediately

Response format:
- Use markdown formatting for clarity
- Include headings, bullet points, and tables where appropriate
- End responses with 2-3 suggested follow-up questions or actions as plain text lines starting with action verbs

Be concise, strategic, and helpful. Focus on practical SEO and content marketing advice.`

export async function POST(request: NextRequest) {
  try {
    console.log("[Articollo] Webhook API called")

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("[Articollo] Request parsed:", {
        type: body.type,
        hasAudioData: !!body.audioData,
        country: body.country,
        language: body.language,
        messagePreview: body.message?.substring(0, 50) + (body.message?.length > 50 ? "..." : ""),
      })
    } catch (parseError) {
      console.error("[Articollo] JSON parsing error:", parseError)
      return NextResponse.json(
        { success: false, error: "Invalid request format" },
        { status: 400 }
      )
    }

    // Validate OpenAI API key
    let openai: OpenAI
    try {
      openai = getOpenAIClient()
    } catch (error: any) {
      console.error("[Articollo] OpenAI initialization error:", error.message)
      return NextResponse.json(
        {
          success: false,
          error: "AI service is not configured. Please add OPENAI_API_KEY to environment variables."
        },
        { status: 500 }
      )
    }

    // Handle voice messages
    if (body.type === "voice" && body.audioData) {
      try {
        // Convert base64 audio to binary
        const base64Data = body.audioData.split(",")[1]
        if (!base64Data) {
          throw new Error("Invalid audio data format")
        }

        const audioBuffer = Buffer.from(base64Data, "base64")
        console.log("[Articollo] Audio buffer created, size:", audioBuffer.length)

        // Create a File object for OpenAI Whisper API
        const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" })

        // Transcribe audio using Whisper
        console.log("[Articollo] Transcribing audio with Whisper...")
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: body.language?.toLowerCase().substring(0, 2) || "en", // Use first 2 chars (e.g., "EN" -> "en")
        })

        const transcribedText = transcription.text
        console.log("[Articollo] Transcription:", transcribedText.substring(0, 100) + "...")

        // Now process the transcribed text with GPT
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Fast and cost-effective
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: transcribedText }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        })

        const aiResponse = completion.choices[0]?.message?.content || "I processed your voice message but couldn't generate a response."

        console.log("[Articollo] Voice message processed successfully")
        return NextResponse.json({
          success: true,
          message: aiResponse,
          transcription: transcribedText,
          data: {
            model: "gpt-4o-mini",
            type: "voice",
            country: body.country,
            language: body.language,
          }
        })

      } catch (audioError: any) {
        console.error("[Articollo] Audio processing error:", audioError)

        // Provide specific error messages
        if (audioError.message?.includes("API key")) {
          return NextResponse.json(
            { success: false, error: "Authentication failed. Please check API configuration." },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            success: false,
            error: "Unable to process voice message. Please try text instead."
          },
          { status: 500 }
        )
      }
    }

    // Handle text messages
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message text is required" },
        { status: 400 }
      )
    }

    try {
      console.log("[Articollo] Processing text message with GPT...")

      // Create context-aware prompt
      const userPrompt = body.message.trim()

      // Add country/language context if provided
      const contextPrompt = (body.country || body.language)
        ? `\n\n[User context: ${body.country || 'Unknown country'}, ${body.language || 'English'}]`
        : ''

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Fast and cost-effective
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const aiResponse = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try rephrasing your question."

      console.log("[Articollo] Text message processed successfully")

      // Extract suggestions from response (look for action-oriented sentences)
      const suggestions = extractSuggestions(aiResponse)

      return NextResponse.json({
        success: true,
        message: aiResponse,
        suggestions: suggestions,
        data: {
          model: "gpt-4o-mini",
          type: "text",
          country: body.country,
          language: body.language,
          tokens: completion.usage?.total_tokens || 0,
        }
      })

    } catch (textError: any) {
      console.error("[Articollo] Text processing error:", textError)

      // Handle rate limits
      if (textError.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please wait a moment and try again."
          },
          { status: 429 }
        )
      }

      // Handle authentication errors
      if (textError.status === 401 || textError.message?.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. Please check API configuration."
          },
          { status: 500 }
        )
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: "Unable to process your message. Please try again."
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("[Articollo] Unexpected error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    )
  }
}

/**
 * Extract suggested follow-up actions from AI response
 * Looks for action-oriented sentences at the end of the response
 */
function extractSuggestions(content: string): string[] {
  const suggestions: string[] = []

  // Split into lines and reverse to get last few lines
  const lines = content.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .reverse()

  // Look for action-oriented lines (starting with verbs)
  const actionVerbs = /^(Start|Create|Analyze|Research|Build|Write|Generate|Find|Explore|Review|Compare|Focus|Try|Use|Implement|Test|Check|Consider|Look|Ask|Learn|Study|Investigate)/i

  for (const line of lines) {
    if (suggestions.length >= 5) break

    // Skip if too long or too short
    if (line.length > 120 || line.length < 15) continue

    // Skip if it's a heading or list marker
    if (line.startsWith('#') || line.match(/^\d+\./)) continue

    // Check if starts with action verb
    if (actionVerbs.test(line)) {
      // Remove markdown and clean up
      const cleanLine = line
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[|\]/g, '')
        .trim()

      suggestions.unshift(cleanLine)
    }
  }

  return suggestions
}
