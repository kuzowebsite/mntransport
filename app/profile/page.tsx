"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useBookmark } from "@/contexts/bookmark-context"
import { update, ref as databaseRef } from "firebase/database"
import { database } from "@/lib/firebase"
import { ref, onValue, remove, get } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Shield,
  Car,
  Package,
  Settings,
  FileText,
  AlertCircle,
} from "lucide-react"
import { aimags } from "@/lib/location-data"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Post = {
  id: string
  name: string
  phone: string
  from?: string
  to?: string
  date?: string
  time?: string
  price: string
  seats?: string
  carModel?: string
  cargoType?: string
  cargoWeight?: string
  cargoSize?: string
  description: string
  district?: string
  image?: string | null
  postType: string
  serviceType?: string
  providerType?: string
  seekerType?: string
  createdAt: string
  fromAimag?: string
  toAimag?: string
}

export default function ProfilePage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { bookmarks, isLoading: bookmarksLoading } = useBookmark()
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavedLoading, setIsSavedLoading] = useState(true)
  const [deletingPost, setDeletingPost] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Fetch user's posts
    const fetchUserPosts = () => {
      const postsRef = ref(database, "posts")

      const unsubscribe = onValue(postsRef, (snapshot) => {
        if (snapshot.exists()) {
          const postsData = snapshot.val()
          const postsArray = Object.keys(postsData).map((key) => ({
            id: key,
            ...postsData[key],
          }))

          // Filter posts by user's phone number
          const userPostsArray = postsArray.filter((post) => post.phone === userData?.phone)

          // Sort by createdAt (newest first)
          userPostsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          setUserPosts(userPostsArray)
        } else {
          setUserPosts([])
        }
        setIsLoading(false)
      })

      return unsubscribe
    }

    const unsubscribe = fetchUserPosts()
    return () => unsubscribe()
  }, [user, loading, router, userData?.phone])

  // Fetch bookmarked posts
  useEffect(() => {
    if (loading || !user || bookmarksLoading) return

    const fetchSavedPosts = async () => {
      setIsSavedLoading(true)
      try {
        if (bookmarks.length === 0) {
          setSavedPosts([])
          setIsSavedLoading(false)
          return
        }

        const postsRef = ref(database, "posts")
        const snapshot = await get(postsRef)

        if (snapshot.exists()) {
          const postsData = snapshot.val()
          const allPosts = Object.keys(postsData).map((key) => ({
            id: key,
            ...postsData[key],
          }))

          // Filter only bookmarked posts
          const savedPostsArray = allPosts.filter((post) => bookmarks.includes(post.id))

          // Sort by createdAt (newest first)
          savedPostsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          setSavedPosts(savedPostsArray)
        } else {
          setSavedPosts([])
        }
      } catch (error) {
        console.error("Error fetching saved posts:", error)
        toast({
          title: "Алдаа",
          description: "Хадгалсан зарууд ачаалахад алдаа гарлаа",
          variant: "destructive",
        })
      } finally {
        setIsSavedLoading(false)
      }
    }

    fetchSavedPosts()
  }, [user, loading, bookmarks, bookmarksLoading, toast])

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Та энэ зарыг устгахдаа итгэлтэй байна уу?")) {
      return
    }

    setDeletingPost(postId)

    try {
      const postRef = ref(database, `posts/${postId}`)
      await remove(postRef)

      toast({
        title: "Амжилттай",
        description: "Зар устгагдлаа",
      })

      // Update the local state
      setUserPosts((prev) => prev.filter((post) => post.id !== postId))
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Алдаа",
        description: "Зар устгахад алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setDeletingPost(null)
    }
  }

  const handleEditPost = (postId: string) => {
    router.push(`/post/edit/${postId}`)
  }

  const handleViewPost = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  // Helper function to get aimag name in Mongolian
  const getAimagName = (aimagValue: string | undefined): string => {
    if (!aimagValue) return ""

    const aimag = aimags.find((a) => a.value === aimagValue)
    return aimag ? aimag.label : aimagValue
  }

  // Function to format location display
  const formatLocation = (post: Post): string => {
    if (post.postType === "delivery") {
      return `Хүргэлтийн үйлчилгээ - ${post.district || ""}`
    }

    let fromLocation = ""
    let toLocation = ""

    // Handle from location
    if (post.fromAimag) {
      fromLocation = getAimagName(post.fromAimag)
    }

    // Handle to location
    if (post.toAimag) {
      toLocation = getAimagName(post.toAimag)
    }

    return `${fromLocation} - ${toLocation}`
  }

  // State for image upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(userData?.photoURL || null)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // Function to handle profile image upload
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadError(null)
    setUploadProgress("Зураг шалгаж байна...")

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Зөвхөн зураг оруулна уу")
      }

      // Validate file size (max 2MB for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Зургийн хэмжээ 2МБ-аас хэтрэхгүй байх ёстой")
      }

      setUploadProgress("Зургийг боловсруулж байна...")

      // Convert image to base64
      const base64Image = await convertToBase64(file)
      console.log("Image converted to base64, length:", base64Image.length)

      setUploadProgress("Өгөгдлийн санд хадгалж байна...")

      // Update user record in database with base64 image
      const userRef = databaseRef(database, `users/${user.uid}`)

      // Get current user data
      const userSnapshot = await get(userRef)
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val()

        // Update with new photo
        await update(userRef, {
          ...userData,
          photoURL: base64Image,
        })
        console.log("User data updated with base64 image")

        // Update local state
        setProfileImageUrl(base64Image)

        toast({
          title: "Амжилттай",
          description: "Профайл зураг шинэчлэгдлээ",
        })

        // Force reload the page to refresh the auth context
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error("Хэрэглэгчийн мэдээлэл олдсонгүй")
      }
    } catch (error) {
      console.error("Error uploading profile image:", error)
      setUploadError(error instanceof Error ? error.message : "Зураг оруулахад алдаа гарлаа")
      toast({
        title: "Алдаа",
        description: "Зураг оруулахад алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  // Helper function to convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Debug function to check Firebase connection
  const checkFirebaseConnection = async () => {
    try {
      const testRef = ref(database, ".info/connected")
      onValue(testRef, (snapshot) => {
        const connected = snapshot.val()
        console.log("Firebase connection status:", connected ? "connected" : "disconnected")
        toast({
          title: "Firebase холболт",
          description: connected ? "Холбогдсон" : "Холбогдоогүй",
          variant: connected ? "default" : "destructive",
        })
      })
    } catch (error) {
      console.error("Error checking Firebase connection:", error)
      toast({
        title: "Алдаа",
        description: "Firebase холболт шалгахад алдаа гарлаа",
        variant: "destructive",
      })
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
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Хэрэглэгчийн профайл</h1>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="space-y-6">
              {/* User Profile Card */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 h-24"></div>
                <CardContent className="pt-0 relative">
                  <div className="absolute -top-12 left-4 w-24 h-24 rounded-xl overflow-hidden border-4 border-white bg-white shadow-sm">
                    <label className="cursor-pointer block w-full h-full group relative">
                      {profileImageUrl || userData?.photoURL ? (
                        <div className="w-full h-full relative">
                          <img
                            src={profileImageUrl || userData?.photoURL || "/placeholder.svg"}
                            alt={userData?.name || "Хэрэглэгч"}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
                            {uploadProgress && (
                              <div className="text-white text-xs bg-black/70 px-2 py-1 rounded text-center">
                                {uploadProgress}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                            Зураг солих
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="pt-14 pb-2">
                    <h2 className="text-xl font-bold">{userData?.name}</h2>
                    <p className="text-gray-500 text-sm">{userData?.email}</p>
                  </div>

                  {uploadError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="border-t pt-4 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{userData?.phone}</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        Баталгаажсан
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Бүртгүүлсэн: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>

                    {/* Debug button - only visible in development */}
                    {process.env.NODE_ENV === "development" && (
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={checkFirebaseConnection}>
                        Firebase холболт шалгах
                      </Button>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 px-6 py-4">
                  <Link href="/profile/settings" className="w-full">
                    <Button variant="outline" className="w-full rounded-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Профайл засах
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Үйлдлүүд</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4">
                  <Link
                    href="/post"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span>Шинэ зар оруулах</span>
                  </Link>

                  <Link
                    href="/profile/bookings"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span>Захиалгууд</span>
                  </Link>

                  <Link
                    href="/profile/verification"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <span>Баталгаажуулалт</span>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="posts" className="rounded-full">
                  Миний зарууд
                </TabsTrigger>
                <TabsTrigger value="saved" className="rounded-full">
                  Хадгалсан зарууд
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {userPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        {post.image && (
                          <div className="w-full h-48 overflow-hidden">
                            <img
                              src={post.image || "/placeholder.svg"}
                              alt={`${post.name} зураг`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{formatLocation(post)}</CardTitle>
                            <Badge className="bg-primary/10 text-primary border-0 font-normal">{post.price}₮</Badge>
                          </div>
                          <CardDescription>
                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "passenger" &&
                              "Зорчигч тээвэрлэх"}
                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "cargo" &&
                              "Ачаа тээвэрлэх"}
                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "ride" &&
                              "Унаа хайж байна"}
                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "cargo" &&
                              "Ачаа тээвэрлэх унаа хайж байна"}
                            {post.postType === "delivery" && post.district && ` - ${post.district} дүүрэг`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-3">
                            {post.postType === "province" && (
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm">
                                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm">
                                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{post.time}</span>
                                </div>
                              </div>
                            )}

                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "passenger" && (
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                  <User className="h-3.5 w-3.5 text-gray-500" />
                                  <span>Сул суудал: {post.seats}</span>
                                </div>
                              )}

                            {post.postType === "province" && post.carModel && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                <Car className="h-3.5 w-3.5 text-gray-500" />
                                <span>Машин: {post.carModel}</span>
                              </div>
                            )}

                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "cargo" &&
                              post.cargoType && (
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                  <Package className="h-3.5 w-3.5 text-gray-500" />
                                  <span>Ачааны төрөл: {post.cargoType}</span>
                                </div>
                              )}

                            {post.description && (
                              <p className="text-sm text-gray-700 line-clamp-2 mt-2">{post.description}</p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleViewPost(post.id)}
                            >
                              Харах
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleEditPost(post.id)}
                            >
                              Засах
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeletePost(post.id)}
                            disabled={deletingPost === post.id}
                          >
                            {deletingPost === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Устгах"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Зар байхгүй байна</h3>
                    <p className="text-gray-500 mb-6">Та одоогоор ямар ч зар оруулаагүй байна.</p>
                    <Link href="/post">
                      <Button className="rounded-full">Зар оруулах</Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved">
                {isSavedLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : savedPosts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {savedPosts.map((post) => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        {post.image && (
                          <div className="w-full h-48 overflow-hidden">
                            <img
                              src={post.image || "/placeholder.svg"}
                              alt={`${post.name} зураг`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{formatLocation(post)}</CardTitle>
                            <Badge className="bg-primary/10 text-primary border-0 font-normal">{post.price}₮</Badge>
                          </div>
                          <CardDescription>
                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "passenger" &&
                              "Зорчигч тээвэрлэх"}
                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "cargo" &&
                              "Ачаа тээвэрлэх"}
                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "ride" &&
                              "Унаа хайж байна"}
                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "cargo" &&
                              "Ачаа тээвэрлэх унаа хайж байна"}
                            {post.postType === "delivery" && post.district && ` - ${post.district} дүүрэг`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-3">
                            {post.postType === "province" && (
                              <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm">
                                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{post.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm">
                                  <Clock className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{post.time}</span>
                                </div>
                              </div>
                            )}

                            {post.postType === "province" &&
                              post.serviceType === "provider" &&
                              post.providerType === "passenger" && (
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                  <User className="h-3.5 w-3.5 text-gray-500" />
                                  <span>Сул суудал: {post.seats}</span>
                                </div>
                              )}

                            {post.postType === "province" && post.carModel && (
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                <Car className="h-3.5 w-3.5 text-gray-500" />
                                <span>Машин: {post.carModel}</span>
                              </div>
                            )}

                            {post.postType === "province" &&
                              post.serviceType === "seeker" &&
                              post.seekerType === "cargo" &&
                              post.cargoType && (
                                <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full text-sm w-fit">
                                  <Package className="h-3.5 w-3.5 text-gray-500" />
                                  <span>Ачааны төрөл: {post.cargoType}</span>
                                </div>
                              )}

                            {post.description && (
                              <p className="text-sm text-gray-700 line-clamp-2 mt-2">{post.description}</p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleViewPost(post.id)}
                          >
                            Харах
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Хадгалсан зар байхгүй байна</h3>
                    <p className="text-gray-500 mb-6">Та одоогоор ямар ч зар хадгалаагүй байна.</p>
                    <Link href="/search">
                      <Button className="rounded-full">Зар хайх</Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
