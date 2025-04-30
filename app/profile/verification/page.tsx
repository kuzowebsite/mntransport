"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { database } from "@/lib/firebase"
import { ref, update, get } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"

export default function VerificationPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationTab, setVerificationTab] = useState("provider")
  const [verificationStatus, setVerificationStatus] = useState<{
    providerStatus: "none" | "partial" | "verified"
    seekerStatus: "none" | "partial" | "verified"
    idCardFront?: string
    idCardBack?: string
    driverLicense?: string
    vehiclePlate?: string
    vehiclePlateImage?: string
    agreedToTerms?: boolean
  }>({
    providerStatus: "none",
    seekerStatus: "none",
  })

  // Refs for file inputs
  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const idCardBackRef = useRef<HTMLInputElement>(null)
  const driverLicenseRef = useRef<HTMLInputElement>(null)
  const vehiclePlateImageRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    idCardFront: "",
    idCardBack: "",
    driverLicense: "",
    vehiclePlate: "",
    vehiclePlateImage: "",
    agreedToTerms: false,
  })

  // Image previews
  const [previews, setPreviews] = useState({
    idCardFront: "",
    idCardBack: "",
    driverLicense: "",
    vehiclePlateImage: "",
  })

  // Check if user is logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
      return
    }

    // Fetch verification status
    const fetchVerificationStatus = async () => {
      if (!user) return

      try {
        const verificationRef = ref(database, `users/${user.uid}/verification`)
        const snapshot = await get(verificationRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          setVerificationStatus({
            providerStatus: data.providerStatus || "none",
            seekerStatus: data.seekerStatus || "none",
            ...data,
          })

          // Set form data from existing verification
          setFormData({
            idCardFront: data.idCardFront || "",
            idCardBack: data.idCardBack || "",
            driverLicense: data.driverLicense || "",
            vehiclePlate: data.vehiclePlate || "",
            vehiclePlateImage: data.vehiclePlateImage || "",
            agreedToTerms: data.agreedToTerms || false,
          })

          // Set previews
          setPreviews({
            idCardFront: data.idCardFront || "",
            idCardBack: data.idCardBack || "",
            driverLicense: data.driverLicense || "",
            vehiclePlateImage: data.vehiclePlateImage || "",
          })
        }
      } catch (error) {
        console.error("Error fetching verification status:", error)
      }
    }

    fetchVerificationStatus()
  }, [user, loading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, agreedToTerms: checked }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof previews) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Алдаа",
        description: "Зургийн хэмжээ 2MB-с бага байх ёстой",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreviews((prev) => ({ ...prev, [field]: base64 }))
      setFormData((prev) => ({ ...prev, [field]: base64 }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Алдаа",
        description: "Та нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Алдаа",
        description: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Determine verification status based on tab
      let providerStatus = verificationStatus.providerStatus
      let seekerStatus = verificationStatus.seekerStatus

      if (verificationTab === "provider") {
        if (
          formData.idCardFront &&
          formData.idCardBack &&
          formData.driverLicense &&
          formData.vehiclePlate &&
          formData.vehiclePlateImage &&
          formData.agreedToTerms
        ) {
          providerStatus = "verified"
        } else if (
          formData.idCardFront ||
          formData.idCardBack ||
          formData.driverLicense ||
          formData.vehiclePlate ||
          formData.vehiclePlateImage
        ) {
          providerStatus = "partial"
        }
      } else {
        // For seekers
        if (formData.idCardFront && formData.idCardBack && formData.agreedToTerms) {
          seekerStatus = "verified"
        } else if (formData.idCardFront || formData.idCardBack) {
          seekerStatus = "partial"
        }
      }

      // Update verification data in Firebase
      const verificationRef = ref(database, `users/${user.uid}/verification`)
      await update(verificationRef, {
        providerStatus,
        seekerStatus,
        idCardFront: formData.idCardFront,
        idCardBack: formData.idCardBack,
        driverLicense: verificationTab === "provider" ? formData.driverLicense : null,
        vehiclePlate: verificationTab === "provider" ? formData.vehiclePlate : null,
        vehiclePlateImage: verificationTab === "provider" ? formData.vehiclePlateImage : null,
        agreedToTerms: formData.agreedToTerms,
        verificationTab,
        updatedAt: new Date().toISOString(),
      })

      // Update user's verification status
      const userRef = ref(database, `users/${user.uid}`)
      await update(userRef, {
        providerVerificationStatus: providerStatus,
        seekerVerificationStatus: seekerStatus,
      })

      toast({
        title: "Амжилттай",
        description: "Баталгаажуулалтын мэдээлэл амжилттай хадгалагдлаа",
      })

      // Update local state
      setVerificationStatus({
        providerStatus,
        seekerStatus,
        ...formData,
      })
    } catch (error) {
      console.error("Error submitting verification:", error)
      toast({
        title: "Алдаа",
        description: "Баталгаажуулалтын мэдээлэл хадгалахад алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  const renderVerificationStatus = () => {
    const status = verificationTab === "provider" ? verificationStatus.providerStatus : verificationStatus.seekerStatus

    return (
      <div className="flex items-center gap-2">
        {status === "verified" ? (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700">Бүрэн баталгаажсан</span>
          </>
        ) : status === "partial" ? (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="font-medium text-yellow-700">Дутуу баталгаажсан</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-700">Баталгаажаагүй</span>
          </>
        )}
      </div>
    )
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
        <h1 className="text-3xl font-bold">Баталгаажуулалт</h1>
        <p className="text-muted-foreground mt-2">
          Таны мэдээллийг баталгаажуулснаар бусад хэрэглэгчид танд илүү итгэх боломжтой болно
        </p>
      </div>

      {/* Verification Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            Баталгаажуулалтын төлөв
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderVerificationStatus()}
          <p className="text-sm text-muted-foreground mt-2">
            {verificationTab === "provider"
              ? verificationStatus.providerStatus === "verified"
                ? "Таны үйлчилгээ үзүүлэгчийн мэдээлэл бүрэн баталгаажсан байна."
                : verificationStatus.providerStatus === "partial"
                  ? "Таны үйлчилгээ үзүүлэгчийн мэдээлэл дутуу баталгаажсан байна. Бүх шаардлагатай мэдээллийг оруулна уу."
                  : "Та үйлчилгээ үзүүлэгчийн мэдээллээ баталгаажуулаагүй байна."
              : verificationStatus.seekerStatus === "verified"
                ? "Таны үйлчилгээ хайгчийн мэдээлэл бүрэн баталгаажсан байна."
                : verificationStatus.seekerStatus === "partial"
                  ? "Таны үйлчилгээ хайгчийн мэдээлэл дутуу баталгаажсан байна. Бүх шаардлагатай мэдээллийг оруулна уу."
                  : "Та үйлчилгээ хайгчийн мэдээллээ баталгаажуулаагүй байна."}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="provider" onValueChange={setVerificationTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="provider">Үйлчилгээ үзүүлэгч</TabsTrigger>
          <TabsTrigger value="seeker">Үйлчилгээ хайх</TabsTrigger>
        </TabsList>

        <TabsContent value="provider">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Үйлчилгээ үзүүлэгчийн баталгаажуулалт</CardTitle>
                <CardDescription>
                  Үйлчилгээ үзүүлэгч хэрэглэгч болохын тулд дараах мэдээллийг оруулна уу
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="idCardFront">Иргэний үнэмлэхний урд тал</Label>
                    <div className="mt-2">
                      <Input
                        id="idCardFront"
                        type="file"
                        accept="image/*"
                        ref={idCardFrontRef}
                        onChange={(e) => handleImageChange(e, "idCardFront")}
                        className="mb-2"
                      />
                      {previews.idCardFront && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.idCardFront || "/placeholder.svg"}
                            alt="Иргэний үнэмлэхний урд тал"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="idCardBack">Иргэний үнэмлэхний ард тал</Label>
                    <div className="mt-2">
                      <Input
                        id="idCardBack"
                        type="file"
                        accept="image/*"
                        ref={idCardBackRef}
                        onChange={(e) => handleImageChange(e, "idCardBack")}
                        className="mb-2"
                      />
                      {previews.idCardBack && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.idCardBack || "/placeholder.svg"}
                            alt="Иргэний үнэмлэхний ард тал"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="driverLicense">Жолооны үнэмлэх</Label>
                    <div className="mt-2">
                      <Input
                        id="driverLicense"
                        type="file"
                        accept="image/*"
                        ref={driverLicenseRef}
                        onChange={(e) => handleImageChange(e, "driverLicense")}
                        className="mb-2"
                      />
                      {previews.driverLicense && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.driverLicense || "/placeholder.svg"}
                            alt="Жолооны үнэмлэх"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="vehiclePlate">Машины дугаар</Label>
                    <Input
                      id="vehiclePlate"
                      placeholder="Жишээ: УБА12345"
                      value={formData.vehiclePlate}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="vehiclePlateImage">Машины дугаарын зураг</Label>
                    <div className="mt-2">
                      <Input
                        id="vehiclePlateImage"
                        type="file"
                        accept="image/*"
                        ref={vehiclePlateImageRef}
                        onChange={(e) => handleImageChange(e, "vehiclePlateImage")}
                        className="mb-2"
                      />
                      {previews.vehiclePlateImage && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.vehiclePlateImage || "/placeholder.svg"}
                            alt="Машины дугаарын зураг"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Анхааруулга:</strong> Бид таны хувийн мэдээллийг маш сайн нууцлан хамгаалах болно. Таны
                    оруулсан баримт бичгүүд зөвхөн баталгаажуулалтын зорилгоор ашиглагдана.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" checked={formData.agreedToTerms} onCheckedChange={handleCheckboxChange} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Үйлчилгээний нөхцөл
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Би энэхүү платформд худал мэдээлэл, зар оруулахгүй бөгөөд үйлчилгээний нөхцөлийг хүлээн зөвшөөрч
                      байна.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Баталгаажуулж байна...
                    </>
                  ) : (
                    "Баталгаажуулах"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="seeker">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Үйлчилгээ хайгчийн баталгаажуулалт</CardTitle>
                <CardDescription>Үйлчилгээ хайгч хэрэглэгч болохын тулд дараах мэдээллийг оруулна уу</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor="idCardFront">Иргэний үнэмлэхний урд тал</Label>
                    <div className="mt-2">
                      <Input
                        id="idCardFront"
                        type="file"
                        accept="image/*"
                        ref={idCardFrontRef}
                        onChange={(e) => handleImageChange(e, "idCardFront")}
                        className="mb-2"
                      />
                      {previews.idCardFront && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.idCardFront || "/placeholder.svg"}
                            alt="Иргэний үнэмлэхний урд тал"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="idCardBack">Иргэний үнэмлэхний ард тал</Label>
                    <div className="mt-2">
                      <Input
                        id="idCardBack"
                        type="file"
                        accept="image/*"
                        ref={idCardBackRef}
                        onChange={(e) => handleImageChange(e, "idCardBack")}
                        className="mb-2"
                      />
                      {previews.idCardBack && (
                        <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                          <img
                            src={previews.idCardBack || "/placeholder.svg"}
                            alt="Иргэний үнэмлэхний ард тал"
                            className="max-h-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Анхааруулга:</strong> Бид таны хувийн мэдээллийг маш сайн нууцлан хамгаалах болно. Таны
                    оруулсан баримт бичгүүд зөвхөн баталгаажуулалтын зорилгоор ашиглагдана.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms-seeker" checked={formData.agreedToTerms} onCheckedChange={handleCheckboxChange} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms-seeker"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Үйлчилгээний нөхцөл
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Би энэхүү платформд худал мэдээлэл, зар оруулахгүй бөгөөд үйлчилгээний нөхцөлийг хүлээн зөвшөөрч
                      байна.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Баталгаажуулж байна...
                    </>
                  ) : (
                    "Баталгаажуулах"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
