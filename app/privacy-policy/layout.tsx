import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Wortex",
  description: "Learn how Wortex collects, uses, and protects your personal information. Read our comprehensive privacy policy covering data collection, cookies, user rights, and security measures.",
  keywords: ["privacy policy", "data protection", "user privacy", "GDPR", "CCPA", "cookies", "personal information"],
  openGraph: {
    title: "Privacy Policy - Wortex",
    description: "Learn how Wortex collects, uses, and protects your personal information.",
    url: "https://wortex.live/privacy-policy",
    siteName: "Wortex",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy - Wortex",
    description: "Learn how Wortex collects, uses, and protects your personal information.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
