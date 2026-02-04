import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Wortex - Educational Word Puzzle Game",
  description: "Discover how Wortex combines word puzzles with famous quotations to enhance vocabulary, improve reading comprehension, and develop critical thinking skills through engaging daily challenges.",
  keywords: [
    "about wortex",
    "word puzzle game",
    "educational games",
    "vocabulary building",
    "reading comprehension",
    "cognitive benefits",
    "language learning",
    "famous quotes",
    "educational value",
    "brain training",
    "word games education"
  ],
  openGraph: {
    title: "About Wortex - Educational Word Puzzle Game",
    description: "Discover how Wortex combines word puzzles with famous quotations to enhance vocabulary, improve reading comprehension, and develop critical thinking skills.",
    url: "https://wortex.live/about",
    siteName: "Wortex",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Wortex - Educational Word Puzzle Game",
    description: "Discover how Wortex combines word puzzles with famous quotations to enhance vocabulary and critical thinking skills.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
