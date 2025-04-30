"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, get, update, remove } from "firebase/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, UserCheck, UserX } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = ref(database, "users")
        const snapshot = await get(usersRef)

        if (snapshot.exists()) {
          const usersData = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setUsers(usersData)
          setFilteredUsers(usersData)
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Алдаа",
          description: "Хэрэглэгчдийн мэдээлэл авахад алдаа гарлаа",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone?.includes(searchQuery),
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const handleVerifyUser = async (userId: string, type: "provider" | "seeker", status: string) => {
    try {
      const userRef = ref(database, `users/${userId}`)
      const field = type === "provider" ? "providerVerificationStatus" : "seekerVerificationStatus"

      await update(userRef, {
        [field]: status,
      })

      setUsers(users.map((user) => (user.id === userId ? { ...user, [field]: status } : user)))

      toast({
        title: "Амжилттай",
        description: `Хэрэглэгчийн баталгаажуулалтын төлөв шинэчлэгдлээ`,
      })
    } catch (error) {
      console.error("Error updating user verification:", error)
      toast({
        title: "Алдаа",
        description: "Хэрэглэгчийн баталгаажуулалтын төлөв шинэчлэхэд алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?")) {
      return
    }

    try {
      const userRef = ref(database, `users/${userId}`)
      await remove(userRef)

      setUsers(users.filter((user) => user.id !== userId))
      toast({
        title: "Амжилттай",
        description: "Хэрэглэгч устгагдлаа",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Алдаа",
        description: "Хэрэглэгч устгахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const getVerificationBadge = (status: string) => {
    if (!status || status === "none") {
      return <Badge variant="destructive">Баталгаажаагүй</Badge>
    } else if (status === "pending") {
      return <Badge variant="outline">Хүлээгдэж буй</Badge>
    } else if (status === "partial") {
      return <Badge variant="warning">Дутуу</Badge>
    } else if (status === "verified") {
      return <Badge variant="success">Баталгаажсан</Badge>
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
        <h1 className="text-3xl font-bold">Хэрэглэгчид</h1>
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
              <TableHead>Нэр</TableHead>
              <TableHead>Имэйл</TableHead>
              <TableHead>Утас</TableHead>
              <TableHead>Үйлчилгээ үзүүлэгч</TableHead>
              <TableHead>Үйлчилгээ хайгч</TableHead>
              <TableHead>Бүртгүүлсэн</TableHead>
              <TableHead className="text-right">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "—"}</TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                  <TableCell>{getVerificationBadge(user.providerVerificationStatus)}</TableCell>
                  <TableCell>{getVerificationBadge(user.seekerVerificationStatus)}</TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("mn-MN") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Цэс нээх</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "provider", "verified")}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Үйлчилгээ үзүүлэгчээр баталгаажуулах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "seeker", "verified")}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Үйлчилгээ хайгчаар баталгаажуулах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "provider", "none")}>
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Үйлчилгээ үзүүлэгч баталгаажуулалт цуцлах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleVerifyUser(user.id, "seeker", "none")}>
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Үйлчилгээ хайгч баталгаажуулалт цуцлах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
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
                  Хэрэглэгч олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
