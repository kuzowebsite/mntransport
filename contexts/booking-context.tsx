"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, push, set, update, get } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no-show"

export type Booking = {
  id: string
  postId: string
  providerId: string
  seekerId: string
  providerName: string
  seekerName: string
  providerPhone: string
  seekerPhone: string
  postType: string
  serviceType: string
  providerType?: string
  seekerType?: string
  from?: string
  to?: string
  fromDistrict?: string
  toDistrict?: string
  date?: string
  time?: string
  price: string
  status: BookingStatus
  createdAt: string
  confirmedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  cancellationFee?: number
  rating?: number
  review?: string
}

type BookingContextType = {
  bookings: Booking[]
  providedBookings: Booking[]
  requestedBookings: Booking[]
  isLoading: boolean
  createBooking: (postId: string, providerId: string) => Promise<string | null>
  confirmBooking: (bookingId: string) => Promise<boolean>
  completeBooking: (bookingId: string) => Promise<boolean>
  cancelBooking: (bookingId: string, reason: string) => Promise<boolean>
  rateBooking: (bookingId: string, rating: number, review?: string) => Promise<boolean>
  getBookingById: (bookingId: string) => Booking | null
  getBookingsByPostId: (postId: string) => Booking[]
  getBookingStatus: (postId: string) => BookingStatus | null
  hasActiveBooking: (postId: string) => boolean
}

const BookingContext = createContext<BookingContextType>({
  bookings: [],
  providedBookings: [],
  requestedBookings: [],
  isLoading: true,
  createBooking: async () => null,
  confirmBooking: async () => false,
  completeBooking: async () => false,
  cancelBooking: async () => false,
  rateBooking: async () => false,
  getBookingById: () => null,
  getBookingsByPostId: () => [],
  getBookingStatus: () => null,
  hasActiveBooking: () => false,
})

export const useBooking = () => useContext(BookingContext)

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providedBookings, setProvidedBookings] = useState<Booking[]>([])
  const [requestedBookings, setRequestedBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch bookings from Firebase
  useEffect(() => {
    if (!user) {
      setBookings([])
      setProvidedBookings([])
      setRequestedBookings([])
      setIsLoading(false)
      return
    }

    const bookingsRef = ref(database, "bookings")
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const bookingsData = snapshot.val()
        const bookingsArray = Object.keys(bookingsData).map((key) => ({
          id: key,
          ...bookingsData[key],
        }))

        // Filter bookings related to the current user
        const userBookings = bookingsArray.filter(
          (booking) => booking.providerId === user.uid || booking.seekerId === user.uid,
        )

        // Sort by createdAt (newest first)
        userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        // Split bookings into provided and requested
        const provided = userBookings.filter((booking) => booking.providerId === user.uid)
        const requested = userBookings.filter((booking) => booking.seekerId === user.uid)

        setBookings(userBookings)
        setProvidedBookings(provided)
        setRequestedBookings(requested)
      } else {
        setBookings([])
        setProvidedBookings([])
        setRequestedBookings([])
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Create a new booking
  const createBooking = async (postId: string, providerId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Алдаа",
        description: "Та нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      return null
    }

    try {
      // Check if user already has an active booking for this post
      const existingBookings = bookings.filter(
        (booking) => booking.postId === postId && (booking.status === "pending" || booking.status === "confirmed"),
      )

      if (existingBookings.length > 0) {
        toast({
          title: "Алдаа",
          description: "Та энэ зарт идэвхтэй захиалга үүсгэсэн байна",
          variant: "destructive",
        })
        return null
      }

      // Get post details
      const postRef = ref(database, `posts/${postId}`)
      const postSnapshot = await get(postRef)

      if (!postSnapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Зар олдсонгүй",
          variant: "destructive",
        })
        return null
      }

      const postData = postSnapshot.val()

      // Get provider details
      const providerRef = ref(database, `users/${providerId}`)
      const providerSnapshot = await get(providerRef)

      if (!providerSnapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Үйлчилгээ үзүүлэгч олдсонгүй",
          variant: "destructive",
        })
        return null
      }

      const providerData = providerSnapshot.val()

      // Get seeker details (current user)
      const seekerRef = ref(database, `users/${user.uid}`)
      const seekerSnapshot = await get(seekerRef)

      if (!seekerSnapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Хэрэглэгчийн мэдээлэл олдсонгүй",
          variant: "destructive",
        })
        return null
      }

      const seekerData = seekerSnapshot.val()

      // Create booking object
      const bookingData: Omit<Booking, "id"> = {
        postId,
        providerId,
        seekerId: user.uid,
        providerName: providerData.name,
        seekerName: seekerData.name,
        providerPhone: providerData.phone,
        seekerPhone: seekerData.phone,
        postType: postData.postType,
        serviceType: postData.serviceType,
        // Only include these fields if they exist in postData
        ...(postData.providerType && { providerType: postData.providerType }),
        ...(postData.seekerType && { seekerType: postData.seekerType }),
        ...(postData.from && { from: postData.from }),
        ...(postData.to && { to: postData.to }),
        ...(postData.fromDistrict && { fromDistrict: postData.fromDistrict }),
        ...(postData.toDistrict && { toDistrict: postData.toDistrict }),
        ...(postData.date && { date: postData.date }),
        ...(postData.time && { time: postData.time }),
        price: postData.price,
        status: "pending",
        createdAt: new Date().toISOString(),
      }

      // Save to Firebase
      const bookingsRef = ref(database, "bookings")
      const newBookingRef = push(bookingsRef)
      await set(newBookingRef, bookingData)

      toast({
        title: "Амжилттай",
        description: "Захиалга амжилттай үүсгэгдлээ",
      })

      return newBookingRef.key
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга үүсгэхэд алдаа гарлаа",
        variant: "destructive",
      })
      return null
    }
  }

  // Confirm a booking
  const confirmBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      const snapshot = await get(bookingRef)

      if (!snapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Захиалга олдсонгүй",
          variant: "destructive",
        })
        return false
      }

      const bookingData = snapshot.val()

      // Check if the current user is the provider
      if (bookingData.providerId !== user.uid) {
        toast({
          title: "Алдаа",
          description: "Та энэ захиалгыг баталгаажуулах эрхгүй байна",
          variant: "destructive",
        })
        return false
      }

      // Check if the booking is in pending status
      if (bookingData.status !== "pending") {
        toast({
          title: "Алдаа",
          description: "Зөвхөн хүлээгдэж буй захиалгыг баталгаажуулах боломжтой",
          variant: "destructive",
        })
        return false
      }

      // Update booking status
      await update(bookingRef, {
        status: "confirmed",
        confirmedAt: new Date().toISOString(),
      })

      toast({
        title: "Амжилттай",
        description: "Захиалга амжилттай баталгаажлаа",
      })

      return true
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга баталгаажуулахад алдаа гарлаа",
        variant: "destructive",
      })
      return false
    }
  }

  // Complete a booking
  const completeBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      const snapshot = await get(bookingRef)

      if (!snapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Захиалга олдсонгүй",
          variant: "destructive",
        })
        return false
      }

      const bookingData = snapshot.val()

      // Check if the current user is the provider
      if (bookingData.providerId !== user.uid) {
        toast({
          title: "Алдаа",
          description: "Та энэ захиалгыг дуусгах эрхгүй байна",
          variant: "destructive",
        })
        return false
      }

      // Check if the booking is in confirmed status
      if (bookingData.status !== "confirmed") {
        toast({
          title: "Алдаа",
          description: "Зөвхөн баталгаажсан захиалгыг дуусгах боломжтой",
          variant: "destructive",
        })
        return false
      }

      // Update booking status
      await update(bookingRef, {
        status: "completed",
        completedAt: new Date().toISOString(),
      })

      toast({
        title: "Амжилттай",
        description: "Захиалга амжилттай дууслаа",
      })

      return true
    } catch (error) {
      console.error("Error completing booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга дуусгахад алдаа гарлаа",
        variant: "destructive",
      })
      return false
    }
  }

  // Cancel a booking
  const cancelBooking = async (bookingId: string, reason: string): Promise<boolean> => {
    if (!user) return false

    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      const snapshot = await get(bookingRef)

      if (!snapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Захиалга олдсонгүй",
          variant: "destructive",
        })
        return false
      }

      const bookingData = snapshot.val()

      // Check if the current user is involved in this booking
      if (bookingData.providerId !== user.uid && bookingData.seekerId !== user.uid) {
        toast({
          title: "Алдаа",
          description: "Та энэ захиалгыг цуцлах эрхгүй байна",
          variant: "destructive",
        })
        return false
      }

      // Check if the booking can be cancelled
      if (bookingData.status !== "pending" && bookingData.status !== "confirmed") {
        toast({
          title: "Алдаа",
          description: "Энэ захиалгыг цуцлах боломжгүй",
          variant: "destructive",
        })
        return false
      }

      // Calculate cancellation fee if applicable
      let cancellationFee = 0
      const isProvider = bookingData.providerId === user.uid
      const bookingDate = bookingData.date ? new Date(bookingData.date) : null

      if (bookingDate) {
        const today = new Date()
        const diffTime = bookingDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // If cancellation is within 24 hours of the trip
        if (diffDays <= 1) {
          // Provider pays higher fee for last-minute cancellation
          cancellationFee = isProvider ? 2000 : 1000
        } else if (diffDays <= 3) {
          // Smaller fee for cancellations 1-3 days before
          cancellationFee = isProvider ? 1000 : 500
        }
      }

      // Update booking status
      await update(bookingRef, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancelledBy: user.uid,
        cancellationReason: reason,
        cancellationFee: cancellationFee,
      })

      // If there's a cancellation fee, update user's record
      if (cancellationFee > 0) {
        const userRef = ref(database, `users/${user.uid}`)
        const userSnapshot = await get(userRef)

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val()
          const currentFees = userData.cancellationFees || 0
          const currentCancellations = userData.cancellations || 0

          await update(userRef, {
            cancellationFees: currentFees + cancellationFee,
            cancellations: currentCancellations + 1,
          })
        }
      }

      toast({
        title: "Захиалга цуцлагдлаа",
        description:
          cancellationFee > 0 ? `Захиалга цуцлагдлаа. Торгууль: ${cancellationFee}₮` : "Захиалга амжилттай цуцлагдлаа",
        variant: cancellationFee > 0 ? "destructive" : "default",
      })

      return true
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Алдаа",
        description: "Захиалга цуцлахад алдаа гарлаа",
        variant: "destructive",
      })
      return false
    }
  }

  // Rate a booking
  const rateBooking = async (bookingId: string, rating: number, review?: string): Promise<boolean> => {
    if (!user) return false

    try {
      const bookingRef = ref(database, `bookings/${bookingId}`)
      const snapshot = await get(bookingRef)

      if (!snapshot.exists()) {
        toast({
          title: "Алдаа",
          description: "Захиалга олдсонгүй",
          variant: "destructive",
        })
        return false
      }

      const bookingData = snapshot.val()

      // Check if the current user is the seeker
      if (bookingData.seekerId !== user.uid) {
        toast({
          title: "Алдаа",
          description: "Та энэ захиалгад үнэлгээ өгөх эрхгүй байна",
          variant: "destructive",
        })
        return false
      }

      // Check if the booking is completed
      if (bookingData.status !== "completed") {
        toast({
          title: "Алдаа",
          description: "Зөвхөн дууссан захиалгад үнэлгээ өгөх боломжтой",
          variant: "destructive",
        })
        return false
      }

      // Check if rating already exists
      if (bookingData.rating) {
        toast({
          title: "Алдаа",
          description: "Та энэ захиалгад үнэлгээ өгсөн байна",
          variant: "destructive",
        })
        return false
      }

      // Update booking with rating
      await update(bookingRef, {
        rating,
        review: review || "",
      })

      // Update provider's average rating
      const providerRef = ref(database, `users/${bookingData.providerId}`)
      const providerSnapshot = await get(providerRef)

      if (providerSnapshot.exists()) {
        const providerData = providerSnapshot.val()
        const currentRating = providerData.rating || 0
        const ratingCount = providerData.ratingCount || 0

        // Calculate new average rating
        const newRatingCount = ratingCount + 1
        const newRating = (currentRating * ratingCount + rating) / newRatingCount

        await update(providerRef, {
          rating: newRating,
          ratingCount: newRatingCount,
        })
      }

      toast({
        title: "Амжилттай",
        description: "Үнэлгээ амжилттай бүртгэгдлээ",
      })

      return true
    } catch (error) {
      console.error("Error rating booking:", error)
      toast({
        title: "Алдаа",
        description: "Үнэлгээ өгөхөд алдаа гарлаа",
        variant: "destructive",
      })
      return false
    }
  }

  // Get a booking by ID
  const getBookingById = (bookingId: string): Booking | null => {
    return bookings.find((booking) => booking.id === bookingId) || null
  }

  // Get bookings by post ID
  const getBookingsByPostId = (postId: string): Booking[] => {
    return bookings.filter((booking) => booking.postId === postId)
  }

  // Get booking status for a post
  const getBookingStatus = (postId: string): BookingStatus | null => {
    const postBookings = bookings.filter((booking) => booking.postId === postId)

    if (postBookings.length === 0) return null

    // Return the status of the most recent booking
    return postBookings[0].status
  }

  // Check if a post has an active booking
  const hasActiveBooking = (postId: string): boolean => {
    return bookings.some(
      (booking) => booking.postId === postId && (booking.status === "pending" || booking.status === "confirmed"),
    )
  }

  return (
    <BookingContext.Provider
      value={{
        bookings,
        providedBookings,
        requestedBookings,
        isLoading,
        createBooking,
        confirmBooking,
        completeBooking,
        cancelBooking,
        rateBooking,
        getBookingById,
        getBookingsByPostId,
        getBookingStatus,
        hasActiveBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}
