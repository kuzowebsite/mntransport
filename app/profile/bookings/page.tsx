"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { BookingList } from "@/components/booking/booking-list"

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Профайл руу буцах
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Миний захиалгууд</h1>
        <p className="text-muted-foreground mt-2">Таны үйлчилгээ болон захиалгуудын жагсаалт</p>
      </div>

      <BookingList />
    </div>
  )
}
