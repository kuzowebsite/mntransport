"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, get, remove, update, onValue } from "firebase/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  MapPin,
  User,
  Clock,
  Car,
  Package,
  Users,
  Mail,
  Phone,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [debugMode, setDebugMode] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchPosts = async () => {
    try {
      setRefreshing(true)
      const postsRef = ref(database, "posts")

      // Use onValue instead of get for real-time updates
      const unsubscribe = onValue(
        postsRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const postsData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => {
              if (debugMode) {
                console.log(`Post ID: ${id}`, data) // Debug log
              }
              return {
                id,
                ...data,
              }
            })

            // Sort posts by creation date (newest first)
            postsData.sort((a, b) => {
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            })

            // Fetch additional user data for each post
            const postsWithUserData = await Promise.all(
              postsData.map(async (post) => {
                if (post.userId) {
                  try {
                    const userRef = ref(database, `users/${post.userId}`)
                    const userSnapshot = await get(userRef)

                    if (userSnapshot.exists()) {
                      const userData = userSnapshot.val()
                      return {
                        ...post,
                        userName: userData.displayName || userData.name || post.userName,
                        userEmail: userData.email || post.userEmail,
                        userPhone: userData.phoneNumber || userData.phone || post.contactPhone,
                      }
                    }
                  } catch (error) {
                    console.error(`Error fetching user data for post ${post.id}:`, error)
                  }
                }
                return post
              }),
            )

            if (debugMode) {
              console.log("All posts with user data:", postsWithUserData) // Debug log
            }

            setPosts(postsWithUserData)
            setFilteredPosts(postsWithUserData)
          } else {
            console.log("No posts found in database") // Debug log
            setPosts([])
            setFilteredPosts([])
          }
          setLoading(false)
          setRefreshing(false)

          // Clean up the listener after initial load
          unsubscribe()
        },
        (error) => {
          console.error("Error fetching posts:", error)
          toast({
            title: "Алдаа",
            description: "Зарын мэдээлэл авахад алдаа гарлаа",
            variant: "destructive",
          })
          setLoading(false)
          setRefreshing(false)
        },
      )
    } catch (error) {
      console.error("Error in fetchPosts:", error)
      toast({
        title: "Алдаа",
        description: "Зарын мэдээлэл авахад алдаа гарлаа",
        variant: "destructive",
      })
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, []) // Removed toast from dependencies to avoid unnecessary refetches

  useEffect(() => {
    let filtered = [...posts]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((post) => post.type === typeFilter)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.description && post.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.fromLocation && post.fromLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.toLocation && post.toLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.userId && post.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.userName && post.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.userEmail && post.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.userPhone && post.userPhone.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.contactPhone && post.contactPhone.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredPosts(filtered)
  }, [searchQuery, posts, statusFilter, typeFilter])

  const handleApprovePost = async (postId: string) => {
    try {
      const postRef = ref(database, `posts/${postId}`)
      await update(postRef, { status: "approved" })

      setPosts(posts.map((post) => (post.id === postId ? { ...post, status: "approved" } : post)))

      toast({
        title: "Амжилттай",
        description: "Зар баталгаажлаа",
      })
    } catch (error) {
      console.error("Error approving post:", error)
      toast({
        title: "Алдаа",
        description: "Зар баталгаажуулахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleRejectPost = async (postId: string) => {
    try {
      const postRef = ref(database, `posts/${postId}`)
      await update(postRef, { status: "rejected" })

      setPosts(posts.map((post) => (post.id === postId ? { ...post, status: "rejected" } : post)))

      toast({
        title: "Амжилттай",
        description: "Зар цуцлагдлаа",
      })
    } catch (error) {
      console.error("Error rejecting post:", error)
      toast({
        title: "Алдаа",
        description: "Зар цуцлахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Энэ зарыг устгахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const postRef = ref(database, `posts/${postId}`)
      await remove(postRef)

      setPosts(posts.filter((post) => post.id !== postId))
      toast({
        title: "Амжилттай",
        description: "Зар устгагдлаа",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Алдаа",
        description: "Зар устгахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    if (!status || status === "pending") {
      return <Badge variant="outline">Хүлээгдэж буй</Badge>
    } else if (status === "approved") {
      return <Badge variant="success">Баталгаажсан</Badge>
    } else if (status === "rejected") {
      return <Badge variant="destructive">Цуцлагдсан</Badge>
    }
    return null
  }

  const getTypeBadge = (type: string) => {
    if (type === "driver") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Car className="h-3 w-3" /> Жолооч
        </Badge>
      )
    } else if (type === "passenger") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" /> Зорчигч
        </Badge>
      )
    } else if (type === "delivery") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="h-3 w-3" /> Хүргэлт
        </Badge>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    try {
      return new Date(dateString).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      console.error("Error formatting date:", e, dateString)
      return dateString
    }
  }

  const viewPostDetails = (post: any) => {
    setSelectedPost(post)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Зарууд</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Хайх..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPosts()}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Шинэчлэх
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
            {debugMode ? "Дебаг унтраах" : "Дебаг асаах"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium">Төлөв:</label>
          <select
            className="ml-2 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Бүгд</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="approved">Баталгаажсан</option>
            <option value="rejected">Цуцлагдсан</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Төрөл:</label>
          <select
            className="ml-2 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">Бүгд</option>
            <option value="driver">Жолооч</option>
            <option value="passenger">Зорчигч</option>
            <option value="delivery">Хүргэлт</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">Нийт: {filteredPosts.length} зар</div>
      </div>

      {debugMode && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Дебаг мэдээлэл
          </h3>
          <div className="text-sm space-y-2">
            <p>Нийт зарын тоо: {posts.length}</p>
            <p>Шүүсэн зарын тоо: {filteredPosts.length}</p>
            <p>Хайлт: {searchQuery || "(хоосон)"}</p>
            <p>Төлөв шүүлтүүр: {statusFilter}</p>
            <p>Төрөл шүүлтүүр: {typeFilter}</p>
            <div className="mt-2">
              <p className="font-medium">Эхний зарын мэдээлэл:</p>
              {filteredPosts.length > 0 ? (
                <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-40 mt-1">
                  {JSON.stringify(filteredPosts[0], null, 2)}
                </pre>
              ) : (
                <p className="text-red-500">Зар олдсонгүй</p>
              )}
            </div>
            <div className="mt-2">
              <p className="font-medium">Талбарын тоо:</p>
              {filteredPosts.length > 0 ? (
                <ul className="list-disc pl-5 mt-1">
                  <li>
                    Гарчиг: {filteredPosts.filter((p) => p.title).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Хаанаас: {filteredPosts.filter((p) => p.fromLocation).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Хаашаа: {filteredPosts.filter((p) => p.toLocation).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Явах огноо: {filteredPosts.filter((p) => p.departureDate).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Хэрэглэгчийн нэр: {filteredPosts.filter((p) => p.userName).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Имэйл: {filteredPosts.filter((p) => p.userEmail).length} / {filteredPosts.length}
                  </li>
                  <li>
                    Утасны дугаар: {filteredPosts.filter((p) => p.userPhone || p.contactPhone).length} /{" "}
                    {filteredPosts.length}
                  </li>
                </ul>
              ) : (
                <p className="text-red-500">Зар олдсонгүй</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Гарчиг</TableHead>
              <TableHead>Хаанаас</TableHead>
              <TableHead>Хаашаа</TableHead>
              <TableHead>Явах огноо</TableHead>
              <TableHead>Харьяалагчийн нэр</TableHead>
              <TableHead>Имэйл</TableHead>
              <TableHead>Утасны дугаар</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="text-right">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    {post.title || "—"}
                    {debugMode && !post.title && <span className="text-red-500 text-xs ml-1">[хоосон]</span>}
                  </TableCell>
                  <TableCell>
                    {post.fromLocation || "—"}
                    {debugMode && !post.fromLocation && <span className="text-red-500 text-xs ml-1">[хоосон]</span>}
                  </TableCell>
                  <TableCell>
                    {post.toLocation || "—"}
                    {debugMode && !post.toLocation && <span className="text-red-500 text-xs ml-1">[хоосон]</span>}
                  </TableCell>
                  <TableCell>
                    {post.departureDate ? formatDate(post.departureDate) : "—"}
                    {debugMode && !post.departureDate && <span className="text-red-500 text-xs ml-1">[хоосон]</span>}
                  </TableCell>
                  <TableCell>{post.userName || "—"}</TableCell>
                  <TableCell>{post.userEmail || "—"}</TableCell>
                  <TableCell>{post.userPhone || post.contactPhone || "—"}</TableCell>
                  <TableCell>{getTypeBadge(post.type)}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Цэс нээх</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => viewPostDetails(post)}>
                          <Info className="mr-2 h-4 w-4" />
                          <span>Дэлгэрэнгүй</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/post/${post.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Харах</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApprovePost(post.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Баталгаажуулах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRejectPost(post.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Цуцлах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Устгах
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Зар олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Post Details Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {selectedPost.title || "Зарын дэлгэрэнгүй"}
                  {getStatusBadge(selectedPost.status)}
                </DialogTitle>
                <DialogDescription>Зарын ID: {selectedPost.id}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Үндсэн мэдээлэл</TabsTrigger>
                  <TabsTrigger value="user">Хэрэглэгчийн мэдээлэл</TabsTrigger>
                  <TabsTrigger value="raw">Бүх өгөгдөл</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Зарын мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Хаанаас
                          </h4>
                          <p>{selectedPost.fromLocation || "—"}</p>
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Хаашаа
                          </h4>
                          <p>{selectedPost.toLocation || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Явах огноо
                          </h4>
                          <p>{formatDate(selectedPost.departureDate) || "—"}</p>
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Үүсгэсэн огноо
                          </h4>
                          <p>{formatDate(selectedPost.createdAt) || "—"}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">Төрөл</h4>
                        <p>{getTypeBadge(selectedPost.type)}</p>
                      </div>

                      <div>
                        <h4 className="font-medium">Тайлбар</h4>
                        <p className="whitespace-pre-wrap">{selectedPost.description || "—"}</p>
                      </div>

                      {selectedPost.price && (
                        <div>
                          <h4 className="font-medium">Үнэ</h4>
                          <p>{selectedPost.price} ₮</p>
                        </div>
                      )}

                      {selectedPost.seats && (
                        <div>
                          <h4 className="font-medium">Суудлын тоо</h4>
                          <p>{selectedPost.seats}</p>
                        </div>
                      )}

                      {selectedPost.weight && (
                        <div>
                          <h4 className="font-medium">Жин</h4>
                          <p>{selectedPost.weight} кг</p>
                        </div>
                      )}

                      {selectedPost.dimensions && (
                        <div>
                          <h4 className="font-medium">Хэмжээ</h4>
                          <p>{selectedPost.dimensions}</p>
                        </div>
                      )}

                      {selectedPost.vehicle && (
                        <div>
                          <h4 className="font-medium">Тээврийн хэрэгсэл</h4>
                          <p>{selectedPost.vehicle}</p>
                        </div>
                      )}

                      {selectedPost.contactPhone && (
                        <div>
                          <h4 className="font-medium">Холбоо барих утас</h4>
                          <p>{selectedPost.contactPhone}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="user">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Хэрэглэгчийн мэдээлэл</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-1">
                          <User className="h-4 w-4" /> Хэрэглэгчийн нэр
                        </h4>
                        <p>{selectedPost.userName || "—"}</p>
                      </div>

                      <div>
                        <h4 className="font-medium">Хэрэглэгчийн ID</h4>
                        <p>{selectedPost.userId || "—"}</p>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center gap-1">
                          <Mail className="h-4 w-4" /> Имэйл
                        </h4>
                        <p>{selectedPost.userEmail || "—"}</p>
                      </div>

                      <div>
                        <h4 className="font-medium flex items-center gap-1">
                          <Phone className="h-4 w-4" /> Утасны дугаар
                        </h4>
                        <p>{selectedPost.userPhone || selectedPost.contactPhone || "—"}</p>
                      </div>

                      <div className="pt-4">
                        <Button variant="outline" asChild className="w-full">
                          <Link href={`/admin/users?search=${selectedPost.userId}`}>Хэрэглэгчийн мэдээлэл харах</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="raw">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Бүх өгөгдөл</CardTitle>
                      <CardDescription>Зарын бүх өгөгдөл JSON форматаар</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                        {JSON.stringify(selectedPost, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setSelectedPost(null)}>
                  Хаах
                </Button>

                <div className="space-x-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleApprovePost(selectedPost.id)
                      setSelectedPost({ ...selectedPost, status: "approved" })
                    }}
                    disabled={selectedPost.status === "approved"}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Баталгаажуулах
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleRejectPost(selectedPost.id)
                      setSelectedPost({ ...selectedPost, status: "rejected" })
                    }}
                    disabled={selectedPost.status === "rejected"}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Цуцлах
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
