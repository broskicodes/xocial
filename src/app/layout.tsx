import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontHeading = Instrument_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "Xocial Pulse",
  description:
    'Track how your followers are engaging with your content. See who your "hot" leads are and well your posts are converting.',
  openGraph: {
    siteName: "Xocial Pulse",
    images: [
      {
        url: "https://tweetmaestro.com/images/dash-stats.png",
        width: 1200,
        height: 630,
        alt: "Xocial Pulse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xocial Pulse",
    description:
      'Track how your followers are engaging with your content. See who your "hot" leads are and well your posts are converting.',
    images: ["https://tweetmaestro.com/images/dash-stats.png"],
    creator: "@braedenhall_",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable,
          fontHeading.variable,
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
