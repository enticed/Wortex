import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "driver.js/dist/driver.css";
import { UserProvider } from "@/lib/contexts/UserContext";
import { TutorialProvider } from "@/lib/contexts/TutorialContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CsrfInitializer } from "@/components/CsrfInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wortex - Daily Word Puzzle Game",
  description: "Challenge yourself with daily word puzzles! Assemble famous quotes from a swirling vortex of words.",
  metadataBase: new URL('https://wortex.live'),

  // Open Graph metadata for social sharing
  openGraph: {
    title: "Wortex - Daily Word Puzzle Game",
    description: "Challenge yourself with daily word puzzles! Assemble famous quotes from a swirling vortex of words.",
    url: 'https://wortex.live',
    siteName: 'Wortex',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // We'll need to create this
        width: 1200,
        height: 630,
        alt: 'Wortex - Daily Word Puzzle Game',
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: "Wortex - Daily Word Puzzle Game",
    description: "Challenge yourself with daily word puzzles! Assemble famous quotes from a swirling vortex of words.",
    images: ['/og-image.png'],
  },

  // Additional metadata
  keywords: ['word puzzle', 'daily puzzle', 'word game', 'quotes', 'brain teaser', 'vocabulary'],
  authors: [{ name: 'Wortex' }],
  creator: 'Wortex',
  publisher: 'Wortex',

  // Verification and robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // Google AdSense verification
  other: {
    'google-adsense-account': 'ca-pub-8611319413999946',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <CsrfInitializer />
          <UserProvider>
            <TutorialProvider>
              {children}
            </TutorialProvider>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
