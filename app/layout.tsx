import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth/auth-provider"

import "./globals.css"
// Make sure this import is present
import "./conversation.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Interview Copilot - AI-powered interview assistance",
  description: "Get real-time AI assistance during your job interviews with Interview Copilot",
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            suppressHydrationWarning
          >
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
