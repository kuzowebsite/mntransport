"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Car,
  Truck,
  Bookmark,
  BookmarkCheck,
  Share2,
  MessageCircle,
  Info,
  CheckCircle2,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Globe,
  ChevronDown,
} from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { useAuth } from "@/contexts/auth-context"
import { useBookmark } from "@/contexts/bookmark-context"
import { useBooking } from "@/contexts/booking-context"
import { useChat } from "@/contexts/chat-context"
import { aimags } from "@/lib/location-data"
import { VerificationBadge } from "@/components/verification-badge"
import { Card, CardContent } from "@/components/ui/card"
import { CreateBooking } from "@/components/booking/create-booking"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function PostDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmark()
  const { getBookingStatus } = useBooking()
  const { startNewChat, setActiveChatId, setChatWidgetVisible, setCurrentRecipientId } = useChat()
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [comment, setComment] = useState("")

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = ref(database, `posts/${id}`)
        const snapshot = await get(postRef)

        if (!snapshot.exists()) {
          setError("Зар олдсонгүй")
          setIsLoading(false)
          return
        }

        const postData = snapshot.val()

        // Fetch the user's verification status
        if (postData.userId) {
          const userRef = ref(database, `users/${postData.userId}`)
          const userSnapshot = await get(userRef)

          if (userSnapshot.exists()) {
            const userData = userSnapshot.val()
            // Add verification status to post data
            postData.providerVerificationStatus = userData.providerVerificationStatus || "none"
            postData.seekerVerificationStatus = userData.seekerVerificationStatus || "none"
            postData.userPhotoURL = userData.photoURL || null
            postData.userName = userData.name || userData.email || "Хэрэглэгч"
          }
        }

        setPost({ id, ...postData })
      } catch (error) {
        console.error("Error fetching post:", error)
        setError("Зар ачаалахад алдаа гарлаа")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchPost()
    }
  }, [id])

  // Get booking status for this post
  const bookingStatus = post ? getBookingStatus(post.id) : null

  // Helper function to get aimag name in Mongolian
  const getAimagName = (aimagValue: string | undefined): string => {
    if (!aimagValue) return ""

    const aimag = aimags.find((a) => a.value === aimagValue)
    return aimag ? aimag.label : aimagValue
  }

  // Helper function to get sum name in Mongolian
  const getSumName = (aimagValue: string | undefined, sumValue: string | undefined): string => {
    if (!aimagValue || !sumValue) return ""

    // If it's an aimag-center, return the aimag name + " (Аймгийн төв)"
    if (sumValue === "aimag-center") {
      return `${getAimagName(aimagValue)} (Аймгийн төв)`
    }

    // If it's "all", return "Бүх сум"
    if (sumValue === "all") {
      return "Бүх сум"
    }

    const aimag = aimags.find((a) => a.value === aimagValue)
    if (!aimag) return sumValue

    const sum = aimag.sums.find((s) => s.value === sumValue)
    return sum ? sum.label : sumValue
  }

  // Function to format location display
  const formatLocation = (): string => {
    if (!post) return ""

    if (post.postType === "delivery") {
      // Get district names in Mongolian
      const districtMap: Record<string, string> = {
        bayanzurkh: "Баянзүрх",
        sukhbaatar: "Сүхбаатар",
        chingeltei: "Чингэлтэй",
        bayangol: "Баянгол",
        "khan-uul": "Хан-Уул",
        "songino-khairkhan": "Сонгино Хайрхан",
        nalaikh: "Налайх",
        bagakhangai: "Багахангай",
        baganuur: "Багануур",
      }

      const fromDistrictName = post.fromDistrict ? districtMap[post.fromDistrict] || post.fromDistrict : ""
      const toDistrictName = post.toDistrict ? districtMap[post.toDistrict] || post.toDistrict : ""

      return `${fromDistrictName} → ${toDistrictName}`
    }

    let fromLocation = ""
    let toLocation = ""

    // Handle from location
    if (post.from) {
      if (post.from.includes(":")) {
        // Format is "aimag:sum"
        const [aimagValue, sumValue] = post.from.split(":")
        const aimagName = getAimagName(aimagValue)
        const sumName = getSumName(aimagValue, sumValue)
        fromLocation = `${aimagName}, ${sumName}`
      } else {
        // It's either just an aimag or aimag-center
        fromLocation = getAimagName(post.from)
      }
    } else if (post.fromAimag) {
      // Fallback to fromAimag if from is not available
      fromLocation = getAimagName(post.fromAimag)
    }

    // Handle to location
    if (post.to) {
      if (post.to.includes(":")) {
        // Format is "aimag:sum"
        const [aimagValue, sumValue] = post.to.split(":")
        const aimagName = getAimagName(aimagValue)
        const sumName = getSumName(aimagValue, sumValue)
        toLocation = `${aimagName}, ${sumName}`
      } else {
        // It's either just an aimag or aimag-center
        toLocation = getAimagName(post.to)
      }
    } else if (post.toAimag) {
      // Fallback to toAimag if to is not available
      toLocation = getAimagName(post.toAimag)
    }

    return `${fromLocation} → ${toLocation}`
  }

  const getServiceTypeText = () => {
    if (!post) return ""

    if (post.postType === "province") {
      if (post.serviceType === "provider") {
        if (post.providerType === "passenger") {
          return "Зорчигч тээвэрлэх"
        } else if (post.providerType === "cargo") {
          return "Ачаа тээвэрлэх"
        }
      } else if (post.serviceType === "seeker") {
        if (post.seekerType === "ride") {
          return "Унаа хайж байна"
        } else if (post.seekerType === "cargo") {
          return "Ачаа тээвэрлэх унаа хайж байна"
        }
      }
    } else if (post.postType === "delivery") {
      return "Хүргэлтийн үйлчилгээ"
    }

    return ""
  }

  const getServiceTypeBadge = () => {
    if (!post) return null

    let color = "bg-gray-100"
    let icon = null

    if (post.postType === "province") {
      if (post.serviceType === "provider") {
        color = "bg-blue-100 text-blue-800"
        icon = <Car className="h-3.5 w-3.5 mr-1" />
      } else if (post.serviceType === "seeker") {
        color = "bg-purple-100 text-purple-800"
        icon = <User className="h-3.5 w-3.5 mr-1" />
      }
    } else if (post.postType === "delivery") {
      color = "bg-green-100 text-green-800"
      icon = <Truck className="h-3.5 w-3.5 mr-1" />
    }

    return (
      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {getServiceTypeText()}
      </div>
    )
  }

  const handleBookmarkToggle = async () => {
    if (post) {
      await toggleBookmark(post.id)
    }
  }

  // Handle sending a message to the post owner
  const handleSendMessage = async () => {
    if (!user || !post || !post.userId) {
      toast({
        title: "Алдаа",
        description: "Мессеж илгээхийн тулд нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      return
    }

    // Don't allow messaging yourself
    if (user.uid === post.userId) {
      toast({
        title: "Анхааруулга",
        description: "Та өөртөө мессеж илгээх боломжгүй",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSendingMessage(true)

      // Start a new chat or open existing one
      const chatId = await startNewChat(post.userId, post.userName || "Хэрэглэгч")

      // Set the active chat and recipient
      setActiveChatId(chatId)
      setCurrentRecipientId(post.userId)

      // Open the chat widget
      setChatWidgetVisible(true)

      toast({
        title: "Амжилттай",
        description: "Чат нээгдлээ",
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Чат эхлүүлэхэд алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    toast({
      title: "Сэтгэгдэл нэмэгдлээ",
      description: "Таны сэтгэгдэл амжилттай нэмэгдлээ",
    })
    setComment("")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Зар ачаалж байна...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/search" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Хайлт руу буцах
          </Link>
        </div>

        <div className="text-center py-12 border rounded-xl bg-muted/30">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-red-600 mb-2">{error || "Зар олдсонгүй"}</p>
          <p className="text-muted-foreground mb-6">Хайсан зар устсан эсвэл буруу холбоос байж магадгүй</p>
          <Button className="rounded-full" onClick={() => router.push("/search")}>
            Хайлт руу буцах
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      <div className="mb-4">
        <Link href="/search" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Хайлт руу буцах
        </Link>
      </div>

      {/* Main Post Card - Facebook Style */}
      <Card className="mb-4 overflow-hidden border shadow-sm rounded-lg">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={post.userPhotoURL || undefined} />
              <AvatarFallback className="bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold">{post.userName}</h3>
                {post.serviceType === "provider" && (
                  <VerificationBadge
                    providerStatus={post.providerVerificationStatus}
                    role="provider"
                    className="ml-1"
                  />
                )}
                {post.serviceType === "seeker" && (
                  <VerificationBadge seekerStatus={post.seekerVerificationStatus} role="seeker" className="ml-1" />
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <span>{post.date}</span>
                {post.time && <span> • {post.time}</span>}
                <span className="mx-1">•</span>
                <Globe className="h-3 w-3 mr-1" />
                <span>Нийтэд</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Зарыг мэдэгдэх</DropdownMenuItem>
              <DropdownMenuItem>Хуваалцах холбоос хуулах</DropdownMenuItem>
              <DropdownMenuItem>Нуух</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <div className="mb-2">{getServiceTypeBadge()}</div>
          <h2 className="text-xl font-bold mb-2">{formatLocation()}</h2>
          <p className="text-lg font-semibold text-green-700 mb-3">{post.price}₮</p>
          {post.description && <p className="text-gray-700 mb-4 whitespace-pre-line">{post.description}</p>}
        </div>

        {/* Post Image */}
        {post.image && (
          <div className={cn("w-full overflow-hidden bg-gray-100", !imageLoaded && "animate-pulse")}>
            <img
              src={post.image || "/placeholder.svg"}
              alt={`${post.name} зураг`}
              className="w-full object-cover max-h-[500px]"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          </div>
        )}

        {/* Post Actions */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-500 py-2">
            <div className="flex items-center">
              <div className="bg-blue-500 text-white rounded-full p-1">
                <ThumbsUp className="h-3 w-3" />
              </div>
              <span className="ml-2">12 хүн</span>
            </div>
            <div>
              <span>8 сэтгэгдэл</span>
              <span className="mx-2">•</span>
              <span>3 хуваалцсан</span>
            </div>
          </div>

          <Separator className="my-1" />

          <div className="flex justify-between py-1">
            <Button variant="ghost" className="flex-1 rounded-md">
              <ThumbsUp className="h-5 w-5 mr-2" />
              Таалагдлаа
            </Button>
            <Button variant="ghost" className="flex-1 rounded-md">
              <MessageSquare className="h-5 w-5 mr-2" />
              Сэтгэгдэл
            </Button>
            <Button variant="ghost" className="flex-1 rounded-md" onClick={handleBookmarkToggle}>
              {isBookmarked(post.id) ? (
                <>
                  <BookmarkCheck className="h-5 w-5 mr-2" />
                  Хадгалсан
                </>
              ) : (
                <>
                  <Bookmark className="h-5 w-5 mr-2" />
                  Хадгалах
                </>
              )}
            </Button>
            <Button variant="ghost" className="flex-1 rounded-md">
              <Share2 className="h-5 w-5 mr-2" />
              Хуваалцах
            </Button>
          </div>

          <Separator className="my-1" />

          {/* Comment Section */}
          <div className="mt-2">
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Сэтгэгдэл бичих..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[40px] py-2 pr-12 resize-none rounded-full bg-gray-100 border-0"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 p-1 h-auto"
                  disabled={!comment.trim()}
                >
                  Илгээх
                </Button>
              </div>
            </form>

            <Button variant="outline" size="sm" className="w-full text-sm rounded-md">
              Бүх сэтгэгдлийг харах <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Post Details Card */}
      <Card className="mb-4 overflow-hidden border shadow-sm rounded-lg">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Дэлгэрэнгүй мэдээлэл</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="text-md font-semibold flex items-center mb-3 text-blue-800">
                  <Info className="mr-2 h-5 w-5" />
                  Аялалын мэдээлэл
                </h4>

                {post.postType === "province" && (
                  <>
                    <div className="flex items-start mb-3">
                      <MapPin className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Чиглэл</p>
                        <p className="text-gray-900 font-semibold">{formatLocation()}</p>
                      </div>
                    </div>
                    <div className="flex items-start mb-3">
                      <Calendar className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Огноо</p>
                        <p className="text-gray-900 font-semibold">{post.date}</p>
                      </div>
                    </div>
                    {post.time && (
                      <div className="flex items-start">
                        <Clock className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-700">Цаг</p>
                          <p className="text-gray-900 font-semibold">{post.time}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {post.postType === "delivery" && (
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Хүргэлтийн бүс</p>
                      <p className="text-gray-900 font-semibold">{formatLocation()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <h4 className="text-md font-semibold flex items-center mb-3 text-purple-800">
                  <Info className="mr-2 h-5 w-5" />
                  Нэмэлт мэдээлэл
                </h4>

                {post.postType === "province" &&
                  post.serviceType === "provider" &&
                  post.providerType === "passenger" && (
                    <div className="flex items-start mb-3">
                      <User className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">Сул суудал</p>
                        <p className="text-gray-900 font-semibold">{post.seats}</p>
                      </div>
                    </div>
                  )}

                {post.carModel && (
                  <div className="flex items-start mb-3">
                    <Car className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">Машин</p>
                      <p className="text-gray-900 font-semibold">{post.carModel}</p>
                    </div>
                  </div>
                )}

                {post.postType === "province" &&
                  post.serviceType === "seeker" &&
                  post.seekerType === "cargo" &&
                  post.cargoType && (
                    <>
                      <div className="flex items-start mb-3">
                        <Truck className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-700">Ачааны төрөл</p>
                          <p className="text-gray-900 font-semibold">{post.cargoType}</p>
                        </div>
                      </div>
                      {post.cargoWeight && (
                        <div className="flex items-start mb-3">
                          <Truck className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-700">Ачааны жин</p>
                            <p className="text-gray-900 font-semibold">{post.cargoWeight}</p>
                          </div>
                        </div>
                      )}
                      {post.cargoSize && (
                        <div className="flex items-start">
                          <Truck className="mr-3 h-5 w-5 text-purple-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-700">Ачааны хэмжээ</p>
                            <p className="text-gray-900 font-semibold">{post.cargoSize}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact and Booking Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Card */}
        <Card className="overflow-hidden border shadow-sm rounded-lg">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Холбоо барих</h3>

            <div className="flex items-center gap-4 mb-4 pb-4 border-b">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage src={post.userPhotoURL || undefined} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{post.userName}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 mr-1 text-green-500" />
                  Баталгаажсан хэрэглэгч
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-gray-700">Утас</p>
                  <p className="text-gray-900 font-semibold">{post.phone}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <Button className="w-full rounded-xl" size="lg">
                  <Phone className="mr-2 h-4 w-4" />
                  Утасны дугаар харах
                </Button>

                {user ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    size="lg"
                    onClick={handleSendMessage}
                    disabled={user.uid === post.userId || isSendingMessage}
                  >
                    {isSendingMessage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ачааллаж байна...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Мессеж илгээх
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full rounded-xl" size="lg">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Нэвтэрч мессеж илгээх
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Card */}
        <Card className="overflow-hidden border shadow-sm rounded-lg">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Захиалга өгөх</h3>

            {user ? (
              <CreateBooking post={post} providerId={post.userId} />
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <User className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium mb-2">Захиалга өгөхийн тулд нэвтэрнэ үү</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Та энэхүү үйлчилгээг захиалахын тулд эхлээд системд нэвтрэх шаардлагатай
                </p>
                <Link href="/auth/login">
                  <Button className="w-full rounded-xl" size="lg">
                    Нэвтрэх
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Safety Tips */}
      <Card className="mt-4 border shadow-sm bg-yellow-50 rounded-lg">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold flex items-center text-yellow-800 mb-2">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Аюулгүй байдлын зөвлөмж
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
              Хувийн мэдээллээ хуваалцахдаа болгоомжтой байна уу
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
              Төлбөр хийхээсээ өмнө үйлчилгээний нөхцөлийг сайтар судлана уу
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-yellow-600" />
              Сэжигтэй зар, хэрэглэгчийн талаар бидэнд мэдэгдэнэ үү
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
