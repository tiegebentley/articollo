"use client"

import { formatCompetition, formatDifficulty, type KeywordData } from "@/lib/dataforseo"

interface KeywordTableProps {
  keywords: KeywordData[]
  location?: string
}

export function KeywordTable({ keywords, location }: KeywordTableProps) {
  if (!keywords || keywords.length === 0) {
    return null
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Keyword Metrics
          {location && <span className="ml-2 text-xs text-muted-foreground">({location})</span>}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Showing {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} sorted by search volume
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Keyword
              </th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">
                Search Volume
              </th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">
                CPC
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Competition
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((keyword, index) => (
              <tr
                key={index}
                className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                {/* Keyword */}
                <td className="px-4 py-3 text-foreground font-medium">
                  {keyword.keyword}
                </td>

                {/* Search Volume */}
                <td className="px-4 py-3 text-right text-foreground">
                  {keyword.search_volume.toLocaleString()}
                  <span className="text-xs text-muted-foreground ml-1">/mo</span>
                </td>

                {/* CPC */}
                <td className="px-4 py-3 text-right text-foreground">
                  ${keyword.cpc.toFixed(2)}
                </td>

                {/* Competition */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCompetitionColor(
                      keyword.competition
                    )}`}
                  >
                    {formatCompetition(keyword.competition)}
                  </span>
                </td>

                {/* Keyword Difficulty */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getDifficultyColor(
                      keyword.keyword_difficulty
                    )}`}
                  >
                    {keyword.keyword_difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="border-t border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="font-semibold">Avg Volume:</span>{" "}
            {Math.round(
              keywords.reduce((sum, kw) => sum + kw.search_volume, 0) / keywords.length
            ).toLocaleString()}
          </div>
          <div>
            <span className="font-semibold">Avg CPC:</span> $
            {(keywords.reduce((sum, kw) => sum + kw.cpc, 0) / keywords.length).toFixed(2)}
          </div>
          <div>
            <span className="font-semibold">Avg Difficulty:</span>{" "}
            {Math.round(
              keywords.reduce((sum, kw) => sum + kw.keyword_difficulty, 0) / keywords.length
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Get color classes for competition badge
 */
function getCompetitionColor(value: number): string {
  if (value >= 0.8) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  if (value >= 0.5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  if (value >= 0.3) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
}

/**
 * Get color classes for difficulty badge
 */
function getDifficultyColor(value: number): string {
  if (value >= 80) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
  if (value >= 60) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  if (value >= 40) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  if (value >= 20) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
}
