import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/providers"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Articollo - AI Research & Content Creation Assistant",
    template: "%s | Articollo",
  },
  description:
    "Your expert guide for SEO and GEO content creation. Research, create, and amplify winning content strategies.",
  keywords: ["SEO", "Content Creation", "AI Assistant", "Research", "GEO", "Content Strategy"],
  authors: [{ name: "Articollo Team" }],
  creator: "Articollo",
  metadataBase: new URL("https://articollo.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Articollo - AI Research & Content Creation Assistant",
    description:
      "Your expert guide for SEO and GEO content creation. Research, create, and amplify winning content strategies.",
    siteName: "Articollo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Articollo - AI Research & Content Creation Assistant",
    description:
      "Your expert guide for SEO and GEO content creation. Research, create, and amplify winning content strategies.",
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "Articollo",
}

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2937" },
  ],
}

// Root layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head></head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
