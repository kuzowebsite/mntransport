"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Calendar, Clock, MapPin, User, Phone, AlertTriangle, CheckCircle, XCircle, Star } from "lucide-react"
import { useBooking, type Booking, type BookingStatus } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { aimags } from "@/lib/location-data"

type BookingCardProps = {
  booking: Booking
}

export function BookingCard({ booking }: BookingCardProps) {
  const { user } = useAuth()
  const { confirmBooking, completeBooking, cancelBooking, rateBooking } = useBooking()
  const [isLoading, setIsLoading] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)

  const isProvider = user?.uid === booking.providerId
  const isSeeker = user?.uid === booking.seekerId

  const handleConfirm = async () => {
    setIsLoading(true)
    await confirmBooking(booking.id)
    setIsLoading(false)
  }

  const handleComplete = async () => {
    setIsLoading(true)
    await completeBooking(booking.id)
    setIsLoading(false)
  }

  const handleCancel = async () => {
    if (!cancellationReason.trim()) return

    setIsLoading(true)
    const success = await cancelBooking(booking.id, cancellationReason)
    setIsLoading(false)

    if (success) {
      setShowCancelDialog(false)
      setCancellationReason("")
    }
  }

  const handleRate = async () => {
    setIsLoading(true)
    const success = await rateBooking(booking.id, rating, review)
    setIsLoading(false)

    if (success) {
      setShowRatingDialog(false)
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Хүлээгдэж буй
          </Badge>
        )
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Баталгаажсан
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Дууссан
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Цуцлагдсан
          </Badge>
        )
      case "no-show":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Ирээгүй
          </Badge>
        )
      default:
        return <Badge variant="outline">Тодорхойгүй</Badge>
    }
  }

  // Helper function to get aimag name in Mongolian
  const getAimagName = (aimagValue: string | undefined): string => {
    if (!aimagValue) return ""

    const aimag = aimags.find((a) => a.value === aimagValue)
    return aimag ? aimag.label : aimagValue
  }

  // Helper function to format location display
  const formatLocation = (): string => {
    if (booking.postType === "delivery") {
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

      const fromDistrictName = booking.fromDistrict ? districtMap[booking.fromDistrict] || booking.fromDistrict : ""
      const toDistrictName = booking.toDistrict ? districtMap[booking.toDistrict] || booking.toDistrict : ""

      return `${fromDistrictName} → ${toDistrictName}`
    }

    let fromLocation = ""
    let toLocation = ""

    // Handle from location
    if (booking.from) {
      if (booking.from.includes(":")) {
        // Format is "aimag:sum"
        const [aimagValue, sumValue] = booking.from.split(":")
        fromLocation = getAimagName(aimagValue)
      } else {
        // It's either just an aimag or aimag-center
        fromLocation = getAimagName(booking.from)
      }
    }

    // Handle to location
    if (booking.to) {
      if (booking.to.includes(":")) {
        // Format is "aimag:sum"
        const [aimagValue, sumValue] = booking.to.split(":")
        toLocation = getAimagName(aimagValue)
      } else {
        // It's either just an aimag or aimag-center
        toLocation = getAimagName(booking.to)
      }
    }

    return `${fromLocation} - ${toLocation}`
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{formatLocation()}</CardTitle>
          {getStatusBadge(booking.status)}
        </div>
        <CardDescription>
          {booking.postType === "province" &&
            booking.serviceType === "provider" &&
            booking.providerType === "passenger" &&
            "Зорчигч тээвэрлэх"}
          {booking.postType === "province" &&
            booking.serviceType === "provider" &&
            booking.providerType === "cargo" &&
            "Ачаа тээвэрлэх"}
          {booking.postType === "province" &&
            booking.serviceType === "seeker" &&
            booking.seekerType === "ride" &&
            "Унаа хайж байна"}
          {booking.postType === "province" &&
            booking.serviceType === "seeker" &&
            booking.seekerType === "cargo" &&
            "Ачаа тээвэрлэх унаа хайж байна"}
          {booking.postType === "delivery" && "Хүргэлтийн үйлчилгээ"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          {booking.date && (
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{booking.date}</span>
            </div>
          )}

          {booking.time && (
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{booking.time}</span>
            </div>
          )}

          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{formatLocation()}</span>
          </div>

          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>
              {isProvider ? `Захиалагч: ${booking.seekerName}` : `Үйлчилгээ үзүүлэгч: ${booking.providerName}`}
            </span>
          </div>

          <div className="flex items-center">
            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{isProvider ? booking.seekerPhone : booking.providerPhone}</span>
          </div>

          {booking.status === "cancelled" && booking.cancellationReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Цуцлалтын шалтгаан:</p>
                  <p className="text-sm text-red-700">{booking.cancellationReason}</p>
                  {booking.cancellationFee && booking.cancellationFee > 0 && (
                    <p className="text-sm font-medium text-red-800 mt-1">Торгууль: {booking.cancellationFee}₮</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {booking.rating && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <div className="flex items-start">
                <Star className="mr-2 h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-blue-800">Үнэлгээ:</p>
                    <div className="flex ml-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < booking.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {booking.review && <p className="text-sm text-blue-700 mt-1">{booking.review}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">{booking.price}₮</span>

            {/* Action buttons based on status and user role */}
            <div className="flex gap-2">
              {/* Provider actions */}
              {isProvider && booking.status === "pending" && (
                <>
                  <Button size="sm" onClick={handleConfirm} disabled={isLoading} className="flex items-center gap-1">
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Баталгаажуулах
                  </Button>
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Цуцлах
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Захиалга цуцлах</DialogTitle>
                        <DialogDescription>
                          Захиалга цуцлах шалтгаанаа оруулна уу. Аяллын өдөр ойртох тусам цуцлалтын торгууль нэмэгдэнэ.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Цуцлах шалтгаан..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Буцах
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancel}
                          disabled={isLoading || !cancellationReason.trim()}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Цуцлах
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {isProvider && booking.status === "confirmed" && (
                <>
                  <Button size="sm" onClick={handleComplete} disabled={isLoading} className="flex items-center gap-1">
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                    Дуусгах
                  </Button>
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Цуцлах
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Захиалга цуцлах</DialogTitle>
                        <DialogDescription>
                          Захиалга цуцлах шалтгаанаа оруулна уу. Аяллын өдөр ойртох тусам цуцлалтын торгууль нэмэгдэнэ.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Цуцлах шалтгаан..."
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Буцах
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancel}
                          disabled={isLoading || !cancellationReason.trim()}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Цуцлах
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* Seeker actions */}
              {isSeeker && (booking.status === "pending" || booking.status === "confirmed") && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Цуцлах
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Захиалга цуцлах</DialogTitle>
                      <DialogDescription>
                        Захиалга цуцлах шалтгаанаа оруулна уу. Аяллын өдөр ойртох тусам цуцлалтын торгууль нэмэгдэнэ.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      placeholder="Цуцлах шалтгаан..."
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Буцах
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={isLoading || !cancellationReason.trim()}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Цуцлах
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Rating option for seeker when booking is completed */}
              {isSeeker && booking.status === "completed" && !booking.rating && (
                <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Үнэлгээ өгөх
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Үйлчилгээнд үнэлгээ өгөх</DialogTitle>
                      <DialogDescription>Үйлчилгээний чанарт үнэлгээ өгнө үү</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center my-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-8 w-8 cursor-pointer ${
                            star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                    <Textarea
                      placeholder="Сэтгэгдэл (заавал биш)..."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
                        Буцах
                      </Button>
                      <Button onClick={handleRate} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Үнэлэх
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
