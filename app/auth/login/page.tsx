"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { auth, database } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { ref, get } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))

    // Clear error when user types
    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    if (!formData.email.trim()) {
      newErrors.email = "И-мэйл оруулна уу"
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = "Нууц үг оруулна уу"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Check if user is admin
      const userRef = ref(database, `users/${user.uid}`)
      const snapshot = await get(userRef)

      let isAdmin = false
      if (snapshot.exists()) {
        const userData = snapshot.val()
        isAdmin = userData.role === "admin"
      }

      toast({
        title: "Амжилттай",
        description: "Та амжилттай нэвтэрлээ",
      })

      // Redirect based on user role
      if (isAdmin) {
        router.push("/admin") // Redirect to admin dashboard
      } else {
        router.push("/") // Redirect to user homepage
      }
    } catch (error: any) {
      console.error("Login error:", error)

      let errorMessage = "Нэвтрэхэд алдаа гарлаа"

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "И-мэйл эсвэл нууц үг буруу байна"
        setErrors({
          email: errorMessage,
          password: errorMessage,
        })
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Хэт олон удаа буруу оролдлого хийсэн байна. Түр хүлээнэ үү"
      } else if (error.code === "auth/visibility-check-was-unavailable") {
        errorMessage = "Үйлчилгээний түр саатал. Дахин оролдоно уу"
        // Add a console message for debugging
        console.log("Firebase visibility check error - this is usually a temporary service issue")
      } else if (error.code?.includes("visibility-check")) {
        errorMessage = "Үйлчилгээний түр саатал. Дахин оролдоно уу"
        // Add a console message for debugging
        console.log("Firebase visibility check error - this is usually a temporary service issue")
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Сүлжээний алдаа. Интернэт холболтоо шалгана уу"
      }

      toast({
        title: "Алдаа",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center px-4">
      <div className="absolute left-4 top-4">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Нүүр хуудас руу буцах
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Нэвтрэх</CardTitle>
          <CardDescription>Та өөрийн бүртгэлтэй хаягаар нэвтэрнэ үү</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">И-мэйл</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Нууц үг</Label>
                <Link href="/auth/reset-password" className="text-xs text-primary hover:underline">
                  Нууц үг мартсан?
                </Link>
              </div>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Нэвтэрч байна...
                </>
              ) : (
                "Нэвтрэх"
              )}
            </Button>
            <div className="text-center text-sm">
              Бүртгэлгүй юу?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Бүртгүүлэх
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
