"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Shield, Loader2, ImageIcon } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { auth, database } from "@/lib/firebase"
import { ref as dbRef, update, remove, onValue } from "firebase/database"
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"

export default function AdminSettings() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Mongolia Transportation Platform",
    siteDescription: "A platform for transportation services in Mongolia",
    contactEmail: "contact@example.com",
    logoData: "", // Base64 encoded logo data
    contactPhone: "",
    address: "",
  })

  const [verificationSettings, setVerificationSettings] = useState({
    requireVerification: true,
    autoVerifyUsers: false,
  })

  const [bookingSettings, setBookingSettings] = useState({
    enableBookings: true,
    commissionRate: 5,
    allowCancellations: true,
  })

  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    siteName: "",
    siteDescription: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    logoData: "",
  })

  // Fetch settings from Firebase on component mount
  useEffect(() => {
    const fetchSettings = () => {
      setIsLoading(true)

      // Fetch general settings
      const generalSettingsRef = dbRef(database, "settings/general")
      onValue(
        generalSettingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            setGeneralSettings((prev) => ({
              ...prev,
              ...data,
            }))
            setFormData(data)
          }
          setIsLoading(false)
        },
        (error) => {
          console.error("Error fetching general settings:", error)
          setIsLoading(false)
        },
      )

      // Fetch verification settings
      const verificationSettingsRef = dbRef(database, "settings/verification")
      onValue(verificationSettingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setVerificationSettings(snapshot.val())
        }
      })

      // Fetch booking settings
      const bookingSettingsRef = dbRef(database, "settings/booking")
      onValue(bookingSettingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setBookingSettings(snapshot.val())
        }
      })
    }

    fetchSettings()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveSettings = async (settingsType: string) => {
    try {
      let settingsData = {}
      setSaveStatus(null)

      switch (settingsType) {
        case "general":
          // If there's a new logo file, convert it to base64
          if (logoFile) {
            setIsUploading(true)

            // Convert the file to base64
            const base64Data = await convertFileToBase64(logoFile)

            // Update the logo data in the settings
            settingsData = {
              ...generalSettings,
              logoData: base64Data,
            }

            // Update local state
            setGeneralSettings((prev) => ({
              ...prev,
              logoData: base64Data,
            }))

            setIsUploading(false)
          } else {
            settingsData = { ...generalSettings }
          }
          break
        case "verification":
          settingsData = { ...verificationSettings }
          break
        case "booking":
          settingsData = { ...bookingSettings }
          break
        default:
          throw new Error("Unknown settings type")
      }

      // Save settings to Firebase
      const settingsRef = dbRef(database, `settings/${settingsType}`)
      await update(settingsRef, settingsData)

      setSaveStatus({
        success: true,
        message: "Тохиргоо амжилттай хадгалагдлаа",
      })

      // Clear logo preview and file after successful upload
      if (settingsType === "general" && logoFile) {
        setLogoFile(null)
        setLogoPreview(null)
      }

      setTimeout(() => {
        setSaveStatus(null)
      }, 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveStatus({
        success: false,
        message: "Тохиргоо хадгалахад алдаа гарлаа",
      })
      setIsUploading(false)
    }
  }

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleDeleteLogo = async () => {
    try {
      if (generalSettings.logoData) {
        // Update settings in Firebase
        const settingsRef = dbRef(database, "settings/general")
        await update(settingsRef, {
          ...generalSettings,
          logoData: "",
        })

        // Update local state
        setGeneralSettings((prev) => ({
          ...prev,
          logoData: "",
        }))

        setSaveStatus({
          success: true,
          message: "Лого амжилттай устгагдлаа",
        })

        setTimeout(() => {
          setSaveStatus(null)
        }, 3000)
      }
    } catch (error) {
      console.error("Error deleting logo:", error)
      setSaveStatus({
        success: false,
        message: "Лого устгахад алдаа гарлаа",
      })
    }
  }

  const handleDeleteAdmin = async () => {
    if (!password) {
      setDeleteError("Нууц үгээ оруулна уу")
      return
    }

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const user = auth.currentUser
      if (!user) {
        throw new Error("User not logged in")
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, password)
      await reauthenticateWithCredential(user, credential)

      // Delete user data from database
      const userRef = dbRef(database, `users/${user.uid}`)
      await remove(userRef)

      // Delete user account
      await deleteUser(user)

      // Redirect to home page
      window.location.href = "/"
    } catch (error: any) {
      console.error("Error deleting admin:", error)
      if (error.code === "auth/wrong-password") {
        setDeleteError("Нууц үг буруу байна")
      } else {
        setDeleteError("Админ устгахад алдаа гарлаа")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const updateSettings = async (updates: any) => {
    const settingsRef = dbRef(database, "settings/general")
    await update(settingsRef, updates)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings({
        siteName: formData.siteName,
        siteDescription: formData.siteDescription,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        logoData: formData.logoData,
      })
      toast({
        title: "Амжилттай хадгалагдлаа",
        description: "Сайтын тохиргоо амжилттай шинэчлэгдлээ.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Тохиргоо хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="lg:pl-64 p-8 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2">Тохиргоо ачаалж байна...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="lg:pl-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Системийн тохиргоо</h1>

        {saveStatus && (
          <Alert
            className={`mb-6 ${saveStatus.success ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{saveStatus.success ? "Амжилттай" : "Алдаа"}</AlertTitle>
            <AlertDescription>{saveStatus.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">Ерөнхий тохиргоо</TabsTrigger>
            <TabsTrigger value="verification">Баталгаажуулалт</TabsTrigger>
            <TabsTrigger value="booking">Захиалга</TabsTrigger>
            <TabsTrigger value="admin">Админ тохиргоо</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Ерөнхий тохиргоо</CardTitle>
                <CardDescription>Системийн үндсэн тохиргоонууд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Сайтын нэр</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Сайтын тайлбар</Label>
                  <Input
                    id="siteDescription"
                    value={formData.siteDescription}
                    onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Холбоо барих имэйл</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Холбоо барих утас</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Хаяг</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Сайтын лого</Label>

                  {/* Current logo display */}
                  {generalSettings.logoData && (
                    <div className="mb-4 border rounded-md p-4 flex flex-col items-center">
                      <div className="relative w-48 h-48 mb-2">
                        <Image
                          src={generalSettings.logoData || "/placeholder.svg"}
                          alt="Сайтын лого"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button variant="destructive" size="sm" onClick={handleDeleteLogo}>
                        Лого устгах
                      </Button>
                    </div>
                  )}

                  {/* Logo preview */}
                  {logoPreview && !generalSettings.logoData && (
                    <div className="mb-4 border rounded-md p-4 flex justify-center">
                      <div className="relative w-48 h-48">
                        <Image
                          src={logoPreview || "/placeholder.svg"}
                          alt="Шинэ лого"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Logo upload */}
                  {!logoPreview && !generalSettings.logoData && (
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">PNG, JPG, GIF файл оруулна уу</p>
                      <p className="text-xs text-gray-400 mb-4">Зөвлөмж: 200x200 хэмжээтэй</p>
                      <Label
                        htmlFor="logo-upload"
                        className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
                      >
                        Лого сонгох
                      </Label>
                    </div>
                  )}

                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Баталгаажуулалтын тохиргоо</CardTitle>
                <CardDescription>Хэрэглэгчийн баталгаажуулалтын тохиргоонууд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requireVerification">Баталгаажуулалт шаардах</Label>
                    <p className="text-sm text-muted-foreground">
                      Хэрэглэгчид үйлчилгээ үзүүлэхийн өмнө баталгаажуулалт хийлгэх шаардлагатай
                    </p>
                  </div>
                  <Switch
                    id="requireVerification"
                    checked={verificationSettings.requireVerification}
                    onCheckedChange={(checked) =>
                      setVerificationSettings({ ...verificationSettings, requireVerification: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoVerifyUsers">Автоматаар баталгаажуулах</Label>
                    <p className="text-sm text-muted-foreground">Шинэ хэрэглэгчдийг автоматаар баталгаажуулах</p>
                  </div>
                  <Switch
                    id="autoVerifyUsers"
                    checked={verificationSettings.autoVerifyUsers}
                    onCheckedChange={(checked) =>
                      setVerificationSettings({ ...verificationSettings, autoVerifyUsers: checked })
                    }
                  />
                </div>

                <Button onClick={() => handleSaveSettings("verification")}>Хадгалах</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            <Card>
              <CardHeader>
                <CardTitle>Захиалгын тохиргоо</CardTitle>
                <CardDescription>Захиалгын системийн тохиргоонууд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableBookings">Захиалга идэвхжүүлэх</Label>
                    <p className="text-sm text-muted-foreground">
                      Захиалгын системийг идэвхжүүлэх эсвэл идэвхгүй болгох
                    </p>
                  </div>
                  <Switch
                    id="enableBookings"
                    checked={bookingSettings.enableBookings}
                    onCheckedChange={(checked) => setBookingSettings({ ...bookingSettings, enableBookings: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Шимтгэлийн хувь (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={bookingSettings.commissionRate}
                    onChange={(e) => setBookingSettings({ ...bookingSettings, commissionRate: Number(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowCancellations">Цуцлалт зөвшөөрөх</Label>
                    <p className="text-sm text-muted-foreground">Хэрэглэгчид захиалгаа цуцлах боломжтой эсэх</p>
                  </div>
                  <Switch
                    id="allowCancellations"
                    checked={bookingSettings.allowCancellations}
                    onCheckedChange={(checked) =>
                      setBookingSettings({ ...bookingSettings, allowCancellations: checked })
                    }
                  />
                </div>

                <Button onClick={() => handleSaveSettings("booking")}>Хадгалах</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Админ тохиргоо</CardTitle>
                <CardDescription>Админ хэрэглэгчийн тохиргоонууд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="mb-4">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Аюулгүй байдлын анхааруулга</AlertTitle>
                  <AlertDescription>
                    Админ хэрэглэгчийг устгах нь системийн удирдлагад нэвтрэх боломжийг хаана. Энэ үйлдлийг хийхийн өмнө
                    өөр админ хэрэглэгч үүсгэсэн эсэхийг шалгана уу.
                  </AlertDescription>
                </Alert>

                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  Админ хэрэглэгч устгах
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Админ хэрэглэгч устгах</DialogTitle>
              <DialogDescription>
                Та админ хэрэглэгчээ устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
              </DialogDescription>
            </DialogHeader>

            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Алдаа</AlertTitle>
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Нууц үг баталгаажуулах</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Нууц үгээ оруулна уу"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Цуцлах
              </Button>
              <Button variant="destructive" onClick={handleDeleteAdmin} disabled={isDeleting}>
                {isDeleting ? "Устгаж байна..." : "Устгах"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
