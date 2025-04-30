"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { useToast } from "@/components/ui/use-toast"

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setError("")
  }

  const validateForm = () => {
    if (!email.trim()) {
      setError("И-мэйл оруулна уу")
      return false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("И-мэйл хаяг буруу байна")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, email)

      setSuccess(true)
      toast({
        title: "Амжилттай",
        description: "Нууц үг сэргээх холбоос таны и-мэйл хаяг руу илгээгдлээ",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)

      let errorMessage = "Нууц үг сэргээх хүсэлт илгээхэд алдаа гарлаа"

      if (error.code === "auth/user-not-found") {
        errorMessage = "Энэ и-мэйл хаягтай хэрэглэгч олдсонгүй"
      }

      setError(errorMessage)
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
        <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Нэвтрэх хуудас руу буцах
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Нууц үг сэргээх</CardTitle>
          <CardDescription>Нууц үг сэргээх холбоос авахын тулд и-мэйл хаягаа оруулна уу</CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Нууц үг сэргээх холбоос таны и-мэйл хаяг руу илгээгдлээ. И-мэйлээ шалгана уу.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Link href="/auth/login" className="text-primary hover:underline">
                Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">И-мэйл</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={handleChange} />
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Илгээж байна...
                  </>
                ) : (
                  "Нууц үг сэргээх холбоос авах"
                )}
              </Button>
              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-primary hover:underline">
                  Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
