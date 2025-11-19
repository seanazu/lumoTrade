"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>LumoTrade</title>
        <meta
          name="description"
          content="AI-powered stock analysis and trading insights"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
