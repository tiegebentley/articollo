# Articollo - Direct OpenAI Integration (No n8n Required)

## 🎯 Problem Solved

Your Articollo app was getting 500 errors because it was trying to connect to an n8n workflow that you no longer have access to. This guide replaces the n8n dependency with a direct OpenAI integration.

## ✅ What's Changed

- ❌ **Removed:** n8n webhook dependency
- ✅ **Added:** Direct OpenAI API integration
- ✅ **Added:** Voice transcription via Whisper
- ✅ **Added:** Chat completion via GPT-4o-mini
- ✅ **Improved:** Error handling and user messages
- ✅ **Fixed:** CSP policy issues
- ✅ **Fixed:** Vercel timeout limits

## 📦 Step-by-Step Deployment

### Step 1: Update Your Files (5 minutes)

```bash
# Navigate to your local Articollo directory
cd /path/to/articollo

# Backup your current webhook route (optional)
cp app/api/webhook/route.ts app/api/webhook/route.backup.ts

# Replace with the new direct OpenAI integration
# Copy the content from: app/api/webhook/route.direct-ai.ts
# To: app/api/webhook/route.ts
```

**File updates needed:**

1. **app/api/webhook/route.ts** - Replace entire file with `route.direct-ai.ts`
2. **package.json** - Replace with `package.updated.json` (adds OpenAI SDK)
3. **next.config.mjs** - Update CSP (optional, but recommended)

### Step 2: Get Your OpenAI API Key (2 minutes)

1. Go to: https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it: "Articollo Production"
5. Copy the key (starts with `sk-...`)
6. **Save it securely** - you won't be able to see it again!

### Step 3: Install Dependencies (2 minutes)

```bash
# Install the OpenAI SDK
npm install openai@^4.73.0

# Or if using pnpm
pnpm install openai@^4.73.0
```

### Step 4: Test Locally (5 minutes)

```bash
# Create .env.local file
cat > .env.local << EOF
OPENAI_API_KEY=sk-your-api-key-here
EOF

# Start development server
npm run dev

# Visit http://localhost:3000 and test:
# 1. Send a text message
# 2. Try voice recording (if you have a microphone)
```

**Expected behavior:**
- Text messages should get intelligent SEO/content responses
- Voice messages should be transcribed and responded to
- No 500 errors!

### Step 5: Deploy to Vercel (5 minutes)

#### Option A: Using Vercel Dashboard (Recommended)

1. **Add Environment Variable:**
   - Go to: https://vercel.com/[your-account]/articollo/settings/environment-variables
   - Click "Add New"
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your OpenAI API key (from Step 2)
   - **Environments:** Production, Preview, Development (check all)
   - Click "Save"

2. **Deploy via Git Push:**
   ```bash
   git add .
   git commit -m "feat: replace n8n with direct OpenAI integration"
   git push origin main
   ```

3. **Wait for deployment** (usually 2-3 minutes)

4. **Test your production site:**
   - Visit: https://[your-app].vercel.app
   - Send a test message
   - Should work without 500 errors!

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add OPENAI_API_KEY
# When prompted:
# - Value: sk-your-api-key-here
# - Environments: Production, Preview, Development

# Deploy
vercel --prod
```

## 🧪 Testing Checklist

After deployment, verify these features work:

- [ ] Homepage loads without errors
- [ ] Chat history sidebar works
- [ ] Can send text messages
- [ ] Receives AI responses for text
- [ ] Can record voice messages
- [ ] Voice messages are transcribed correctly
- [ ] AI responds to voice messages
- [ ] Suggestion chips appear and work
- [ ] Can copy messages
- [ ] Can download messages as PDF
- [ ] Dark mode toggle works
- [ ] Country/language selectors work

## 💰 Cost Estimates

**OpenAI API Costs (GPT-4o-mini + Whisper):**

| Usage | Estimated Cost |
|-------|---------------|
| 100 text messages | ~$0.01 |
| 1000 text messages | ~$0.10 |
| 100 voice messages | ~$0.05 |
| 1000 voice messages | ~$0.50 |

**Monthly estimates:**
- Light use (100 messages/month): **~$0.01-0.05**
- Moderate use (1000 messages/month): **~$0.10-0.60**
- Heavy use (10,000 messages/month): **~$1-6**

💡 **Tip:** Set up billing alerts in OpenAI dashboard to avoid surprises.

## 🔒 Security Best Practices

1. **Never commit your `.env.local` file** (already in `.gitignore`)
2. **Rotate your API key** if you suspect it's been exposed
3. **Set usage limits** in OpenAI dashboard:
   - Go to: https://platform.openai.com/account/limits
   - Set a monthly budget cap
4. **Monitor usage** regularly:
   - https://platform.openai.com/usage

## 🐛 Troubleshooting

### Error: "AI service is not configured"

**Cause:** `OPENAI_API_KEY` environment variable is missing

**Fix:**
1. Add the key to Vercel environment variables
2. Redeploy your app

### Error: "Authentication failed"

**Cause:** Invalid or expired OpenAI API key

**Fix:**
1. Generate a new key at https://platform.openai.com/api-keys
2. Update Vercel environment variable
3. Redeploy

### Error: "Too many requests"

**Cause:** Rate limit exceeded

**Fix:**
- Wait 1-2 minutes and try again
- If persistent, upgrade your OpenAI plan

### Voice recording doesn't work

**Cause:** Browser permissions or HTTPS required

**Fix:**
- Grant microphone permission in browser
- Ensure using HTTPS (required for Web Audio API)
- Try a different browser (Chrome/Edge recommended)

## 📊 Monitoring

### Check Application Logs

```bash
# View real-time logs in Vercel dashboard
vercel logs [deployment-url] --follow

# Or via CLI
vercel logs --follow
```

### Monitor OpenAI Usage

Visit: https://platform.openai.com/usage

Track:
- Total tokens used
- Cost per day
- Most expensive requests

### Set Up Alerts

**In OpenAI Dashboard:**
1. Go to Settings → Limits
2. Set "Hard limit" (e.g., $10/month)
3. Set "Soft limit" email notification (e.g., $5/month)

**In Vercel Dashboard:**
1. Enable error tracking
2. Set up email notifications for failed deployments

## 🚀 Optional Improvements

### 1. Add Conversation History

The current implementation is stateless. To add memory:

```typescript
// In app/api/webhook/route.ts
messages: [
  { role: "system", content: SYSTEM_PROMPT },
  ...previousMessages, // Add chat history here
  { role: "user", content: userPrompt }
]
```

### 2. Upgrade to GPT-4

For better responses (but higher cost):

```typescript
model: "gpt-4o", // Instead of "gpt-4o-mini"
```

**Cost comparison:**
- GPT-4o-mini: $0.00015 per 1K tokens
- GPT-4o: $0.005 per 1K tokens (33x more expensive)

### 3. Add Rate Limiting

Protect against abuse:

```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
})
```

### 4. Add Analytics

Track usage:

```typescript
// Install: npm install @vercel/analytics
import { track } from '@vercel/analytics/server'

await track('chat_message_sent', {
  type: body.type,
  country: body.country,
  language: body.language,
})
```

## 📚 Additional Resources

- **OpenAI API Documentation:** https://platform.openai.com/docs
- **Next.js API Routes:** https://nextjs.org/docs/api-routes/introduction
- **Vercel Deployment:** https://vercel.com/docs
- **Whisper API:** https://platform.openai.com/docs/guides/speech-to-text

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check OpenAI usage dashboard
4. Open an issue on GitHub (if applicable)

## 📝 Summary

You've successfully migrated from n8n to direct OpenAI integration! Your app now:

✅ Works without external workflow dependencies
✅ Has full control over AI responses
✅ Supports both text and voice messages
✅ Has better error handling
✅ Costs less to run
✅ Is faster and more reliable

**Next steps:**
1. Monitor usage in OpenAI dashboard
2. Set up billing alerts
3. Test all features thoroughly
4. Enjoy your working Articollo app! 🎉
