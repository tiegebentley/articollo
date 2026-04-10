/**
 * DataForSEO API Client
 * Provides keyword data: search volume, CPC, competition, keyword difficulty
 */

export interface KeywordData {
  keyword: string
  search_volume: number
  cpc: number
  competition: number
  keyword_difficulty: number
  trend?: number[]
}

export interface DataForSEOResponse {
  keywords: KeywordData[]
  location: string
  language: string
}

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3"

/**
 * Get keyword metrics from DataForSEO
 */
export async function getKeywordData(
  keywords: string[],
  location: string = "United States",
  language: string = "en"
): Promise<DataForSEOResponse> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error("DataForSEO credentials not configured")
  }

  // Encode credentials for Basic Auth
  const auth = Buffer.from(`${login}:${password}`).toString("base64")

  // Map location name to DataForSEO location code
  const locationCode = getLocationCode(location)

  // DataForSEO Keywords Data endpoint
  const endpoint = `${DATAFORSEO_API_URL}/keywords_data/google_ads/search_volume/live`

  const payload = [
    {
      keywords: keywords.slice(0, 100), // Limit to 100 keywords per request
      location_code: locationCode,
      language_code: language.toLowerCase().substring(0, 2),
      search_partners: false,
      date_from: getPastDate(12), // 12 months of data
      date_to: getCurrentDate(),
    },
  ]

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DataForSEO] API error:", response.status, errorText)
      throw new Error(`DataForSEO API error: ${response.status}`)
    }

    const data = await response.json()

    // Parse response
    if (data.tasks && data.tasks[0] && data.tasks[0].result) {
      const results = data.tasks[0].result

      const keywordData: KeywordData[] = results.map((item: any) => ({
        keyword: item.keyword || "",
        search_volume: item.search_volume || 0,
        cpc: item.cpc || 0,
        competition: item.competition || 0,
        keyword_difficulty: calculateKeywordDifficulty(item),
        trend: item.monthly_searches?.map((m: any) => m.search_volume) || [],
      }))

      return {
        keywords: keywordData.sort((a, b) => b.search_volume - a.search_volume),
        location: location,
        language: language,
      }
    }

    throw new Error("No results from DataForSEO")
  } catch (error) {
    console.error("[DataForSEO] Error:", error)
    throw error
  }
}

/**
 * Get keyword ideas + metrics from DataForSEO
 * Uses keyword suggestions endpoint
 */
export async function getKeywordIdeas(
  seed: string,
  location: string = "United States",
  language: string = "en",
  limit: number = 50
): Promise<DataForSEOResponse> {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD

  if (!login || !password) {
    throw new Error("DataForSEO credentials not configured")
  }

  const auth = Buffer.from(`${login}:${password}`).toString("base64")
  const locationCode = getLocationCode(location)

  // Use keywords_data endpoint for related keywords
  const endpoint = `${DATAFORSEO_API_URL}/keywords_data/google_ads/keywords_for_keywords/live`

  const payload = [
    {
      keywords: [seed],
      location_code: locationCode,
      language_code: language.toLowerCase().substring(0, 2),
      search_partners: false,
      include_adult_keywords: false,
      sort_by: "search_volume",
      limit: limit,
    },
  ]

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DataForSEO] API error:", response.status, errorText)
      throw new Error(`DataForSEO API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.tasks && data.tasks[0] && data.tasks[0].result) {
      const results = data.tasks[0].result

      const keywordData: KeywordData[] = results.map((item: any) => ({
        keyword: item.keyword || "",
        search_volume: item.search_volume || 0,
        cpc: item.cpc || 0,
        competition: item.competition || 0,
        keyword_difficulty: calculateKeywordDifficulty(item),
        trend: item.monthly_searches?.map((m: any) => m.search_volume) || [],
      }))

      return {
        keywords: keywordData.sort((a, b) => b.search_volume - a.search_volume),
        location: location,
        language: language,
      }
    }

    throw new Error("No results from DataForSEO")
  } catch (error) {
    console.error("[DataForSEO] Error:", error)
    throw error
  }
}

/**
 * Calculate keyword difficulty score (0-100)
 * Based on competition and CPC
 */
function calculateKeywordDifficulty(item: any): number {
  const competition = item.competition || 0
  const cpc = item.cpc || 0
  const searchVolume = item.search_volume || 0

  // Simple KD calculation
  // High competition + high CPC + high volume = difficult
  let score = competition * 50 // 0-50 from competition

  if (cpc > 5) score += 20
  else if (cpc > 2) score += 10
  else if (cpc > 1) score += 5

  if (searchVolume > 100000) score += 20
  else if (searchVolume > 10000) score += 10
  else if (searchVolume > 1000) score += 5

  return Math.min(Math.round(score), 100)
}

/**
 * Map location name to DataForSEO location code
 */
function getLocationCode(location: string): number {
  const locationMap: { [key: string]: number } = {
    "United States": 2840,
    "United Kingdom": 2826,
    "Canada": 2124,
    "Australia": 2036,
    "Germany": 2276,
    "France": 2250,
    "Spain": 2724,
    "Italy": 2380,
    "Netherlands": 2528,
    "Brazil": 2076,
    "India": 2356,
    "Japan": 2392,
    "South Korea": 2410,
    "Mexico": 2484,
    "Argentina": 2032,
  }

  return locationMap[location] || 2840 // Default to US
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

/**
 * Get past date (months ago) in YYYY-MM-DD format
 */
function getPastDate(monthsAgo: number): string {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return date.toISOString().split("T")[0]
}

/**
 * Format competition as string
 */
export function formatCompetition(value: number): string {
  if (value >= 0.8) return "High"
  if (value >= 0.5) return "Medium"
  if (value >= 0.3) return "Low"
  return "Very Low"
}

/**
 * Format keyword difficulty as string
 */
export function formatDifficulty(value: number): string {
  if (value >= 80) return "Very Hard"
  if (value >= 60) return "Hard"
  if (value >= 40) return "Medium"
  if (value >= 20) return "Easy"
  return "Very Easy"
}
