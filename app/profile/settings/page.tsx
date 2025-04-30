"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { database } from "@/lib/firebase"
import { ref, update } from "firebase/database"
import { updateEmail, updatePassword } from "firebase/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function ProfileSettingsPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Populate form with user data
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        phone: userData.phone || "",
        email: userData.email || "",
      }))
    }
  }, [user, loading, router, userData])

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

    if (!formData.name.trim()) {
      newErrors.name = "Нэр оруулна уу"
      isValid = false
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Утасны дугаар оруулна уу"
      isValid = false
    } else if (!/^[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = "Утасны дугаар 8 оронтой байх ёстой"
      isValid = false
    }

    if (!formData.email.trim()) {
      newErrors.email = "И-мэйл оруулна уу"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "И-мэйл хаяг буруу байна"
      isValid = false
    }

    // Password validation only if user is trying to change password
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Одоогийн нууц үгээ оруулна уу"
        isValid = false
      }

      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"
        isValid = false
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Нууц үг таарахгүй байна"
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) {
      return
    }

    setIsLoading(true)

    try {
      // Update user data in Realtime Database
      const userRef = ref(database, `users/${user.uid}`)
      await update(userRef, {
        name: formData.name,
        phone: formData.phone,
      })

      // Update email if changed
      if (formData.email !== userData?.email) {
        await updateEmail(user, formData.email)

        // Update email in database too
        await update(userRef, {
          email: formData.email,
        })
      }

      // Update password if provided
      if (formData.newPassword) {
        await updatePassword(user, formData.newPassword)
      }

      toast({
        title: "Амжилттай",
        description: "Таны мэдээлэл шинэчлэгдлээ",
      })

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      console.error("Profile update error:", error)

      let errorMessage = "Мэдээлэл шинэчлэхэд алдаа гарлаа"

      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Аюулгүй байдлын шалтгаанаар дахин нэвтрэх шаардлагатай"
        router.push("/auth/login")
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Энэ и-мэйл хаяг бүртгэлтэй байна"
        setErrors((prev) => ({ ...prev, email: errorMessage }))
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Одоогийн нууц үг буруу байна"
        setErrors((prev) => ({ ...prev, currentPassword: errorMessage }))
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
      <div className="mb-8">
        <Link href="/profile" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Профайл руу буцах
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Профайл тохиргоо</h1>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Хувийн мэдээлэл</CardTitle>
            <CardDescription>Өөрийн мэдээллийг шинэчлэх</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Нэр</Label>
                <Input id="name" placeholder="Таны нэр" value={formData.name} onChange={handleChange} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Утасны дугаар</Label>
                <Input id="phone" placeholder="99112233" value={formData.phone} onChange={handleChange} />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
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

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-4">Нууц үг солих</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Одоогийн нууц үг</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                    {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Шинэ нууц үг</Label>
                    <Input id="newPassword" type="password" value={formData.newPassword} onChange={handleChange} />
                    {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Шинэ нууц үг давтах</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  "Хадгалах"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
