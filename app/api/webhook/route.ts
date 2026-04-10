import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getKeywordIdeas, formatCompetition, formatDifficulty } from "@/lib/dataforseo"

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

IMPORTANT: When users ask about keywords, search volume, competition, or keyword research:
1. Extract the main topic/keyword from their question
2. Respond with: [KEYWORD_RESEARCH: topic_here]
3. The system will automatically fetch real keyword data and display it in a table
4. Then provide strategic advice on how to use those keywords

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
          language: body.language?.toLowerCase().substring(0, 2) || "en",
        })

        const transcribedText = transcription.text
        console.log("[Articollo] Transcription:", transcribedText.substring(0, 100) + "...")

        // Process the transcribed text with keyword detection
        const result = await processMessageWithKeywords(
          openai,
          transcribedText,
          body.country,
          body.language
        )

        console.log("[Articollo] Voice message processed successfully")
        return NextResponse.json({
          success: true,
          message: result.message,
          keywordData: result.keywordData,
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

      // Process message with keyword detection
      const result = await processMessageWithKeywords(
        openai,
        body.message.trim(),
        body.country,
        body.language
      )

      console.log("[Articollo] Text message processed successfully")

      // Extract suggestions from response
      const suggestions = extractSuggestions(result.message)

      return NextResponse.json({
        success: true,
        message: result.message,
        suggestions: suggestions,
        keywordData: result.keywordData,
        data: {
          model: "gpt-4o-mini",
          type: "text",
          country: body.country,
          language: body.language,
        }
      })

    } catch (textError: any) {
      console.error("[Articollo] Text processing error:", textError)

      if (textError.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please wait a moment and try again."
          },
          { status: 429 }
        )
      }

      if (textError.status === 401 || textError.message?.includes("API key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication failed. Please check API configuration."
          },
          { status: 500 }
        )
      }

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
 * Process message and detect if keyword research is needed
 */
async function processMessageWithKeywords(
  openai: OpenAI,
  userPrompt: string,
  country?: string,
  language?: string
) {
  const contextPrompt = (country || language)
    ? `\n\n[User context: ${country || 'Unknown country'}, ${language || 'English'}]`
    : ''

  // Check if message is asking about keywords
  const isKeywordQuestion = detectKeywordIntent(userPrompt)

  let keywordData = null
  let aiResponse = ""

  if (isKeywordQuestion) {
    console.log("[Articollo] Keyword intent detected, fetching real data...")

    // Extract seed keyword from user's message
    const seedKeyword = extractSeedKeyword(userPrompt)
    const keywordCount = extractKeywordCount(userPrompt)

    try {
      // Fetch real keyword data from DataForSEO
      const result = await getKeywordIdeas(
        seedKeyword,
        country || "United States",
        language || "en",
        keywordCount // Use requested count (default 30, max 100)
      )

      keywordData = result.keywords

      // Format keyword data for AI context
      const keywordContext = formatKeywordDataForAI(result.keywords)

      // Ask AI to analyze the keyword data
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `${userPrompt}${contextPrompt}\n\n[KEYWORD DATA AVAILABLE]\nI have real keyword data for "${seedKeyword}":\n${keywordContext}\n\nProvide strategic insights on how to use these keywords effectively. Focus on the high-value opportunities.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      aiResponse = completion.choices[0]?.message?.content || "Here are the keyword metrics I found."

    } catch (keywordError) {
      console.error("[Articollo] Keyword data fetch failed:", keywordError)

      // Fall back to AI-only response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt + contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      aiResponse = completion.choices[0]?.message?.content || "I couldn't fetch keyword data at this time, but here's my advice..."
    }

  } else {
    // Regular message without keyword research
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt + contextPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    aiResponse = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try rephrasing your question."
  }

  return {
    message: aiResponse,
    keywordData: keywordData,
  }
}

/**
 * Detect if user is asking about keywords
 */
function detectKeywordIntent(message: string): boolean {
  const lowerMessage = message.toLowerCase()

  const keywordTriggers = [
    "keyword",
    "search volume",
    "find keywords",
    "keyword ideas",
    "keyword research",
    "what keywords",
    "best keywords",
    "keywords for",
    "search terms",
    "seo keywords",
    "cpc",
    "competition",
    "keyword difficulty",
    "rank for",
    "search traffic",
  ]

  return keywordTriggers.some(trigger => lowerMessage.includes(trigger))
}

/**
 * Extract requested keyword count from user message
 */
function extractKeywordCount(message: string): number {
  const countMatch = message.match(/(\d+)\s*keywords/i)
  if (countMatch) {
    const count = parseInt(countMatch[1], 10)
    // Cap at 100 to avoid excessive API costs
    return Math.min(count, 100)
  }
  return 30 // default
}

/**
 * Extract seed keyword from user message
 */
function extractSeedKeyword(message: string): string {
  // Check for [KEYWORD_RESEARCH: ...] format first
  const bracketMatch = message.match(/\[KEYWORD_RESEARCH:\s*([^\]]+)\]/i)
  if (bracketMatch) {
    return bracketMatch[1].trim()
  }

  // Remove question words and extract main topic
  const cleaned = message
    .toLowerCase()
    .replace(/what are (the )?(best )?keywords (for|about|on|related to)/gi, "")
    .replace(/find keywords (for|about|on|related to)/gi, "")
    .replace(/keyword ideas (for|about|on)/gi, "")
    .replace(/give me keywords (for|about|on)/gi, "")
    .replace(/show me keywords (for|about|on)/gi, "")
    .replace(/give me a list of \d+ keywords (for|about|on|based on)/gi, "")
    .replace(/i want you to give me a list of \d+ keywords (for|about|on|based on)/gi, "")
    .replace(/[?!.]/g, "")
    .trim()

  // Take first few words as seed
  const words = cleaned.split(" ").slice(0, 5).join(" ")
  return words || "seo"
}

/**
 * Format keyword data for AI analysis
 */
function formatKeywordDataForAI(keywords: any[]): string {
  const top10 = keywords.slice(0, 10)

  return top10.map(kw =>
    `- "${kw.keyword}": ${kw.search_volume.toLocaleString()} searches/mo, $${kw.cpc.toFixed(2)} CPC, ${formatCompetition(kw.competition)} competition, ${formatDifficulty(kw.keyword_difficulty)} difficulty`
  ).join("\n")
}

/**
 * Extract suggested follow-up actions from AI response
 */
function extractSuggestions(content: string): string[] {
  const suggestions: string[] = []

  const lines = content.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .reverse()

  const actionVerbs = /^(Start|Create|Analyze|Research|Build|Write|Generate|Find|Explore|Review|Compare|Focus|Try|Use|Implement|Test|Check|Consider|Look|Ask|Learn|Study|Investigate|Target|Optimize)/i

  for (const line of lines) {
    if (suggestions.length >= 5) break

    if (line.length > 120 || line.length < 15) continue
    if (line.startsWith('#') || line.match(/^\d+\./)) continue

    if (actionVerbs.test(line)) {
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
