import { type NextRequest, NextResponse } from "next/server"
import { getKeywordData, getKeywordIdeas, type KeywordData } from "@/lib/dataforseo"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keywords, seed, location, language, mode } = body

    console.log("[Keywords API] Request:", { mode, keywords, seed, location, language })

    // Validate input
    if (mode === "analyze" && (!keywords || !Array.isArray(keywords) || keywords.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Keywords array is required for analyze mode" },
        { status: 400 }
      )
    }

    if (mode === "ideas" && (!seed || typeof seed !== "string")) {
      return NextResponse.json(
        { success: false, error: "Seed keyword is required for ideas mode" },
        { status: 400 }
      )
    }

    let result

    if (mode === "ideas") {
      // Get keyword ideas from seed
      result = await getKeywordIdeas(
        seed,
        location || "United States",
        language || "en",
        50 // Return top 50 keywords
      )
    } else {
      // Analyze specific keywords
      result = await getKeywordData(
        keywords,
        location || "United States",
        language || "en"
      )
    }

    console.log("[Keywords API] Found", result.keywords.length, "keywords")

    return NextResponse.json({
      success: true,
      data: result,
      count: result.keywords.length,
    })

  } catch (error: any) {
    console.error("[Keywords API] Error:", error)

    // Handle specific errors
    if (error.message?.includes("credentials not configured")) {
      return NextResponse.json(
        {
          success: false,
          error: "Keyword research service is not configured. Please contact support."
        },
        { status: 500 }
      )
    }

    if (error.message?.includes("401") || error.message?.includes("403")) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API credentials. Please check configuration."
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch keyword data. Please try again."
      },
      { status: 500 }
    )
  }
}
