# Articollo Chat Interface

A modern chat interface built with Next.js 15, React 19, and Tailwind CSS.

## Features

- Minimal and clean chat interface
- Built with shadcn/ui components
- Dark mode support
- Responsive design
- TypeScript support

## Tech Stack

- **Framework**: Next.js 15.2.4
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: npm/pnpm

## Local Development

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link to your Vercel account and deploy.

### Option 2: Deploy via GitHub

1. Push this repository to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Vercel will automatically detect the Next.js framework
4. Click "Deploy"

### Option 3: Deploy directly from local

1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project settings (framework preset will be auto-detected as Next.js)
4. Deploy

## Environment Variables

Create a `.env.local` file in the root directory with your configuration:

```env
# N8N Webhook Configuration (Required)
N8N_WEBHOOK_URL=https://workflows.lustre-agency.com/webhook/articollo

# OpenAI API Configuration (if needed by your N8N workflow)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### For Vercel Deployment:

Add these environment variables in your Vercel project settings:
1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add the following:
   - `N8N_WEBHOOK_URL`: Your N8N webhook endpoint
   - `OPENAI_API_KEY`: Your OpenAI API key (if needed)

The webhook URL defaults to `https://workflows.lustre-agency.com/webhook/articollo` if not specified.

## Build Commands

- `npm run build` - Creates production build
- `npm run start` - Starts production server
- `npm run dev` - Starts development server
- `npm run lint` - Runs ESLint

## Project Structure

```
articollo/
├── app/              # Next.js app directory
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── features/     # Feature components
│   └── ui/           # UI components (shadcn)
├── lib/              # Utility functions
├── public/           # Static assets
├── styles/           # Additional styles
└── vercel.json       # Vercel configuration
```

## Notes

- Originally created with v0.dev
- Ready for deployment on Vercel
- Supports Edge Runtime for optimal performance

## License

MIT