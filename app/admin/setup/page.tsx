"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { auth, database } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSetupPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  // Check if admin already exists
  useEffect(() => {
    const checkForAdmin = async () => {
      try {
        const usersRef = ref(database, "users")
        const snapshot = await get(usersRef)

        if (snapshot.exists()) {
          const users = snapshot.val()
          const adminExists = Object.values(users).some((user: any) => user.role === "admin")
          setHasAdmin(adminExists)

          if (adminExists) {
            toast({
              title: "Админ хэрэглэгч бүртгэгдсэн байна",
              description: "Та нэвтрэх хуудас руу шилжиж байна",
            })
            router.push("/auth/login")
          }
        }

        setIsCheckingAdmin(false)
      } catch (error) {
        console.error("Error checking for admin:", error)
        setIsCheckingAdmin(false)
      }
    }

    checkForAdmin()
  }, [router, toast])

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

    if (!formData.email.trim()) {
      newErrors.email = "И-мэйл оруулна уу"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "И-мэйл хаяг буруу байна"
      isValid = false
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Утасны дугаар оруулна уу"
      isValid = false
    }

    if (!formData.password) {
      newErrors.password = "Нууц үг оруулна уу"
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой"
      isValid = false
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Нууц үгээ давтан оруулна уу"
      isValid = false
    } else if (formData.password !== formData.confirmPassword) {
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
      const user = userCredential.user

      // Update profile
      await updateProfile(user, {
        displayName: formData.name,
      })

      // Save additional user data to database
      await set(ref(database, `users/${user.uid}`), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: "admin", // Set role as admin
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Амжилттай",
        description: "Админ хэрэглэгч амжилттай үүсгэгдлээ",
      })

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (error: any) {
      console.error("Admin setup error:", error)

      let errorMessage = "Бүртгэхэд алдаа гарлаа"

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

  if (isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (hasAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Админ хэрэглэгч бүртгэгдсэн байна</CardTitle>
            <CardDescription>Та нэвтрэх хуудас руу шилжиж байна</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Нэвтрэх хуудас руу очих
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Админ бүртгэх</CardTitle>
          <CardDescription>Системийн админ хэрэглэгч үүсгэх</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Нэр</Label>
              <Input id="name" value={formData.name} onChange={handleChange} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">И-мэйл</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleChange} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input id="phone" value={formData.phone} onChange={handleChange} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Бүртгэж байна...
                </>
              ) : (
                "Бүртгэх"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
