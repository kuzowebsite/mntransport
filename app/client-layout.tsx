"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/contexts/auth-context"
import { BookmarkProvider } from "@/contexts/bookmark-context"
import { BookingProvider } from "@/contexts/booking-context"
import { ChatProvider } from "@/contexts/chat-context"
import { SiteSettingsProvider } from "@/contexts/site-settings-context"
import { UnifiedChatWidget } from "@/components/chat/unified-chat-widget"
import { Toaster } from "@/components/ui/toaster"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdminRoute, setIsAdminRoute] = useState(false)

  useEffect(() => {
    setIsAdminRoute(pathname?.startsWith("/admin") || false)
  }, [pathname])

  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <BookmarkProvider>
          <BookingProvider>
            <ChatProvider>
              <Header />
              <main className="min-h-[calc(100vh-64px)]">{children}</main>
              <Footer />
              <UnifiedChatWidget />
              <Toaster />
            </ChatProvider>
          </BookingProvider>
        </BookmarkProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  )
}
