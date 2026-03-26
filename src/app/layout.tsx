import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Layout from "../components/Layout";
import HydrationFix from "../components/HydrationFix";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TSE Demo Builder",
  description: "TSE Demo Builder Application",
  icons: {
    icon: [
      {
        url: "/logo.png",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} ${workSans.className}`}>
        <HydrationFix />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
