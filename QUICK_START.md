# Quick Start - Fix Your 500 Error Now

## The Problem
Your app calls an n8n webhook you don't have access to anymore.

## The Solution
Replace n8n with direct OpenAI API calls.

---

## 🚀 Deploy in 10 Minutes

### 1. Get OpenAI API Key (2 min)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### 2. Update Files (3 min)

**Three files need updating in your local articollo directory:**

#### A. `app/api/webhook/route.ts`
Replace entire file with the new code from `route.direct-ai.ts`

#### B. `package.json`
Add one line to dependencies:
```json
"openai": "^4.73.0",
```

#### C. Install the package
```bash
npm install openai
```

### 3. Deploy (5 min)

```bash
# 1. Commit changes
git add .
git commit -m "fix: replace n8n with OpenAI"
git push origin main

# 2. Add API key to Vercel
# Go to: https://vercel.com/[your-account]/articollo/settings/environment-variables
# Add:
#   Name: OPENAI_API_KEY
#   Value: sk-your-key-here
#   Environments: Production, Preview, Development

# 3. Done! Your app will auto-deploy
```

### 4. Test It
Visit your app: `https://[your-app].vercel.app`
Send a message - no more 500 errors! ✅

---

## Files You Need

I've created these files for you in `/tmp/articollo/`:

1. **`app/api/webhook/route.direct-ai.ts`** - New webhook route (copy to `route.ts`)
2. **`package.updated.json`** - Updated package.json with OpenAI
3. **`DEPLOYMENT_GUIDE_NO_N8N.md`** - Full detailed guide
4. **This file!** - Quick start

---

## Cost
- **~$0.10** for 1000 messages
- **~$1** for 10,000 messages
- Set a $10/month limit in OpenAI to be safe

---

## Help?
Read `DEPLOYMENT_GUIDE_NO_N8N.md` for detailed troubleshooting.
