"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, get, update, remove } from "firebase/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = ref(database, "bookings")
        const snapshot = await get(bookingsRef)

        if (snapshot.exists()) {
          const bookingsData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setBookings(bookingsData)
          setFilteredBookings(bookingsData)
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
        toast({
          title: "Алдаа",
          description: "Захиалгын мэдээлэл авахад алдаа гарлаа",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = bookings.filter(
        (booking) =>
          booking.userId?.includes(searchQuery) ||
          booking.providerId?.includes(searchQuery) ||
          booking.postId?.includes(searchQuery),
      )
      setFilteredBookings(filtered)
    } else {
      setFilteredBookings(bookings)
    }
  }, [searchQuery, bookings])

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      await update(bookingRef, { status: "confirmed" })

      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, status: "confirmed" } : booking)))

      toast({
        title: "Амжилттай",
        description: "Захиалга баталгаажлаа",
      })
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга баталгаажуулахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      await update(bookingRef, { status: "cancelled" })

      setBookings(bookings.map((booking) => (booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)))

      toast({
        title: "Амжилттай",
        description: "Захиалга цуцлагдлаа",
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга цуцлахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Энэ захиалгыг устгахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      await remove(bookingRef)

      setBookings(bookings.filter((booking) => booking.id !== bookingId))
      toast({
        title: "Амжилттай",
        description: "Захиалга устгагдлаа",
      })
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга устгахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    if (!status || status === "pending") {
      return <Badge variant="outline">Хүлээгдэж буй</Badge>
    } else if (status === "confirmed") {
      return <Badge variant="success">Баталгаажсан</Badge>
    } else if (status === "completed") {
      return <Badge variant="secondary">Дууссан</Badge>
    } else if (status === "cancelled") {
      return <Badge variant="destructive">Цуцлагдсан</Badge>
    }
    return null
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
        <h1 className="text-3xl font-bold">Захиалгууд</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Хайх..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Захиалгын ID</TableHead>
              <TableHead>Хэрэглэгч</TableHead>
              <TableHead>Үйлчилгээ үзүүлэгч</TableHead>
              <TableHead>Зарын ID</TableHead>
              <TableHead>Огноо</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="text-right">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.id.slice(0, 8)}...</TableCell>
                  <TableCell>{booking.userId ? booking.userId.slice(0, 8) + "..." : "—"}</TableCell>
                  <TableCell>{booking.providerId ? booking.providerId.slice(0, 8) + "..." : "—"}</TableCell>
                  <TableCell>{booking.postId ? booking.postId.slice(0, 8) + "..." : "—"}</TableCell>
                  <TableCell>
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("mn-MN") : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Цэс нээх</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleConfirmBooking(booking.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Баталгаажуулах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCancelBooking(booking.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Цуцлах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteBooking(booking.id)}
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Захиалга олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
