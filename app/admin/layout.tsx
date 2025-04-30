"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminAuthProvider, useAdminAuth } from "@/contexts/admin-auth-context"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth()
  const router = useRouter()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true)
    }, 5000) // 5 seconds timeout

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // If not loading and either no user or not admin, redirect to home
    if (!loading && (!user || !isAdmin)) {
      console.log("Redirecting to home: user=", user, "isAdmin=", isAdmin)
      router.push("/")
    }
  }, [user, isAdmin, loading, router])

  // Show debug info if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-center mb-2">Админ эрх шалгаж байна...</p>
        <p className="text-center text-sm text-gray-500">Хэт удаан хүлээлгэж байвал нэвтэрсэн эсэхээ шалгана уу.</p>
        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
          Нүүр хуудас руу буцах
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render children if not admin
  if (!user || !isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="lg:pl-64 pt-8 pb-8 px-4 md:px-8">{children}</div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
