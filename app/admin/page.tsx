"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"
import { Users, FileText, Calendar, ShieldCheck } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalBookings: 0,
    pendingVerifications: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersRef = ref(database, "users")
        const usersSnapshot = await get(usersRef)
        const usersData = usersSnapshot.val() || {}

        // Count regular users (excluding admins)
        let regularUsersCount = 0
        for (const userId in usersData) {
          if (usersData[userId].role !== "admin") {
            regularUsersCount++
          }
        }

        // Get recent users - without using orderByChild
        const usersArray = Object.entries(usersData)
          .map(([id, data]: [string, any]) => ({
            id,
            ...data,
            // Ensure createdAt exists, use current date as fallback
            createdAt: data.createdAt || new Date().toISOString(),
          }))
          // Filter out admin users
          .filter((user) => user.role !== "admin")
          // Sort by createdAt in client-side instead of using orderByChild
          .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime()
            const dateB = new Date(b.createdAt).getTime()
            return dateB - dateA // Descending order (newest first)
          })
          // Take only the 5 most recent users
          .slice(0, 5)

        // Fetch posts
        const postsRef = ref(database, "posts")
        const postsSnapshot = await get(postsRef)
        const postsData = postsSnapshot.val() || {}
        const postsCount = Object.keys(postsData).length

        // Fetch bookings
        const bookingsRef = ref(database, "bookings")
        const bookingsSnapshot = await get(bookingsRef)
        const bookingsData = bookingsSnapshot.val() || {}
        const bookingsCount = Object.keys(bookingsData).length

        // Count pending verifications
        let pendingVerificationsCount = 0
        for (const userId in usersData) {
          if (usersData[userId].verificationStatus === "pending") {
            pendingVerificationsCount++
          }
        }

        setStats({
          totalUsers: regularUsersCount, // Only count regular users
          totalPosts: postsCount,
          totalBookings: bookingsCount,
          pendingVerifications: pendingVerificationsCount,
        })

        setRecentUsers(usersArray)
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("mn-MN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      return "Огноо тодорхойгүй"
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />

      <div className="lg:pl-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Хяналтын самбар</h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Бүртгэлтэй хэрэглэгчид</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Нийт зар</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">Нийтлэгдсэн зарууд</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Нийт захиалга</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">Хийгдсэн захиалгууд</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Хүлээгдэж буй баталгаажуулалт</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                  <p className="text-xs text-muted-foreground">Шийдвэрлэх хүсэлтүүд</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Сүүлийн бүртгүүлсэн хэрэглэгчид</CardTitle>
                <CardDescription>Системд сүүлд бүртгүүлсэн 5 хэрэглэгч</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{user.name || "Нэр тодорхойгүй"}</p>
                          <p className="text-sm text-muted-foreground">{user.email || "Имэйл тодорхойгүй"}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">Хэрэглэгч олдсонгүй</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
