"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, set, get, remove } from "firebase/database"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

type BookmarkContextType = {
  bookmarks: string[]
  isLoading: boolean
  toggleBookmark: (postId: string) => Promise<boolean>
  isBookmarked: (postId: string) => boolean
}

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  isLoading: true,
  toggleBookmark: async () => false,
  isBookmarked: () => false,
})

export const useBookmark = () => useContext(BookmarkContext)

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  // Fetch bookmarks from Firebase
  useEffect(() => {
    if (!user) {
      setBookmarks([])
      setIsLoading(false)
      return
    }

    const bookmarksRef = ref(database, `bookmarks/${user.uid}`)
    const unsubscribe = onValue(bookmarksRef, (snapshot) => {
      if (snapshot.exists()) {
        const bookmarksData = snapshot.val()
        setBookmarks(Object.keys(bookmarksData))
      } else {
        setBookmarks([])
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Toggle bookmark
  const toggleBookmark = async (postId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Алдаа",
        description: "Та нэвтэрсэн байх шаардлагатай",
        variant: "destructive",
      })
      return false
    }

    try {
      const bookmarkRef = ref(database, `bookmarks/${user.uid}/${postId}`)
      const snapshot = await get(bookmarkRef)

      if (snapshot.exists()) {
        // Remove bookmark
        await remove(bookmarkRef)
        toast({
          title: "Амжилттай",
          description: "Зар хадгалагдсан жагсаалтаас хасагдлаа",
        })
      } else {
        // Add bookmark
        await set(bookmarkRef, true)
        toast({
          title: "Амжилттай",
          description: "Зар хадгалагдлаа",
        })
      }

      return true
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      toast({
        title: "Алдаа",
        description: "Зар хадгалахад алдаа гарлаа",
        variant: "destructive",
      })
      return false
    }
  }

  // Check if a post is bookmarked
  const isBookmarked = (postId: string): boolean => {
    return bookmarks.includes(postId)
  }

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isLoading,
        toggleBookmark,
        isBookmarked,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  )
}
