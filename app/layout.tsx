import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "driver.js/dist/driver.css";
import { UserProvider } from "@/lib/contexts/UserContext";
import { TutorialProvider } from "@/lib/contexts/TutorialContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
