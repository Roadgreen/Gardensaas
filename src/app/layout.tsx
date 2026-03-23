import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} antialiased`}
        style={{ background: 'var(--surface)', color: 'var(--on-surface)' }}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <SessionProvider>
            <ThemeProvider>
              <Navbar />
              <main className="pt-16">{children}</main>
              <Footer />
              <ScrollToTop />
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
