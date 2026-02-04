import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Wortex",
  description: "Read Wortex Terms of Service covering user agreements, acceptable use policies, intellectual property rights, premium subscriptions, and legal provisions for using our word puzzle game.",
  keywords: ["terms of service", "user agreement", "terms and conditions", "legal terms", "service agreement", "acceptable use"],
  openGraph: {
    title: "Terms of Service - Wortex",
    description: "Read Wortex Terms of Service covering user agreements and acceptable use policies.",
    url: "https://wortex.live/terms-of-service",
    siteName: "Wortex",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service - Wortex",
    description: "Read Wortex Terms of Service covering user agreements and acceptable use policies.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
