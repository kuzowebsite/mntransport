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
import { createUserWithEmailAndPassword } from "firebase/auth"
import { ref, set } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!formData.password) {
      newErrors.password = "Нууц үг оруулна уу"
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"
      isValid = false
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Нууц үг таарахгүй байна"
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
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)

      // Save additional user data to Realtime Database
      await set(ref(database, `users/${userCredential.user.uid}`), {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Амжилттай",
        description: "Таны бүртгэл амжилттай үүслээ",
      })

      // Redirect to login page
      router.push("/auth/login")
    } catch (error: any) {
      console.error("Registration error:", error)

      let errorMessage = "Бүртгэл үүсгэхэд алдаа гарлаа"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Энэ и-мэйл хаяг бүртгэлтэй байна"
        setErrors((prev) => ({ ...prev, email: errorMessage }))
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
          <CardTitle className="text-2xl font-bold">Бүртгүүлэх</CardTitle>
          <CardDescription>Шинэ хэрэглэгчийн бүртгэл үүсгэх</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг</Label>
              <Input id="password" type="password" value={formData.password} onChange={handleChange} />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Нууц үг давтах</Label>
              <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Бүртгүүлж байна...
                </>
              ) : (
                "Бүртгүүлэх"
              )}
            </Button>
            <div className="text-center text-sm">
              Бүртгэлтэй юу?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Нэвтрэх
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
