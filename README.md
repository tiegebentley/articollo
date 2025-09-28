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

If your app requires environment variables, create a `.env.local` file:

```env
# Add your environment variables here
# NEXT_PUBLIC_API_URL=your-api-url
```

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