"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, get, update } from "firebase/database"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, CheckCircle, XCircle, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [filteredVerifications, setFilteredVerifications] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const usersRef = ref(database, "users")
        const snapshot = await get(usersRef)

        if (snapshot.exists()) {
          const usersData = Object.entries(snapshot.val())

          // Extract verification requests
          const verificationRequests: any[] = []

          usersData.forEach(([userId, userData]: [string, any]) => {
            // Provider verification requests
            if (userData.providerVerificationStatus === "pending" && userData.providerVerificationDocs) {
              verificationRequests.push({
                id: `${userId}-provider`,
                userId,
                userName: userData.name || "Unknown",
                type: "provider",
                status: "pending",
                documents: userData.providerVerificationDocs || {},
                submittedAt: userData.providerVerificationSubmitted || Date.now(),
              })
            }

            // Seeker verification requests
            if (userData.seekerVerificationStatus === "pending" && userData.seekerVerificationDocs) {
              verificationRequests.push({
                id: `${userId}-seeker`,
                userId,
                userName: userData.name || "Unknown",
                type: "seeker",
                status: "pending",
                documents: userData.seekerVerificationDocs || {},
                submittedAt: userData.seekerVerificationSubmitted || Date.now(),
              })
            }
          })

          setVerifications(verificationRequests)
          setFilteredVerifications(verificationRequests)
        }
      } catch (error) {
        console.error("Error fetching verifications:", error)
        toast({
          title: "Алдаа",
          description: "Баталгаажуулалтын мэдээлэл авахад алдаа гарлаа",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchVerifications()
  }, [toast])

  useEffect(() => {
    if (searchQuery) {
      const filtered = verifications.filter(
        (verification) =>
          verification.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          verification.userId?.includes(searchQuery),
      )
      setFilteredVerifications(filtered)
    } else {
      setFilteredVerifications(verifications)
    }
  }, [searchQuery, verifications])

  const handleApproveVerification = async (verification: any) => {
    try {
      const userRef = ref(database, `users/${verification.userId}`)
      const field = verification.type === "provider" ? "providerVerificationStatus" : "seekerVerificationStatus"

      await update(userRef, {
        [field]: "verified",
      })

      // Remove from list
      setVerifications(verifications.filter((v) => v.id !== verification.id))

      toast({
        title: "Амжилттай",
        description: "Баталгаажуулалт амжилттай",
      })
    } catch (error) {
      console.error("Error approving verification:", error)
      toast({
        title: "Алдаа",
        description: "Баталгаажуулахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleRejectVerification = async (verification: any) => {
    try {
      const userRef = ref(database, `users/${verification.userId}`)
      const field = verification.type === "provider" ? "providerVerificationStatus" : "seekerVerificationStatus"

      await update(userRef, {
        [field]: "none",
      })

      // Remove from list
      setVerifications(verifications.filter((v) => v.id !== verification.id))

      toast({
        title: "Амжилттай",
        description: "Баталгаажуулалт цуцлагдлаа",
      })
    } catch (error) {
      console.error("Error rejecting verification:", error)
      toast({
        title: "Алдаа",
        description: "Баталгаажуулалт цуцлахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleViewDocuments = (verification: any) => {
    setSelectedVerification(verification)
    setDialogOpen(true)
  }

  const getTypeBadge = (type: string) => {
    if (type === "provider") {
      return <Badge>Үйлчилгээ үзүүлэгч</Badge>
    } else if (type === "seeker") {
      return <Badge variant="secondary">Үйлчилгээ хайгч</Badge>
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
        <h1 className="text-3xl font-bold">Баталгаажуулалт</h1>
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
              <TableHead>Хэрэглэгч</TableHead>
              <TableHead>Төрөл</TableHead>
              <TableHead>Хүсэлт илгээсэн</TableHead>
              <TableHead>Баримтын тоо</TableHead>
              <TableHead className="text-right">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVerifications.length > 0 ? (
              filteredVerifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell className="font-medium">{verification.userName || "—"}</TableCell>
                  <TableCell>{getTypeBadge(verification.type)}</TableCell>
                  <TableCell>
                    {verification.submittedAt ? new Date(verification.submittedAt).toLocaleDateString("mn-MN") : "—"}
                  </TableCell>
                  <TableCell>{verification.documents ? Object.keys(verification.documents).length : 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Цэс нээх</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocuments(verification)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Баримт харах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApproveVerification(verification)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Баталгаажуулах</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRejectVerification(verification)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Цуцлах</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Баталгаажуулалтын хүсэлт олдсонгүй
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Баталгаажуулалтын баримт</DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVerification.documents &&
                  Object.entries(selectedVerification.documents).map(([key, url]: [string, any]) => (
                    <div key={key} className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">{key}</h3>
                      {url && (
                        <div className="aspect-video relative">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Document ${key}`}
                            className="rounded-md object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Хаах
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRejectVerification(selectedVerification)
                    setDialogOpen(false)
                  }}
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={() => {
                    handleApproveVerification(selectedVerification)
                    setDialogOpen(false)
                  }}
                >
                  Баталгаажуулах
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
