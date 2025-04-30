"use client"

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Loader2 } from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, get, update } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { aimags } from "@/lib/location-data"

export default function EditPostPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [postType, setPostType] = useState("province")
  const [serviceType, setServiceType] = useState("provider")
  const [providerType, setProviderType] = useState("passenger")
  const [seekerType, setSeekerType] = useState("ride")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
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
    district: "",
  })

  // Check if user is logged in
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Анхааруулга",
        description: "Зар засахын тулд нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    // Fetch post data
    const fetchPost = async () => {
      try {
        const postRef = ref(database, `posts/${id}`)
        const snapshot = await get(postRef)

        if (!snapshot.exists()) {
          toast({
            title: "Алдаа",
            description: "Зар олдсонгүй",
            variant: "destructive",
          })
          router.push("/profile")
          return
        }

        const postData = snapshot.val()

        // Check if the post belongs to the current user
        if (postData.userId !== user?.uid) {
          toast({
            title: "Анхааруулга",
            description: "Та зөвхөн өөрийн зарыг засах боломжтой",
            variant: "destructive",
          })
          router.push("/profile")
          return
        }

        // Set post type and service type
        setPostType(postData.postType || "province")
        setServiceType(postData.serviceType || "provider")
        setProviderType(postData.providerType || "passenger")
        setSeekerType(postData.seekerType || "ride")

        // Set image preview if exists
        if (postData.image) {
          setImagePreview(postData.image)
          setImageBase64(postData.image)
        }

        // Handle from/to location
        if (postData.fromAimag) {
          setSelectedFromAimag(postData.fromAimag)
          setFromType("sum")
        }

        if (postData.toAimag) {
          setSelectedToAimag(postData.toAimag)
          setToType("sum")
        }

        // Set form data
        setFormData({
          name: postData.name || "",
          phone: postData.phone || "",
          from: postData.from || "",
          to: postData.to || "",
          date: postData.date || "",
          time: postData.time || "",
          price: postData.price || "",
          seats: postData.seats || "1",
          carModel: postData.carModel || "",
          cargoType: postData.cargoType || "",
          cargoWeight: postData.cargoWeight || "",
          cargoSize: postData.cargoSize || "",
          description: postData.description || "",
          district: postData.district || "",
          fromDistrict: postData.fromDistrict || "",
          toDistrict: postData.toDistrict || "",
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching post:", error)
        toast({
          title: "Алдаа",
          description: "Зар ачаалахад алдаа гарлаа",
          variant: "destructive",
        })
        router.push("/profile")
      }
    }

    if (user && id) {
      fetchPost()
    }
  }, [id, user, loading, router, toast])

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
    const file = e.target.files?.[0]
    if (!file) return

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
      setImagePreview(base64)
      setImageBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create post data object based on the current form type
      const postData: Record<string, any> = {
        ...formData,
        image: imageBase64 || null,
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

      // Update in Firebase Realtime Database
      const postRef = ref(database, `posts/${id}`)
      await update(postRef, postData)

      // Show success message
      toast({
        title: "Амжилттай",
        description: "Таны зар амжилттай шинэчлэгдлээ",
      })

      // Redirect to profile page
      router.push("/profile")
    } catch (error) {
      console.error("Error updating post:", error)
      toast({
        title: "Алдаа",
        description: "Зар шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || isLoading) {
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

  // Helper function to extract sum value from "aimag:sum" format
  const extractSumValue = (location: string): string => {
    if (!location) return ""
    if (location.includes(":")) {
      return location.split(":")[1]
    }
    return location === selectedFromAimag || location === selectedToAimag ? "aimag-center" : location
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/profile" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Профайл руу буцах
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Зар засах</h1>

      {postType === "province" ? (
        <div className="p-4 border rounded-lg mt-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Зарын төрөл</h3>
            <RadioGroup value={serviceType} className="flex flex-wrap gap-4" onValueChange={setServiceType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="provider" id="provider-option" />
                <Label htmlFor="provider-option">Үйлчилгээ үзүүлэгч</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="seeker" id="seeker-option" />
                <Label htmlFor="seeker-option">Үйлчилгээ хайх</Label>
              </div>
            </RadioGroup>
          </div>

          {serviceType === "provider" && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Үйлчилгээний төрөл</h3>
              <RadioGroup value={providerType} className="flex flex-wrap gap-4" onValueChange={setProviderType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="passenger" id="passenger-transport" />
                  <Label htmlFor="passenger-transport">Зорчигч тээвэрлэх</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cargo" id="cargo-transport" />
                  <Label htmlFor="cargo-transport">Ачаа тээвэрлэх</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {serviceType === "seeker" && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Үйлчилгээний төрөл</h3>
              <RadioGroup value={seekerType} className="flex flex-wrap gap-4" onValueChange={setSeekerType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ride" id="ride-seeking" />
                  <Label htmlFor="ride-seeking">Унаа хайж байгаа</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cargo" id="cargo-seeking" />
                  <Label htmlFor="cargo-seeking">Ачаа тавиж явуулах унаа хайж байгаа</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Common fields for all province forms */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Нэр</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Таны нэр"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Таны бүртгэлтэй нэр автоматаар оруулагдсан</p>
              </div>

              <div>
                <Label htmlFor="phone">Утасны дугаар</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Жишээ: 99112233"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Таны бүртгэлтэй утасны дугаар автоматаар оруулагдсан
                </p>
              </div>

              <div>
                <Label htmlFor="from">Хаанаас</Label>
                {fromType === "aimag" ? (
                  <Select onValueChange={(value) => handleSelectChange("from", value)} required>
                    <SelectTrigger id="from">
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
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-muted-foreground mb-2">
                        Аймаг: {getAimagLabel(selectedFromAimag)}
                      </span>
                    </div>
                    <Select
                      defaultValue={extractSumValue(formData.from)}
                      onValueChange={(value) => handleSelectChange("from", value)}
                      required
                    >
                      <SelectTrigger id="from">
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
                        className="p-0 h-auto text-xs text-muted-foreground"
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
                <Label htmlFor="to">Хаашаа</Label>
                {toType === "aimag" ? (
                  <Select onValueChange={(value) => handleSelectChange("to", value)} required>
                    <SelectTrigger id="to">
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
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-muted-foreground mb-2">
                        Аймаг: {getAimagLabel(selectedToAimag)}
                      </span>
                    </div>
                    <Select
                      defaultValue={extractSumValue(formData.to)}
                      onValueChange={(value) => handleSelectChange("to", value)}
                      required
                    >
                      <SelectTrigger id="to">
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
                        className="p-0 h-auto text-xs text-muted-foreground"
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

              <div>
                <Label htmlFor="date">Огноо</Label>
                <Input id="date" type="date" value={formData.date} onChange={handleInputChange} required />
              </div>

              <div>
                <Label htmlFor="time">Цаг</Label>
                <Input id="time" type="time" value={formData.time} onChange={handleInputChange} required />
              </div>

              <div>
                <Label htmlFor="price">Үнэ (₮)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Жишээ: 25000"
                  required
                />
              </div>

              {/* Fields specific to provider-passenger */}
              {serviceType === "provider" && providerType === "passenger" && (
                <>
                  <div>
                    <Label htmlFor="seats">Сул суудлын тоо</Label>
                    <Input
                      id="seats"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.seats}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="carModel">Машины марк, модель</Label>
                    <Input
                      id="carModel"
                      value={formData.carModel}
                      onChange={handleInputChange}
                      placeholder="Жишээ: Toyota Prius 20"
                      required
                    />
                  </div>
                </>
              )}

              {/* Fields specific to provider-cargo */}
              {serviceType === "provider" && providerType === "cargo" && (
                <>
                  <div>
                    <Label htmlFor="carModel">Машины марк, модель</Label>
                    <Input
                      id="carModel"
                      value={formData.carModel}
                      onChange={handleInputChange}
                      placeholder="Жишээ: Toyota Hiace"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargoWeight">Ачааны жин хязгаар (кг)</Label>
                    <Input
                      id="cargoWeight"
                      type="number"
                      value={formData.cargoWeight}
                      onChange={handleInputChange}
                      placeholder="Жишээ: 500"
                    />
                  </div>
                </>
              )}

              {/* Fields specific to seeker-cargo */}
              {serviceType === "seeker" && seekerType === "cargo" && (
                <>
                  <div>
                    <Label htmlFor="cargoType">Ачааны төрөл</Label>
                    <Input
                      id="cargoType"
                      value={formData.cargoType}
                      onChange={handleInputChange}
                      placeholder="Жишээ: Тавилга"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargoWeight">Ачааны жин (кг)</Label>
                    <Input
                      id="cargoWeight"
                      type="number"
                      value={formData.cargoWeight}
                      onChange={handleInputChange}
                      placeholder="Жишээ: 50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargoSize">Ачааны хэмжээ</Label>
                    <Input
                      id="cargoSize"
                      value={formData.cargoSize}
                      onChange={handleInputChange}
                      placeholder="Жишээ: 1м x 1м x 0.5м"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <Label htmlFor="description">Нэмэлт мэдээлэл</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Нэмэлт мэдээлэл оруулах..."
                  className="h-24"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="image">Зураг (заавал биш)</Label>
                <div className="mt-2">
                  <Input
                    id="image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground mb-2">Зургийн хэмжээ 1MB-с бага байх ёстой</p>
                  {imagePreview && (
                    <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-h-40 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  "Хадгалах"
                )}
              </Button>
              <Link href="/profile">
                <Button type="button" variant="outline" className="w-full md:w-auto">
                  Цуцлах
                </Button>
              </Link>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 border rounded-lg mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Нэр</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Таны нэр"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Таны бүртгэлтэй нэр автоматаар оруулагдсан</p>
              </div>

              <div>
                <Label htmlFor="phone">Утасны дугаар</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Жишээ: 99112233"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Таны бүртгэлтэй утасны дугаар автоматаар оруулагдсан
                </p>
              </div>

              <div>
                <Label htmlFor="fromDistrict">Хаанаас (Дүүрэг)</Label>
                <Select
                  defaultValue={formData.fromDistrict}
                  onValueChange={(value) => handleSelectChange("fromDistrict", value)}
                  required
                >
                  <SelectTrigger id="fromDistrict">
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
                <Label htmlFor="toDistrict">Хаашаа (Дүүрэг)</Label>
                <Select
                  defaultValue={formData.toDistrict}
                  onValueChange={(value) => handleSelectChange("toDistrict", value)}
                  required
                >
                  <SelectTrigger id="toDistrict">
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
                <Label htmlFor="price">Үнэ (₮)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Жишээ: 5000"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Үйлчилгээний дэлгэрэнгүй</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Үйлчилгээний талаар дэлгэрэнгүй мэдээлэл..."
                  className="h-24"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="image">Зураг (заавал биш)</Label>
                <div className="mt-2">
                  <Input
                    id="image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground mb-2">Зургийн хэмжээ 1MB-с бага байх ёстой</p>
                  {imagePreview && (
                    <div className="mt-2 border rounded-md p-2 w-full max-w-xs">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="max-h-40 object-contain mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Хадгалж байна...
                  </>
                ) : (
                  "Хадгалах"
                )}
              </Button>
              <Link href="/profile">
                <Button type="button" variant="outline" className="w-full md:w-auto">
                  Цуцлах
                </Button>
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
