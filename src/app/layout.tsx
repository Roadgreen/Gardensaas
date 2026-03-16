import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GardenSaas - Smart Garden Planner",
    template: "%s | GardenSaas",
  },
  description:
    "Plan your perfect garden with smart plant recommendations, 3D visualization, and expert growing advice. Get personalized tips for your soil, climate, and space.",
  keywords: [
    "garden planner",
    "vegetable garden",
    "plant recommendations",
    "gardening app",
    "companion planting",
    "3D garden",
    "planting calendar",
  ],
  authors: [{ name: "GardenSaas" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GardenSaas",
    title: "GardenSaas - Smart Garden Planner",
    description:
      "Plan your perfect garden with smart plant recommendations, 3D visualization, and expert growing advice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GardenSaas - Smart Garden Planner",
    description:
      "Plan your perfect garden with smart plant recommendations, 3D visualization, and expert growing advice.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        <SessionProvider>
          <ThemeProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
            <Footer />
            <ScrollToTop />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
