# DataForSEO Integration - Implementation Guide

## Changes Made

### 1. Created DataForSEO Client (`lib/dataforseo.ts`)
- API client for fetching keyword data
- Functions: `getKeywordData()`, `getKeywordIdeas()`
- Metrics: Search Volume, CPC, Competition, Keyword Difficulty

### 2. Created Keyword Research API (`app/api/keywords/route.ts`)
- Endpoint: POST `/api/keywords`
- Modes: `analyze` (specific keywords) or `ideas` (keyword suggestions)

### 3. Enhanced Webhook Route (`app/api/webhook/route.enhanced.ts`)
- Auto-detects keyword research questions
- Fetches real keyword data from DataForSEO
- AI analyzes data and provides strategic insights

### 4. Created Keyword Table Component (`components/features/keywords/keyword-table.tsx`)
- Displays keyword metrics in a sortable table
- Color-coded competition and difficulty badges
- Summary statistics (avg volume, CPC, difficulty)

### 5. Updated Type Definitions
- `lib/webhook.ts` - Added `KeywordData` interface
- `lib/chat-storage.ts` - Added `keywordData` to Message interface

## Manual Steps Required

### Step 1: Update `enhanced-chat-interface.tsx`

Add import at top:
```typescript
import { KeywordTable } from "../keywords/keyword-table"
```

Update the `addMessage` function (line ~120):
```typescript
const addMessage = (content: string, role: "user" | "assistant", keywordData?: KeywordData[]) => {
  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: Date.now(),
    keywordData: keywordData // ADD THIS LINE
  }

  setMessages(prev => [...prev, newMessage])
  return newMessage
}
```

Update `handleSubmit` function (line ~232):
```typescript
const response = await sendToWebhook(userMessage, undefined, selectedCountry, selectedLanguage)

if (response.success && response.message) {
  addMessage(response.message, "assistant", response.keywordData) // ADD keywordData param
} else {
  addMessage(response.error || "Failed to get response", "assistant")
}
```

Update `handleSendVoiceMessage` function (line ~270):
```typescript
const response = await sendToWebhook("[Voice Message]", base64Audio, selectedCountry, selectedLanguage)

if (response.success && response.message) {
  addMessage(response.message, "assistant", response.keywordData) // ADD keywordData param
} else {
  addMessage(response.error || "Failed to process voice message", "assistant")
}
```

Add KeywordTable to message rendering (line ~493, after ReactMarkdown):
```typescript
</ReactMarkdown>

{/* ADD THIS: Keyword Data Table */}
{message.keywordData && message.keywordData.length > 0 && (
  <KeywordTable
    keywords={message.keywordData}
    location={selectedCountry.name}
  />
)}

{suggestions.length > 0 && (
  // ... existing suggestion code
```

### Step 2: Replace webhook route

```bash
cp app/api/webhook/route.enhanced.ts app/api/webhook/route.ts
```

### Step 3: Add Environment Variables to Vercel

1. Go to: https://vercel.com/tiegebentley/articollo/settings/environment-variables
2. Add:
   - `DATAFORSEO_LOGIN` = `secondbrain189@gmail.com`
   - `DATAFORSEO_PASSWORD` = `SHji7zx5E247eC@`
3. Click Save

### Step 4: Deploy

```bash
git add .
git commit -m "feat: integrate DataForSEO for real keyword metrics"
git push origin main
```

## How It Works

1. **User asks:** "Find keywords for coffee shops"
2. **AI detects:** Keyword intent in message
3. **System fetches:** Real data from DataForSEO API
4. **AI analyzes:** Provides strategic insights on the data
5. **UI displays:**
   - AI response with insights
   - Keyword table with metrics
   - Suggested follow-up actions

## Example Output

User: "Find keywords for coffee shops in NYC"

AI Response:
```
Based on the keyword data, here's what I found:

High-Value Opportunities:
- "coffee shops nyc" has 18,100 monthly searches
- "best coffee manhattan" has moderate competition
- Consider targeting "specialty coffee nyc" (low competition, 3,600 searches)

[KEYWORD TABLE DISPLAYS HERE]
┌─────────────────────────┬────────┬──────┬─────────────┬────┐
│ Keyword                 │ Volume │ CPC  │ Competition │ KD │
├─────────────────────────┼────────┼──────┼─────────────┼────┤
│ coffee shops nyc        │ 18,100 │ $2.3 │ High (0.85) │ 62 │
│ best coffee manhattan   │  8,200 │ $1.8 │ Med (0.54)  │ 48 │
│ specialty coffee nyc    │  3,600 │ $2.1 │ Low (0.32)  │ 35 │
└─────────────────────────┴────────┴──────┴─────────────┴────┘

Next steps:
- Target low-competition keywords first
- Create location-specific content
- Build topical authority around specialty coffee
```

## Files Created

1. `lib/dataforseo.ts` - DataForSEO API client
2. `app/api/keywords/route.ts` - Keyword research endpoint
3. `app/api/webhook/route.enhanced.ts` - Enhanced webhook with keyword detection
4. `components/features/keywords/keyword-table.tsx` - Table component
5. This file - Implementation guide

## Cost Estimate

DataForSEO Pricing:
- ~$0.0025 per keyword research request
- 100 requests = $0.25
- 1,000 requests = $2.50

Combined with OpenAI:
- Typical query: ~$0.01 (OpenAI) + $0.0025 (DataForSEO) = $0.0125
- 100 queries = ~$1.25
- 1,000 queries = ~$12.50

## Testing

After deployment, test with:
1. "Find keywords for [your topic]"
2. "What keywords should I target for [niche]"
3. "Keyword ideas for [topic]"
4. "Search volume for [keyword]"

Should see:
- ✅ AI response with insights
- ✅ Keyword table with real data
- ✅ Metrics: Volume, CPC, Competition, Difficulty
- ✅ Color-coded badges

## Troubleshooting

**Error: "credentials not configured"**
- Add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to Vercel

**Error: "401 Unauthorized"**
- Check DataForSEO credentials are correct
- Verify account is active

**No keyword data showing:**
- Check browser console for errors
- Verify DataForSEO API is responding
- Check that message contains keyword-related terms
