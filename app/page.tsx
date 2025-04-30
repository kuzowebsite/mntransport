"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { locationData } from "@/lib/location-data"
import {
  Car,
  Clock,
  Package,
  Search,
  Truck,
  Users,
  ArrowRight,
  ChevronRight,
  Shield,
  Award,
  PhoneCall,
  MapPin,
  X,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  const { settings } = useSiteSettings()
  const { toast } = useToast()
  const router = useRouter()
  const [fromLocation, setFromLocation] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSearch = () => {
    if (!fromLocation || !toLocation) {
      toast({
        title: "Анхааруулга",
        description: "Хаанаас хаашаа явахаа сонгоно уу",
        variant: "destructive",
      })
      return
    }

    router.push(`/search?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`)
  }

  // Recent searches mock data
  const recentSearches = [
    { from: "Улаанбаатар", to: "Дархан" },
    { from: "Улаанбаатар", to: "Эрдэнэт" },
    { from: "Дархан", to: "Эрдэнэт" },
  ]

  // Popular destinations mock data
  const popularDestinations = ["Улаанбаатар", "Дархан", "Эрдэнэт", "Чойр", "Сүхбаатар", "Дорноговь"]

  // Site features
  const features = [
    {
      icon: <Car className="h-10 w-10 text-primary" />,
      title: "Зорчигч тээвэр",
      description: "Хот доторх болон хот хоорондын зорчигч тээврийн үйлчилгээ",
    },
    {
      icon: <Package className="h-10 w-10 text-primary" />,
      title: "Ачаа тээвэр",
      description: "Бага, дунд, том оврын ачаа тээврийн үйлчилгээ",
    },
    {
      icon: <Truck className="h-10 w-10 text-primary" />,
      title: "Хүргэлт",
      description: "Хүнс, бараа, захиалгын хүргэлтийн үйлчилгээ",
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Найдвартай жолооч",
      description: "Баталгаажсан, найдвартай жолооч нартай холбогдох",
    },
  ]

  // Site benefits
  const benefits = [
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Найдвартай үйлчилгээ",
      description: "Бүх жолооч, тээврийн хэрэгсэл баталгаажсан",
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Хурдан шуурхай",
      description: "Цаг алдалгүй үйлчилгээ авах боломж",
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: "Чанарын баталгаа",
      description: "Үйлчилгээний чанарын өндөр стандарт",
    },
    {
      icon: <PhoneCall className="h-6 w-6 text-primary" />,
      title: "24/7 тусламж",
      description: "Асуудал гарвал 24/7 тусламж авах боломжтой",
    },
  ]

  // How it works steps
  const steps = [
    {
      number: 1,
      title: "Бүртгүүлэх",
      description: "Системд бүртгүүлж, өөрийн профайлаа үүсгэнэ",
    },
    {
      number: 2,
      title: "Зар оруулах эсвэл хайх",
      description: "Өөрийн хэрэгцээнд тохирсон зар оруулах эсвэл бусдын зарыг хайх",
    },
    {
      number: 3,
      title: "Холбогдох",
      description: "Тохирох зар олдвол захиалга өгөх эсвэл шууд холбогдох",
    },
    {
      number: 4,
      title: "Үйлчилгээ авах",
      description: "Тохирсон үнэ, нөхцөлөөр үйлчилгээ авах",
    },
  ]

  // Statistics
  const stats = [
    { value: "10,000+", label: "Хэрэглэгч" },
    { value: "5,000+", label: "Жолооч" },
    { value: "20,000+", label: "Аялал" },
    { value: "98%", label: "Сэтгэл ханамж" },
  ]

  return (
    <main className="flex-1 bg-gray-100 pt-6 pb-12">
      <div className="container mx-auto px-4">
        {/* Зүүн, баруун талын sidebar-уудыг арилгаж, голын хэсгийг бүтэн өргөнтэй болгох */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Section */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="relative h-64 md:h-80">
              <Image src="/vast-mongolian-road.png" alt="Тээврийн үйлчилгээ" fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm px-3 py-1 text-sm mb-3 w-fit">
                  {settings.siteName || "МонголТээвэр"} платформ
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Тээврийн <span className="text-primary">үйлчилгээг</span> илүү хялбар болгоё
                </h1>
                <p className="text-white/90 max-w-md">
                  Зорчигч тээвэр, ачаа тээвэр, хүргэлтийн үйлчилгээг нэг дороос захиалаарай
                </p>
              </div>
            </div>
            <CardContent className="p-6 bg-white">
              {/* Facebook-style search bar */}
              <div className="mb-4">
                <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <PopoverTrigger asChild>
                    <div className="relative w-full">
                      <div className="flex items-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2 cursor-pointer">
                        <Search className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-gray-500 text-sm">Хаанаас хаашаа явахаа хайх...</span>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-4 border-b">
                      <div className="flex items-center">
                        <div className="bg-gray-100 flex items-center rounded-full px-3 py-2 flex-1">
                          <Search className="h-4 w-4 text-gray-500 mr-2" />
                          <Input
                            type="text"
                            placeholder="Хаанаас хаашаа явахаа хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 text-sm"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="ml-2 rounded-full p-1 hover:bg-gray-200"
                            >
                              <X className="h-3 w-3 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <h3 className="text-sm font-medium px-2 py-1.5">Сүүлийн хайлтууд</h3>
                      {recentSearches.map((search, index) => (
                        <div
                          key={index}
                          className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded-md cursor-pointer"
                          onClick={() => {
                            setFromLocation(search.from)
                            setToLocation(search.to)
                            setIsSearchOpen(false)
                            handleSearch()
                          }}
                        >
                          <div className="bg-gray-200 rounded-full p-2 mr-3">
                            <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {search.from} - {search.to}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2 border-t">
                      <h3 className="text-sm font-medium px-2 py-1.5">Түгээмэл чиглэлүүд</h3>
                      <div className="flex flex-wrap gap-2 p-2">
                        {popularDestinations.map((destination, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                            onClick={() => {
                              setFromLocation("Улаанбаатар")
                              setToLocation(destination)
                              setIsSearchOpen(false)
                            }}
                          >
                            {destination}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Хаанаас</p>
                          <Select value={fromLocation} onValueChange={setFromLocation}>
                            <SelectTrigger id="from" className="text-sm">
                              <SelectValue placeholder="Хаанаас" />
                            </SelectTrigger>
                            <SelectContent>
                              {locationData.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Хаашаа</p>
                          <Select value={toLocation} onValueChange={setToLocation}>
                            <SelectTrigger id="to" className="text-sm">
                              <SelectValue placeholder="Хаашаа" />
                            </SelectTrigger>
                            <SelectContent>
                              {locationData.map((location) => (
                                <SelectItem key={location.value} value={location.value}>
                                  {location.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleSearch} className="w-full mt-3">
                        <Search className="h-4 w-4 mr-2" /> Хайх
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick search buttons */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-gray-50 border-gray-200"
                  onClick={() => {
                    setFromLocation("Улаанбаатар")
                    setToLocation("Дархан")
                    handleSearch()
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  УБ - Дархан
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-gray-50 border-gray-200"
                  onClick={() => {
                    setFromLocation("Улаанбаатар")
                    setToLocation("Эрдэнэт")
                    handleSearch()
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  УБ - Эрдэнэт
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full bg-gray-50 border-gray-200"
                  onClick={() => {
                    setFromLocation("Дархан")
                    setToLocation("Эрдэнэт")
                    handleSearch()
                  }}
                >
                  <MapPin className="h-3 w-3 mr-1 text-primary" />
                  Дархан - Эрдэнэт
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-2xl font-bold">Бидний тухай</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-muted-foreground mb-4">
                {settings.siteName || "МонголТээвэр"} нь Монгол улсын тээврийн салбарт шинэ стандарт тогтоох зорилготой
                дижитал платформ юм. Бид зорчигч тээвэр, ачаа тээвэр, хүргэлтийн үйлчилгээг нэг дор нэгтгэж,
                хэрэглэгчдэд хялбар, найдвартай, хурдан шуурхай үйлчилгээ үзүүлэхийг зорьж байна.
              </p>
              <p className="text-muted-foreground">
                Манай платформ нь жолооч болон зорчигч, үйлчлүүлэгчдийг шууд холбож, илүү үр ашигтай, хямд үнэтэй
                үйлчилгээг бий болгож байна. Бид технологийн дэвшлийг ашиглан тээврийн салбарыг илүү ил тод, аюулгүй,
                хүртээмжтэй болгохыг зорьж байна.
              </p>
            </CardContent>
          </Card>

          {/* Features Section */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-2xl font-bold">Үйлчилгээний төрлүүд</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl h-fit">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits Section */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-2xl font-bold">Бидний давуу талууд</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-primary/10 p-2 rounded-full">{benefit.icon}</div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-2xl font-bold">Хэрхэн ажилладаг вэ?</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-lg">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:flex items-center justify-center">
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-2xl font-bold">Бидний тоо баримт</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-primary/5 border-0">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Бидэнтэй нэгдээрэй</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Монголын тээврийн салбарыг хамтдаа хөгжүүлцгээе. Одоо бүртгүүлж, үйлчилгээг ашиглаарай.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/auth/register">
                    <Button size="lg" className="gap-2">
                      Бүртгүүлэх <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/help">
                    <Button size="lg" variant="outline">
                      Тусламж авах
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
