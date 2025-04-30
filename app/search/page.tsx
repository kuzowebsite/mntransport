"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Loader2,
  Phone,
  Truck,
  Car,
  Bookmark,
  BookmarkCheck,
  Filter,
  Info,
  Search,
  X,
  Settings,
  TrendingUp,
  Users,
  Package,
  Zap,
  CheckCircle2,
} from "lucide-react"
import { database } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import { aimags } from "@/lib/location-data"
import { useBookmark } from "@/contexts/bookmark-context"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  fromDistrict?: string
  toDistrict?: string
  providerVerificationStatus?: "none" | "partial" | "verified"
  seekerVerificationStatus?: "none" | "partial" | "verified"
}

export default function SearchPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark } = useBookmark()
  const [searchType, setSearchType] = useState("province")
  const [serviceType, setServiceType] = useState("provider")
  const [providerType, setProviderType] = useState("passenger")
  const [seekerType, setSeekerType] = useState("ride")
  const [showFilters, setShowFilters] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [fromType, setFromType] = useState<"aimag" | "sum">("aimag")
  const [toType, setToType] = useState<"aimag" | "sum">("aimag")
  const [selectedFromAimag, setSelectedFromAimag] = useState<string | null>(null)
  const [selectedToAimag, setSelectedToAimag] = useState<string | null>(null)

  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    fromDistrict: "",
    toDistrict: "",
  })

  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")

  // Fetch posts from Firebase
  useEffect(() => {
    const postsRef = ref(database, "posts")

    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const postsData = snapshot.val()
        const postsArray = Object.keys(postsData).map((key) => ({
          id: key,
          ...postsData[key],
        }))

        // Sort by createdAt (newest first)
        postsArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        setPosts(postsArray)
        setFilteredPosts(postsArray)
      } else {
        setPosts([])
        setFilteredPosts([])
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter posts when search type or parameters change
  useEffect(() => {
    if (posts.length === 0) return

    let filtered = [...posts]

    // Filter by search query if exists
    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (post.from && post.from.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.to && post.to.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.fromAimag && post.fromAimag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.toAimag && post.toAimag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Filter by category
    if (activeCategory !== "all") {
      if (activeCategory === "passenger") {
        filtered = filtered.filter((post) => post.serviceType === "provider" && post.providerType === "passenger")
      } else if (activeCategory === "cargo") {
        filtered = filtered.filter(
          (post) =>
            (post.serviceType === "provider" && post.providerType === "cargo") ||
            (post.serviceType === "seeker" && post.seekerType === "cargo"),
        )
      } else if (activeCategory === "ride") {
        filtered = filtered.filter((post) => post.serviceType === "seeker" && post.seekerType === "ride")
      } else if (activeCategory === "delivery") {
        filtered = filtered.filter((post) => post.postType === "delivery")
      }
    }

    // Filter by post type
    filtered = filtered.filter((post) => post.postType === searchType)

    if (searchType === "province") {
      // Filter by service type
      if (serviceType === "provider") {
        filtered = filtered.filter((post) => post.serviceType === "provider")

        // Filter by provider type
        if (providerType === "passenger") {
          filtered = filtered.filter((post) => post.providerType === "passenger")
        } else if (providerType === "cargo") {
          filtered = filtered.filter((post) => post.providerType === "cargo")
        }
      } else if (serviceType === "seeker") {
        filtered = filtered.filter((post) => post.serviceType === "seeker")

        // Filter by seeker type
        if (seekerType === "ride") {
          filtered = filtered.filter((post) => post.seekerType === "ride")
        } else if (seekerType === "cargo") {
          filtered = filtered.filter((post) => post.seekerType === "cargo")
        }
      }

      // Apply search parameters
      if (searchParams.from) {
        // Check if it's an aimag:sum format
        if (searchParams.from.includes(":")) {
          const [aimag, sum] = searchParams.from.split(":")
          filtered = filtered.filter((post) => post.fromAimag === aimag && post.from === sum)
        } else {
          // Just filter by the value (could be aimag or "all")
          if (searchParams.from !== "all") {
            filtered = filtered.filter((post) => post.fromAimag === searchParams.from)
          }
        }
      }

      if (searchParams.to) {
        // Check if it's an aimag:sum format
        if (searchParams.to.includes(":")) {
          const [aimag, sum] = searchParams.to.split(":")
          filtered = filtered.filter((post) => post.toAimag === aimag && post.to === sum)
        } else {
          // Just filter by the value (could be aimag or "all")
          if (searchParams.to !== "all") {
            filtered = filtered.filter((post) => post.toAimag === searchParams.to)
          }
        }
      }

      if (searchParams.date) {
        filtered = filtered.filter((post) => post.date === searchParams.date)
      }
    } else if (searchType === "delivery") {
      // Filter delivery posts by fromDistrict
      if (searchParams.fromDistrict && searchParams.fromDistrict !== "all") {
        filtered = filtered.filter((post) => post.fromDistrict === searchParams.fromDistrict)
      }

      // Filter delivery posts by toDistrict
      if (searchParams.toDistrict && searchParams.toDistrict !== "all") {
        filtered = filtered.filter((post) => post.toDistrict === searchParams.toDistrict)
      }
    }

    setFilteredPosts(filtered)
  }, [searchType, serviceType, providerType, seekerType, searchParams, posts, searchQuery, activeCategory])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setSearchParams((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    if (id === "from") {
      // Check if this is an aimag selection
      const isAimag = aimags.some((aimag) => aimag.value === value)
      if (isAimag) {
        setSelectedFromAimag(value)
        setFromType("sum")
        // Don't set the search params yet, wait for sum selection
      } else {
        // This is a sum selection
        if (selectedFromAimag) {
          if (value === "aimag-center") {
            // If "Аймгийн төв" is selected, use the aimag name directly
            setSearchParams((prev) => ({ ...prev, [id]: selectedFromAimag }))
          } else {
            // Format as "aimag:sum"
            setSearchParams((prev) => ({ ...prev, [id]: `${selectedFromAimag}:${value}` }))
          }
        }
      }
    } else if (id === "to") {
      // Check if this is an aimag selection
      const isAimag = aimags.some((aimag) => aimag.value === value)
      if (isAimag) {
        setSelectedToAimag(value)
        setToType("sum")
        // Don't set the search params yet, wait for sum selection
      } else {
        // This is a sum selection
        if (selectedToAimag) {
          if (value === "aimag-center") {
            // If "Аймгийн төв" is selected, use the aimag name directly
            setSearchParams((prev) => ({ ...prev, [id]: selectedToAimag }))
          } else {
            // Format as "aimag:sum"
            setSearchParams((prev) => ({ ...prev, [id]: `${selectedToAimag}:${value}` }))
          }
        }
      }
    } else {
      setSearchParams((prev) => ({ ...prev, [id]: value }))
    }
  }

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
  const formatLocation = (post: Post): string => {
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

      return `Хүргэлтийн үйлчилгээ - ${fromDistrictName} → ${toDistrictName}`
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

  const handleViewDetails = (postId: string) => {
    router.push(`/post/${postId}`)
  }

  const handleBookmarkToggle = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation() // Prevent card click event
    await toggleBookmark(postId)
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (searchParams.from) count++
    if (searchParams.to) count++
    if (searchParams.date) count++
    if (searchParams.fromDistrict && searchParams.fromDistrict !== "all") count++
    if (searchParams.toDistrict && searchParams.toDistrict !== "all") count++
    return count
  }

  // Recent searches (mock data)
  const recentSearches = [
    { id: 1, text: "Улаанбаатар → Дархан" },
    { id: 2, text: "Эрдэнэт → Улаанбаатар" },
    { id: 3, text: "Баянзүрх → Хан-Уул" },
  ]

  // Popular locations (mock data)
  const popularLocations = [
    { id: 1, text: "Улаанбаатар" },
    { id: 2, text: "Дархан" },
    { id: 3, text: "Эрдэнэт" },
    { id: 4, text: "Хөвсгөл" },
    { id: 5, text: "Баянхонгор" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Facebook-style search header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-2 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="relative">
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full pl-4 pr-2 py-2 cursor-pointer transition-colors">
                      <Search className="h-4 w-4 text-gray-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Хайх..."
                        className="bg-transparent border-none outline-none w-64 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={() => setIsSearchOpen(true)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSearchQuery("")
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Хайх..." value={searchQuery} onValueChange={setSearchQuery} />
                      <CommandList>
                        <CommandEmpty>Хайлтын үр дүн олдсонгүй</CommandEmpty>
                        <CommandGroup heading="Сүүлийн хайлтууд">
                          {recentSearches.map((search) => (
                            <CommandItem
                              key={search.id}
                              onSelect={() => {
                                setSearchQuery(search.text)
                                setIsSearchOpen(false)
                              }}
                            >
                              <Clock className="mr-2 h-4 w-4 text-gray-500" />
                              <span>{search.text}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup heading="Түгээмэл чиглэлүүд">
                          <div className="flex flex-wrap gap-2 p-2">
                            {popularLocations.map((location) => (
                              <Badge
                                key={location.id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-gray-200"
                                onClick={() => {
                                  setSearchQuery(location.text)
                                  setIsSearchOpen(false)
                                }}
                              >
                                <MapPin className="mr-1 h-3 w-3" />
                                {location.text}
                              </Badge>
                            ))}
                          </div>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Facebook-style category tabs */}
          <div className="flex items-center mt-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeCategory === "all" ? "default" : "ghost"}
              className={`rounded-full text-sm px-4 ${activeCategory === "all" ? "" : "text-gray-600"}`}
              onClick={() => setActiveCategory("all")}
            >
              Бүгд
            </Button>
            <Button
              variant={activeCategory === "passenger" ? "default" : "ghost"}
              className={`rounded-full text-sm px-4 ${activeCategory === "passenger" ? "" : "text-gray-600"}`}
              onClick={() => setActiveCategory("passenger")}
            >
              <Users className="mr-2 h-4 w-4" />
              Зорчигч тээвэр
            </Button>
            <Button
              variant={activeCategory === "cargo" ? "default" : "ghost"}
              className={`rounded-full text-sm px-4 ${activeCategory === "cargo" ? "" : "text-gray-600"}`}
              onClick={() => setActiveCategory("cargo")}
            >
              <Package className="mr-2 h-4 w-4" />
              Ачаа тээвэр
            </Button>
            <Button
              variant={activeCategory === "ride" ? "default" : "ghost"}
              className={`rounded-full text-sm px-4 ${activeCategory === "ride" ? "" : "text-gray-600"}`}
              onClick={() => setActiveCategory("ride")}
            >
              <Car className="mr-2 h-4 w-4" />
              Унаа хайх
            </Button>
            <Button
              variant={activeCategory === "delivery" ? "default" : "ghost"}
              className={`rounded-full text-sm px-4 ${activeCategory === "delivery" ? "" : "text-gray-600"}`}
              onClick={() => setActiveCategory("delivery")}
            >
              <Truck className="mr-2 h-4 w-4" />
              Хүргэлт
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Filter className="mr-2 h-5 w-5 text-primary" />
                  Шүүлтүүр
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </h2>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? "Хураах" : "Харуулах"}
                </Button>
              </div>

              {showFilters && (
                <Card className="border shadow-sm">
                  <CardContent className="p-4">
                    <Tabs defaultValue="province" onValueChange={setSearchType} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="province" className="text-sm py-2">
                          <MapPin className="mr-2 h-4 w-4" />
                          Аймаг, сум
                        </TabsTrigger>
                        <TabsTrigger value="delivery" className="text-sm py-2">
                          <Truck className="mr-2 h-4 w-4" />
                          Хүргэлт
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="province">
                        <div className="space-y-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium mb-3 flex items-center">
                              <User className="mr-2 h-4 w-4 text-primary" />
                              Хайлтын төрөл
                            </h3>
                            <RadioGroup
                              defaultValue="provider"
                              className="flex flex-wrap gap-2"
                              onValueChange={setServiceType}
                            >
                              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                <RadioGroupItem value="provider" id="provider-search" />
                                <Label htmlFor="provider-search" className="text-sm cursor-pointer">
                                  Үйлчилгээ үзүүлэгч
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                <RadioGroupItem value="seeker" id="seeker-search" />
                                <Label htmlFor="seeker-search" className="text-sm cursor-pointer">
                                  Үйлчилгээ хайх
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          {serviceType === "provider" && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h3 className="text-sm font-medium mb-3 flex items-center">
                                <Truck className="mr-2 h-4 w-4 text-primary" />
                                Үйлчилгээний төрөл
                              </h3>
                              <RadioGroup
                                defaultValue="passenger"
                                className="flex flex-wrap gap-2"
                                onValueChange={setProviderType}
                              >
                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                  <RadioGroupItem value="passenger" id="passenger-transport-search" />
                                  <Label htmlFor="passenger-transport-search" className="text-sm cursor-pointer">
                                    Зорчигч тээвэрлэх
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                  <RadioGroupItem value="cargo" id="cargo-transport-search" />
                                  <Label htmlFor="cargo-transport-search" className="text-sm cursor-pointer">
                                    Ачаа тээвэрлэх
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}

                          {serviceType === "seeker" && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h3 className="text-sm font-medium mb-3 flex items-center">
                                <Truck className="mr-2 h-4 w-4 text-primary" />
                                Үйлчилгээний төрөл
                              </h3>
                              <RadioGroup
                                defaultValue="ride"
                                className="flex flex-wrap gap-2"
                                onValueChange={setSeekerType}
                              >
                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                  <RadioGroupItem value="ride" id="ride-seeking-search" />
                                  <Label htmlFor="ride-seeking-search" className="text-sm cursor-pointer">
                                    Унаа хайж байгаа
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border hover:border-primary/50 transition-colors">
                                  <RadioGroupItem value="cargo" id="cargo-seeking-search" />
                                  <Label htmlFor="cargo-seeking-search" className="text-sm cursor-pointer">
                                    Ачаа тавих унаа хайх
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                          )}

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h3 className="text-sm font-medium mb-3 flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-primary" />
                              Аялалын чиглэл
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="from" className="text-xs font-medium">
                                  Хаанаас
                                </Label>
                                {fromType === "aimag" ? (
                                  <Select onValueChange={(value) => handleSelectChange("from", value)}>
                                    <SelectTrigger id="from" className="mt-1 rounded-lg text-sm">
                                      <SelectValue placeholder="Аймаг сонгох" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Бүгд</SelectItem>
                                      {aimags.map((aimag) => (
                                        <SelectItem key={aimag.value} value={aimag.value}>
                                          {aimag.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="space-y-2 mt-1">
                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Аймаг: {getAimagName(selectedFromAimag)}
                                      </span>
                                    </div>
                                    <Select onValueChange={(value) => handleSelectChange("from", value)}>
                                      <SelectTrigger id="from" className="rounded-lg text-sm">
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
                                          setSearchParams((prev) => ({ ...prev, from: "" }))
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
                                  <Select onValueChange={(value) => handleSelectChange("to", value)}>
                                    <SelectTrigger id="to" className="mt-1 rounded-lg text-sm">
                                      <SelectValue placeholder="Аймаг сонгох" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">Бүгд</SelectItem>
                                      {aimags.map((aimag) => (
                                        <SelectItem key={aimag.value} value={aimag.value}>
                                          {aimag.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="space-y-2 mt-1">
                                    <div className="flex items-center">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Аймаг: {getAimagName(selectedToAimag)}
                                      </span>
                                    </div>
                                    <Select onValueChange={(value) => handleSelectChange("to", value)}>
                                      <SelectTrigger id="to" className="rounded-lg text-sm">
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
                                          setSearchParams((prev) => ({ ...prev, to: "" }))
                                        }}
                                      >
                                        Аймаг дахин сонгох
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="date" className="text-xs font-medium">
                                  Огноо
                                </Label>
                                <Input
                                  id="date"
                                  type="date"
                                  onChange={handleInputChange}
                                  className="mt-1 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="delivery">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h3 className="text-sm font-medium mb-3 flex items-center">
                            <MapPin className="mr-2 h-4 w-4 text-primary" />
                            Хүргэлтийн бүс
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="fromDistrict" className="text-xs font-medium">
                                Хаанаас (Дүүрэг)
                              </Label>
                              <Select onValueChange={(value) => handleSelectChange("fromDistrict", value)}>
                                <SelectTrigger id="fromDistrict" className="mt-1 rounded-lg text-sm">
                                  <SelectValue placeholder="Дүүрэг сонгох" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Бүгд</SelectItem>
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
                              <Select onValueChange={(value) => handleSelectChange("toDistrict", value)}>
                                <SelectTrigger id="toDistrict" className="mt-1 rounded-lg text-sm">
                                  <SelectValue placeholder="Дүүрэг сонгох" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Бүгд</SelectItem>
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
                      </TabsContent>
                    </Tabs>

                    <div className="mt-4">
                      <Button
                        className="w-full rounded-lg"
                        onClick={() => {
                          setSearchParams({
                            from: "",
                            to: "",
                            date: "",
                            fromDistrict: "",
                            toDistrict: "",
                          })
                          setFromType("aimag")
                          setToType("aimag")
                          setSelectedFromAimag(null)
                          setSelectedToAimag(null)
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Шүүлтүүр цэвэрлэх
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-9">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {searchType === "province" ? "Аймаг, сум хоорондын үйлчилгээ" : "Хүргэлтийн үйлчилгээ"}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{filteredPosts.length} үр дүн</span>
                  <Badge variant="outline" className="bg-primary/5">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Шинэ
                  </Badge>
                </div>
              </div>
              <Separator className="mt-3" />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Мэдээлэл ачааллаж байна...</p>
                </div>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-primary/20 cursor-pointer group"
                    onClick={() => handleViewDetails(post.id)}
                  >
                    <div className="flex flex-col md:flex-row">
                      {post.image && (
                        <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt={`${post.name} зураг`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-primary/5 text-primary">
                                {searchType === "province" &&
                                  post.serviceType === "provider" &&
                                  post.providerType === "passenger" &&
                                  "Зорчигч тээвэрлэх"}
                                {searchType === "province" &&
                                  post.serviceType === "provider" &&
                                  post.providerType === "cargo" &&
                                  "Ачаа тээвэрлэх"}
                                {searchType === "province" &&
                                  post.serviceType === "seeker" &&
                                  post.seekerType === "ride" &&
                                  "Унаа хайж байна"}
                                {searchType === "province" &&
                                  post.serviceType === "seeker" &&
                                  post.seekerType === "cargo" &&
                                  "Ачаа тээвэрлэх унаа хайж байна"}
                                {searchType === "delivery" && "Хүргэлтийн үйлчилгээ"}
                              </Badge>
                              {post.serviceType === "provider" && post.providerVerificationStatus === "verified" && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Баталгаажсан
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold flex items-center gap-1 mb-1">
                              <span>{formatLocation(post)}</span>
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{post.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{post.name}</span>
                            </div>
                          </div>
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto rounded-full"
                              onClick={(e) => handleBookmarkToggle(e, post.id)}
                            >
                              {isBookmarked(post.id) ? (
                                <BookmarkCheck className="h-5 w-5 text-primary" />
                              ) : (
                                <Bookmark className="h-5 w-5" />
                              )}
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                          {searchType === "province" && (
                            <>
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-sm">{post.date}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-sm">{post.time}</span>
                              </div>
                            </>
                          )}

                          {searchType === "province" &&
                            post.serviceType === "provider" &&
                            post.providerType === "passenger" && (
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-sm">Сул суудал: {post.seats}</span>
                              </div>
                            )}

                          {searchType === "province" && post.carModel && (
                            <div className="flex items-center">
                              <Car className="mr-2 h-4 w-4 text-primary" />
                              <span className="text-sm">Машин: {post.carModel}</span>
                            </div>
                          )}

                          {searchType === "province" &&
                            post.serviceType === "seeker" &&
                            post.seekerType === "cargo" &&
                            post.cargoType && (
                              <div className="flex items-center">
                                <Truck className="mr-2 h-4 w-4 text-primary" />
                                <span className="text-sm">Ачааны төрөл: {post.cargoType}</span>
                              </div>
                            )}

                          <div className="flex items-center">
                            <Zap className="mr-2 h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{post.price}₮</span>
                          </div>
                        </div>

                        {post.description && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            <p className="line-clamp-2">{post.description}</p>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <Button variant="outline" className="rounded-full text-sm px-3">
                            <Info className="mr-1 h-4 w-4" />
                            Дэлгэрэнгүй
                          </Button>
                          <Button className="rounded-full flex items-center justify-center">
                            <Phone className="mr-2 h-4 w-4" />
                            {post.phone}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-xl bg-gray-50">
                <div className="max-w-md mx-auto">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Хайлтын үр дүн олдсонгүй</h3>
                  <p className="text-muted-foreground mb-6">
                    Таны хайсан шүүлтүүрээр үр дүн олдсонгүй. Шүүлтүүрээ өөрчлөх эсвэл дахин оролдоно уу.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setSearchParams({
                        from: "",
                        to: "",
                        date: "",
                        fromDistrict: "",
                        toDistrict: "",
                      })
                      setFromType("aimag")
                      setToType("aimag")
                      setSelectedFromAimag(null)
                      setSelectedToAimag(null)
                      setSearchQuery("")
                    }}
                  >
                    Шүүлтүүр цэвэрлэх
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
