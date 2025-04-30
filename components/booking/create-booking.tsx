"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useBooking } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { aimags } from "@/lib/location-data"

type CreateBookingProps = {
  post: any
  providerId: string
}

export function CreateBooking({ post, providerId }: CreateBookingProps) {
  const { user } = useAuth()
  const { createBooking, hasActiveBooking } = useBooking()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleCreateBooking = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setIsLoading(true)
    const bookingId = await createBooking(post.id, providerId)
    setIsLoading(false)

    if (bookingId) {
      setShowDialog(false)
      router.push("/profile/bookings")
    }
  }

  // Check if this post already has an active booking
  const hasBooking = hasActiveBooking(post.id)

  // Helper function to get aimag name in Mongolian
  const getAimagName = (aimagValue: string | undefined): string => {
    if (!aimagValue) return ""

    const aimag = aimags.find((a) => a.value === aimagValue)
    return aimag ? aimag.label : aimagValue
  }

  // Helper function to format location display
  const formatLocation = (): string => {
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
        fromLocation = getAimagName(aimagValue)
      } else {
        // It's either just an aimag or aimag-center
        fromLocation = getAimagName(post.from)
      }
    }

    // Handle to location
    if (post.to) {
      if (post.to.includes(":")) {
        // Format is "aimag:sum"
        const [aimagValue, sumValue] = post.to.split(":")
        toLocation = getAimagName(aimagValue)
      } else {
        // It's either just an aimag or aimag-center
        toLocation = getAimagName(post.to)
      }
    }

    return `${fromLocation} - ${toLocation}`
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={hasBooking || user?.uid === providerId}>
          {hasBooking ? "Захиалга үүссэн" : user?.uid === providerId ? "Өөрийн зар" : "Захиалах"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Захиалга баталгаажуулах</DialogTitle>
          <DialogDescription>Та дараах үйлчилгээг захиалахдаа итгэлтэй байна уу?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Үйлчилгээний төрөл:</span>
            <span>
              {post.postType === "province" &&
                post.serviceType === "provider" &&
                post.providerType === "passenger" &&
                "Зорчигч тээвэрлэх"}
              {post.postType === "province" &&
                post.serviceType === "provider" &&
                post.providerType === "cargo" &&
                "Ачаа тээвэрлэх"}
              {post.postType === "delivery" && "Хүргэлтийн үйлчилгээ"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Чиглэл:</span>
            <span>{formatLocation()}</span>
          </div>

          {post.date && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Огноо:</span>
              <span>{post.date}</span>
            </div>
          )}

          {post.time && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Цаг:</span>
              <span>{post.time}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-medium">Үйлчилгээ үзүүлэгч:</span>
            <span>{post.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Утасны дугаар:</span>
            <span>{post.phone}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Үнэ:</span>
            <span className="font-bold">{post.price}₮</span>
          </div>

          <div className="bg-yellow-50 p-3 rounded-md mt-4">
            <p className="text-sm text-yellow-800">
              <strong>Анхааруулга:</strong> Захиалга цуцлах тохиолдолд аяллын өдөр ойртох тусам торгууль нэмэгдэнэ.
              Аяллын өдрөөс 3-аас дээш хоногийн өмнө цуцалбал торгуульгүй, 1-3 хоногийн өмнө цуцалбал 500-1000₮, 24
              цагийн дотор цуцалбал 1000-2000₮ торгууль ногдуулна.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Буцах
          </Button>
          <Button onClick={handleCreateBooking} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Захиалах
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
