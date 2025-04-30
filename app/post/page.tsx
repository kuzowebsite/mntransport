"use client"

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  ImageIcon,
  Truck,
  Car,
  X,
  AlertCircle,
  Globe,
  Clock,
  DollarSign,
  MessageCircle,
  Users,
  Package,
  Weight,
  Ruler,
} from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, push, set } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { aimags } from "@/lib/location-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

export default function PostPage() {
  const { toast } = useToast()
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [postType, setPostType] = useState("province")
  const [serviceType, setServiceType] = useState("provider")
  const [providerType, setProviderType] = useState("passenger")
  const [seekerType, setSeekerType] = useState("ride")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [imageBase64, setImageBase64] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fromType, setFromType] = useState<"aimag" | "sum">("aimag")
  const [toType, setToType] = useState<"aimag" | "sum">("aimag")
  const [selectedFromAimag, setSelectedFromAimag] = useState<string | null>(null)
  const [selectedToAimag, setSelectedToAimag] = useState<string | null>(null)

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    from: "",
    to: "",
    date: "",
    time: "",
    price: "",
    seats: "1",
    carModel: "",
    cargoType: "",
    cargoWeight: "",
    cargoSize: "",
    description: "",
    fromDistrict: "",
    toDistrict: "",
  })

  // Check if user is logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Анхааруулга",
        description: "Зар оруулахын тулд нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      router.push("/auth/login")
    }
  }, [user, loading, router, toast])

  // Populate user data when available
  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        phone: userData.phone || "",
      }))
    }
  }, [userData])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    // Don't allow changing name and phone fields
    if (id !== "name" && id !== "phone") {
      setFormData((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleSelectChange = (id: string, value: string) => {
    if (id === "from") {
      // Check if this is an aimag selection
      const isAimag = aimags.some((aimag) => aimag.value === value)
      if (isAimag) {
        setSelectedFromAimag(value)
        setFromType("sum")
        // Don't set the form data yet, wait for sum selection
      } else {
        // This is a sum selection
        if (selectedFromAimag) {
          if (value === "aimag-center") {
            // If "Аймгийн төв" is selected, use the aimag name directly
            setFormData((prev) => ({ ...prev, [id]: selectedFromAimag }))
          } else {
            // Format as "aimag:sum"
            setFormData((prev) => ({ ...prev, [id]: `${selectedFromAimag}:${value}` }))
          }
        }
      }
    } else if (id === "to") {
      // Check if this is an aimag selection
      const isAimag = aimags.some((aimag) => aimag.value === value)
      if (isAimag) {
        setSelectedToAimag(value)
        setToType("sum")
        // Don't set the form data yet, wait for sum selection
      } else {
        // This is a sum selection
        if (selectedToAimag) {
          if (value === "aimag-center") {
            // If "Аймгийн төв" is selected, use the aimag name directly
            setFormData((prev) => ({ ...prev, [id]: selectedToAimag }))
          } else {
            // Format as "aimag:sum"
            setFormData((prev) => ({ ...prev, [id]: `${selectedToAimag}:${value}` }))
          }
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }))
    }
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed the 5 image limit
    if (imagePreview.length + files.length > 5) {
      toast({
        title: "Анхааруулга",
        description: "Хамгийн ихдээ 5 зураг оруулах боломжтой",
        variant: "destructive",
      })
      return
    }

    // Process each file
    Array.from(files).forEach((file) => {
      // Check file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "Алдаа",
          description: "Зургийн хэмжээ 1MB-с бага байх ёстой",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setImagePreview((prev) => [...prev, base64])
        setImageBase64((prev) => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })

    // Reset file input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
    setImageBase64((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Check if images are required for province posts
      if (postType === "province" && imageBase64.length === 0) {
        toast({
          title: "Анхааруулга",
          description: "Аймаг, сум хоорондын зарт заавал зураг оруулах шаардлагатай",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create post data object based on the current form type
      const postData: Record<string, any> = {
        ...formData,
        createdAt: new Date().toISOString(),
        images: imageBase64.length > 0 ? imageBase64 : null,
        userId: user?.uid,
        fromType: fromType,
        toType: toType,
        fromAimag: selectedFromAimag,
        toAimag: selectedToAimag,
        verificationStatus: userData?.verificationStatus || "none",
      }

      // Add type information based on selected options
      if (postType === "province") {
        postData.postType = "province"

        if (serviceType === "provider") {
          postData.serviceType = "provider"
          postData.providerType = providerType
        } else {
          postData.serviceType = "seeker"
          postData.seekerType = seekerType
        }
      } else {
        postData.postType = "delivery"
      }

      // Save to Firebase Realtime Database
      const postsRef = ref(database, "posts")
      const newPostRef = push(postsRef)
      await set(newPostRef, postData)

      // Show success message
      toast({
        title: "Амжилттай",
        description: "Таны зар амжилттай нийтлэгдлээ",
      })

      // Reset form except name and phone
      setFormData((prev) => ({
        ...{
          name: prev.name,
          phone: prev.phone,
          from: "",
          to: "",
          date: "",
          time: "",
          price: "",
          seats: "1",
          carModel: "",
          cargoType: "",
          cargoWeight: "",
          cargoSize: "",
          description: "",
          fromDistrict: "",
          toDistrict: "",
        },
      }))
      setFromType("aimag")
      setToType("aimag")
      setSelectedFromAimag(null)
      setSelectedToAimag(null)
      setImagePreview([])
      setImageBase64([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error submitting post:", error)
      toast({
        title: "Алдаа",
        description: "Зар оруулахад алдаа гарлаа. Дахин оролдоно уу.",
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

  // Helper function to get the selected aimag label
  const getAimagLabel = (aimagValue: string | null) => {
    if (!aimagValue) return ""
    const aimag = aimags.find((a) => a.value === aimagValue)
    return aimag ? aimag.label : ""
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Нүүр хуудас руу буцах
        </Link>
      </div>

      <Card className="shadow-sm border-0 overflow-hidden">
        <CardHeader className="bg-white border-b pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Зар оруулах</CardTitle>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Нийтэд</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-4 pb-0">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={userData?.photoURL || "/placeholder.svg?height=40&width=40&query=user"}
                  alt={userData?.name || "Хэрэглэгч"}
                />
                <AvatarFallback>{userData?.name?.charAt(0) || "Х"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userData?.name || "Хэрэглэгч"}</p>
                <p className="text-xs text-muted-foreground">{userData?.phone || ""}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="province" onValueChange={setPostType} className="w-full">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="province" className="text-base py-2">
                  <MapPin className="mr-2 h-4 w-4" />
                  Аймаг, сум хооронд
                </TabsTrigger>
                <TabsTrigger value="delivery" className="text-base py-2">
                  <Truck className="mr-2 h-4 w-4" />
                  Хүргэлт
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="province" className="m-0">
              <div className="px-4 py-2">
                <div className="bg-muted/20 p-3 rounded-lg mb-4">
                  <h3 className="text-sm font-medium mb-2">Та ямар зар оруулах вэ?</h3>
                  <RadioGroup defaultValue="provider" className="flex flex-wrap gap-2" onValueChange={setServiceType}>
                    <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                      <RadioGroupItem value="provider" id="provider-option" />
                      <Label htmlFor="provider-option" className="text-sm cursor-pointer">
                        Үйлчилгээ үзүүлэгч
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                      <RadioGroupItem value="seeker" id="seeker-option" />
                      <Label htmlFor="seeker-option" className="text-sm cursor-pointer">
                        Үйлчилгээ хайх
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {serviceType === "provider" && (
                  <div className="bg-muted/20 p-3 rounded-lg mb-4">
                    <h3 className="text-sm font-medium mb-2">Үйлчилгээний төрөл</h3>
                    <RadioGroup
                      defaultValue="passenger"
                      className="flex flex-wrap gap-2"
                      onValueChange={setProviderType}
                    >
                      <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                        <RadioGroupItem value="passenger" id="passenger-transport" />
                        <Label htmlFor="passenger-transport" className="text-sm cursor-pointer">
                          Зорчигч тээвэрлэх
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                        <RadioGroupItem value="cargo" id="cargo-transport" />
                        <Label htmlFor="cargo-transport" className="text-sm cursor-pointer">
                          Ачаа тээвэрлэх
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {serviceType === "seeker" && (
                  <div className="bg-muted/20 p-3 rounded-lg mb-4">
                    <h3 className="text-sm font-medium mb-2">Үйлчилгээний төрөл</h3>
                    <RadioGroup defaultValue="ride" className="flex flex-wrap gap-2" onValueChange={setSeekerType}>
                      <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                        <RadioGroupItem value="ride" id="ride-seeking" />
                        <Label htmlFor="ride-seeking" className="text-sm cursor-pointer">
                          Унаа хайж байгаа
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
                        <RadioGroupItem value="cargo" id="cargo-seeking" />
                        <Label htmlFor="cargo-seeking" className="text-sm cursor-pointer">
                          Ачаа тавих унаа хайж байгаа
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Аялалын чиглэл
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="from" className="text-xs font-medium">
                          Хаанаас
                        </Label>
                        {fromType === "aimag" ? (
                          <Select onValueChange={(value) => handleSelectChange("from", value)} required>
                            <SelectTrigger id="from" className="mt-1 text-sm">
                              <SelectValue placeholder="Аймаг сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              {aimags.map((aimag) => (
                                <SelectItem key={aimag.value} value={aimag.value}>
                                  {aimag.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                Аймаг: {getAimagLabel(selectedFromAimag)}
                              </span>
                            </div>
                            <Select onValueChange={(value) => handleSelectChange("from", value)} required>
                              <SelectTrigger id="from" className="text-sm">
                                <SelectValue placeholder="Сум сонгох" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aimag-center">Аймгийн төв</SelectItem>
                                <SelectItem value="all">Бүх сум</SelectItem>
                                {selectedFromAimag &&
                                  aimags
                                    .find((aimag) => aimag.value === selectedFromAimag)
                                    ?.sums.map((sum) => (
                                      <SelectItem key={sum.value} value={sum.value}>
                                        {sum.label}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs text-primary"
                                onClick={() => {
                                  setFromType("aimag")
                                  setSelectedFromAimag(null)
                                  setFormData((prev) => ({ ...prev, from: "" }))
                                }}
                              >
                                Аймаг дахин сонгох
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="to" className="text-xs font-medium">
                          Хаашаа
                        </Label>
                        {toType === "aimag" ? (
                          <Select onValueChange={(value) => handleSelectChange("to", value)} required>
                            <SelectTrigger id="to" className="mt-1 text-sm">
                              <SelectValue placeholder="Аймаг сонгох" />
                            </SelectTrigger>
                            <SelectContent>
                              {aimags.map((aimag) => (
                                <SelectItem key={aimag.value} value={aimag.value}>
                                  {aimag.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="space-y-1 mt-1">
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                Аймаг: {getAimagLabel(selectedToAimag)}
                              </span>
                            </div>
                            <Select onValueChange={(value) => handleSelectChange("to", value)} required>
                              <SelectTrigger id="to" className="text-sm">
                                <SelectValue placeholder="Сум сонгох" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aimag-center">Аймгийн төв</SelectItem>
                                <SelectItem value="all">Бүх сум</SelectItem>
                                {selectedToAimag &&
                                  aimags
                                    .find((aimag) => aimag.value === selectedToAimag)
                                    ?.sums.map((sum) => (
                                      <SelectItem key={sum.value} value={sum.value}>
                                        {sum.label}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                            <div className="flex items-center">
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs text-primary"
                                onClick={() => {
                                  setToType("aimag")
                                  setSelectedToAimag(null)
                                  setFormData((prev) => ({ ...prev, to: "" }))
                                }}
                              >
                                Аймаг дахин сонгох
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <Clock className="h-4 w-4" />
                      Аялалын хугацаа ба үнэ
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor="date" className="text-xs font-medium">
                          Огноо
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="time" className="text-xs font-medium">
                          Цаг
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          required
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="price" className="text-xs font-medium flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Үнэ (₮)
                        </Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="Жишээ: 25000"
                          required
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fields specific to provider-passenger */}
                  {serviceType === "provider" && providerType === "passenger" && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Car className="h-4 w-4" />
                          <Users className="h-4 w-4" />
                          Тээврийн хэрэгслийн мэдээлэл
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="seats" className="text-xs font-medium flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              Сул суудлын тоо
                            </Label>
                            <Input
                              id="seats"
                              type="number"
                              min="1"
                              max="10"
                              value={formData.seats}
                              onChange={handleInputChange}
                              required
                              className="mt-1 text-sm"
                            />
                          </div>

                          <div>
                            <Label htmlFor="carModel" className="text-xs font-medium flex items-center">
                              <Car className="h-3 w-3 mr-1" />
                              Машины марк, модель
                            </Label>
                            <Input
                              id="carModel"
                              value={formData.carModel}
                              onChange={handleInputChange}
                              placeholder="Жишээ: Toyota Prius 20"
                              required
                              className="mt-1 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fields specific to provider-cargo */}
                  {serviceType === "provider" && providerType === "cargo" && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Truck className="h-4 w-4" />
                          Тээврийн хэрэгслийн мэдээлэл
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="carModel" className="text-xs font-medium flex items-center">
                              <Truck className="h-3 w-3 mr-1" />
                              Машины марк, модель
                            </Label>
                            <Input
                              id="carModel"
                              value={formData.carModel}
                              onChange={handleInputChange}
                              placeholder="Жишээ: Toyota Hiace"
                              required
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cargoWeight" className="text-xs font-medium flex items-center">
                              <Weight className="h-3 w-3 mr-1" />
                              Ачааны жин хязгаар (кг)
                            </Label>
                            <Input
                              id="cargoWeight"
                              type="number"
                              value={formData.cargoWeight}
                              onChange={handleInputChange}
                              placeholder="Жишээ: 500"
                              className="mt-1 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fields specific to seeker-cargo */}
                  {serviceType === "seeker" && seekerType === "cargo" && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Package className="h-4 w-4" />
                          Ачааны мэдээлэл
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="cargoType" className="text-xs font-medium">
                              Ачааны төрөл
                            </Label>
                            <Input
                              id="cargoType"
                              value={formData.cargoType}
                              onChange={handleInputChange}
                              placeholder="Жишээ: Тавилга"
                              required
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cargoWeight" className="text-xs font-medium flex items-center">
                              <Weight className="h-3 w-3 mr-1" />
                              Ачааны жин (кг)
                            </Label>
                            <Input
                              id="cargoWeight"
                              type="number"
                              value={formData.cargoWeight}
                              onChange={handleInputChange}
                              placeholder="Жишээ: 50"
                              className="mt-1 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cargoSize" className="text-xs font-medium flex items-center">
                              <Ruler className="h-3 w-3 mr-1" />
                              Ачааны хэмжээ
                            </Label>
                            <Input
                              id="cargoSize"
                              value={formData.cargoSize}
                              onChange={handleInputChange}
                              placeholder="Жишээ: 1м x 1м x 0.5м"
                              className="mt-1 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      Нэмэлт мэдээлэл
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="description" className="text-xs font-medium">
                          Нэмэлт мэдээлэл
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Нэмэлт мэдээлэл оруулах..."
                          className="h-20 mt-1 text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="image" className="text-xs font-medium flex items-center">
                          Зураг <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Alert className="mb-2 bg-amber-50 text-amber-800 border-amber-200 py-2 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <AlertDescription>
                            Аймаг, сум хоорондын зарт заавал зураг оруулах шаардлагатай. Хамгийн ихдээ 5 зураг оруулах
                            боломжтой.
                          </AlertDescription>
                        </Alert>
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Зургийн хэмжээ 1MB-с бага байх ёстой</p>
                          </div>
                          <Input
                            id="image"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="mb-2 text-xs"
                            multiple
                            required
                          />
                          {imagePreview.length > 0 && (
                            <div className="mt-3 grid grid-cols-5 gap-2">
                              {imagePreview.map((src, index) => (
                                <div key={index} className="relative border rounded-md overflow-hidden">
                                  <img
                                    src={src || "/placeholder.svg"}
                                    alt={`Preview ${index + 1}`}
                                    className="h-16 w-full object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-5 w-5 rounded-full"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Оруулж байна...
                        </>
                      ) : (
                        "Зар нийтлэх"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="m-0">
              <form onSubmit={handleSubmit} className="px-4 py-2 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Хүргэлтийн бүс
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="fromDistrict" className="text-xs font-medium">
                        Хаанаас (Дүүрэг)
                      </Label>
                      <Select onValueChange={(value) => handleSelectChange("fromDistrict", value)} required>
                        <SelectTrigger id="fromDistrict" className="mt-1 text-sm">
                          <SelectValue placeholder="Дүүрэг сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bayanzurkh">Баянзүрх</SelectItem>
                          <SelectItem value="sukhbaatar">Сүхбаатар</SelectItem>
                          <SelectItem value="chingeltei">Чингэлтэй</SelectItem>
                          <SelectItem value="bayangol">Баянгол</SelectItem>
                          <SelectItem value="khan-uul">Хан-Уул</SelectItem>
                          <SelectItem value="songino-khairkhan">Сонгино Хайрхан</SelectItem>
                          <SelectItem value="nalaikh">Налайх</SelectItem>
                          <SelectItem value="bagakhangai">Багахангай</SelectItem>
                          <SelectItem value="baganuur">Багануур</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="toDistrict" className="text-xs font-medium">
                        Хаашаа (Дүүрэг)
                      </Label>
                      <Select onValueChange={(value) => handleSelectChange("toDistrict", value)} required>
                        <SelectTrigger id="toDistrict" className="mt-1 text-sm">
                          <SelectValue placeholder="Дүүрэг сонгох" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bayanzurkh">Баянзүрх</SelectItem>
                          <SelectItem value="sukhbaatar">Сүхбаатар</SelectItem>
                          <SelectItem value="chingeltei">Чингэлтэй</SelectItem>
                          <SelectItem value="bayangol">Баянгол</SelectItem>
                          <SelectItem value="khan-uul">Хан-Уул</SelectItem>
                          <SelectItem value="songino-khairkhan">Сонгино Хайрхан</SelectItem>
                          <SelectItem value="nalaikh">Налайх</SelectItem>
                          <SelectItem value="bagakhangai">Багахангай</SelectItem>
                          <SelectItem value="baganuur">Багануур</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Хүргэлтийн үнэ
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-xs font-medium">
                      Үнэ (₮)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Жишээ: 5000"
                      required
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    Нэмэлт мэдээлэл
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="description" className="text-xs font-medium">
                        Үйлчилгээний дэлгэрэнгүй
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Үйлчилгээний талаар дэлгэрэнгүй мэдээлэл..."
                        className="h-20 mt-1 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="image" className="text-xs font-medium">
                        Зураг (заавал биш)
                      </Label>
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <ImageIcon className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Зургийн хэмжээ 1MB-с бага байх ёстой</p>
                        </div>
                        <Input
                          id="image"
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="mb-2 text-xs"
                          multiple
                        />
                        {imagePreview.length > 0 && (
                          <div className="mt-3 grid grid-cols-5 gap-2">
                            {imagePreview.map((src, index) => (
                              <div key={index} className="relative border rounded-md overflow-hidden">
                                <img
                                  src={src || "/placeholder.svg"}
                                  alt={`Preview ${index + 1}`}
                                  className="h-16 w-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-5 w-5 rounded-full"
                                  onClick={() => removeImage(index)}
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Оруулж байна...
                      </>
                    ) : (
                      "Зар нийтлэх"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
