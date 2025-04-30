"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, database } from "@/lib/firebase"
import { ref, get, update } from "firebase/database"
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, LogOut, Settings } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function AdminProfileDropdown() {
  const router = useRouter()
  const { toast } = useToast()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        // Get user data from Firebase
        const userRef = ref(database, `users/${user.uid}`)
        const snapshot = await get(userRef)

        if (snapshot.exists()) {
          const userData = snapshot.val()
          setProfile({
            displayName: userData.displayName || "",
            email: user.email || "",
            phone: userData.phone || "",
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна")

      // Update user data in Firebase
      const userRef = ref(database, `users/${user.uid}`)
      await update(userRef, {
        displayName: profile.displayName,
        phone: profile.phone,
        updatedAt: Date.now(),
      })

      toast({
        title: "Амжилттай",
        description: "Профайл шинэчлэгдлээ",
      })

      setIsProfileOpen(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Профайл шинэчлэхэд алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) throw new Error("Хэрэглэгч нэвтрээгүй байна")
      if (!user.email) throw new Error("Хэрэглэгчийн имэйл олдсонгүй")

      // Validate passwords
      if (newPassword !== confirmPassword) {
        setError("Шинэ нууц үг таарахгүй байна")
        setLoading(false)
        return
      }

      if (newPassword.length < 6) {
        setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой")
        setLoading(false)
        return
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      toast({
        title: "Амжилттай",
        description: "Нууц үг шинэчлэгдлээ",
      })

      // Reset form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsPasswordOpen(false)
    } catch (error: any) {
      console.error("Error changing password:", error)

      if (error.code === "auth/wrong-password") {
        setError("Одоогийн нууц үг буруу байна")
      } else {
        setError("Нууц үг солиход алдаа гарлаа")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Админ профайл</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Профайл засах</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsPasswordOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Нууц үг солих</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Гарах</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Профайл засах</DialogTitle>
            <DialogDescription>Админ профайлын мэдээллийг шинэчлэх</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Алдаа</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Нэр</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">И-мэйл</Label>
              <Input id="email" type="email" value={profile.email} disabled className="bg-gray-100" />
              <p className="text-sm text-muted-foreground">И-мэйл хаягийг өөрчлөх боломжгүй</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Утасны дугаар</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleSaveProfile} disabled={loading}>
              {loading ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нууц үг солих</DialogTitle>
            <DialogDescription>Админ хэрэглэгчийн нууц үгийг шинэчлэх</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Алдаа</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Одоогийн нууц үг</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Шинэ нууц үг</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Шинэ нууц үг давтах</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? "Хадгалж байна..." : "Нууц үг солих"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
