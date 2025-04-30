"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { database, storage } from "@/lib/firebase"
import { ref, onValue, push, set, update, get, remove } from "firebase/database"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2, Send, PaperclipIcon, X, Ban, AlertTriangle } from "lucide-react"
import { useAdminAuth } from "@/contexts/admin-auth-context"
import { ImageLightbox } from "@/components/chat/image-lightbox"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminChatPage() {
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { admin } = useAdminAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [bannedUsers, setBannedUsers] = useState<Record<string, boolean>>({})

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && selectedChat) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, selectedChat])

  // Load banned users
  useEffect(() => {
    const bannedUsersRef = ref(database, "bannedUsers")
    const unsubscribe = onValue(
      bannedUsersRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setBannedUsers(snapshot.val())
        } else {
          setBannedUsers({})
        }
      },
      (error) => {
        console.error("Error loading banned users:", error)
      },
    )

    return () => unsubscribe()
  }, [])

  // Load conversations
  useEffect(() => {
    console.log("Loading conversations...")
    setLoading(true)

    // Fetch conversations from Firebase
    const conversationsRef = ref(database, "conversations")
    const unsubscribe = onValue(
      conversationsRef,
      (snapshot) => {
        console.log("Conversations snapshot:", snapshot.exists())
        if (snapshot.exists()) {
          const data = snapshot.val()
          const conversationsList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
              unread: data[key].unread?.admin || false,
            }))
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime)

          console.log("Conversations found:", conversationsList.length)
          setConversations(conversationsList)
        } else {
          console.log("No conversations found")
          setConversations([])
        }
        setLoading(false)
      },
      (error) => {
        console.error("Error loading conversations:", error)
        toast({
          title: "Алдаа гарлаа",
          description: "Чатын жагсаалтыг ачааллахад алдаа гарлаа",
          variant: "destructive",
        })
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    console.log("Loading messages for chat:", selectedChat)
    setLoadingMessages(true)

    // Fetch messages for selected chat
    const messagesRef = ref(database, `messages/${selectedChat}`)

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        console.log("Messages snapshot:", snapshot.exists())
        if (snapshot.exists()) {
          const data = snapshot.val()
          const messagesList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .sort((a, b) => a.timestamp - b.timestamp)

          console.log("Messages found:", messagesList.length)
          setMessages(messagesList)

          // Mark as read
          if (conversations.find((c) => c.id === selectedChat)?.unread) {
            update(ref(database, `conversations/${selectedChat}/unread`), {
              admin: false,
            }).catch((error) => {
              console.error("Error marking as read:", error)
            })
          }
        } else {
          console.log("No messages found")
          setMessages([])
        }
        setLoadingMessages(false)
      },
      (error) => {
        console.error("Error loading messages:", error)
        toast({
          title: "Алдаа гарлаа",
          description: "Мессежүүдийг ачааллахад алдаа гарлаа",
          variant: "destructive",
        })
        setLoadingMessages(false)
      },
    )

    return () => unsubscribe()
  }, [selectedChat, conversations])

  const handleSendMessage = async () => {
    if (!messageText.trim() && !isUploading) return
    if (!selectedChat) return

    try {
      const newMessageRef = push(ref(database, `messages/${selectedChat}`))

      await set(newMessageRef, {
        text: messageText.trim(),
        sender: "admin",
        senderName: "Админ",
        timestamp: Date.now(),
        isAdmin: true,
      })

      // Update last message in conversation
      await update(ref(database, `conversations/${selectedChat}`), {
        lastMessage: messageText.trim() || "Файл илгээсэн",
        lastMessageTime: Date.now(),
      })

      // Mark as unread for the user
      const conversation = conversations.find((c) => c.id === selectedChat)
      if (conversation && conversation.participants) {
        const userId = conversation.participants.find((p: string) => p !== "admin")
        if (userId) {
          await update(ref(database, `conversations/${selectedChat}/unread`), {
            [userId]: true,
          })
        }
      }

      setMessageText("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Мессеж илгээхэд алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !selectedChat) return

    const file = event.target.files[0]
    setIsUploading(true)

    // Show preview if it's an image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }

    try {
      // Upload file to Firebase Storage
      const fileRef = storageRef(storage, `chat-files/${selectedChat}/${Date.now()}-${file.name}`)
      await uploadBytes(fileRef, file)
      const fileUrl = await getDownloadURL(fileRef)

      // Create message with file
      const newMessageRef = push(ref(database, `messages/${selectedChat}`))

      // Important: Don't include text for image messages to avoid confusion
      const messageData = {
        text: file.type.startsWith("image/") ? "" : `Файл илгээсэн: ${file.name}`,
        fileUrl: fileUrl,
        fileName: file.name,
        fileType: file.type,
        sender: "admin",
        senderName: "Админ",
        timestamp: Date.now(),
        isAdmin: true,
      }

      await set(newMessageRef, messageData)

      // Update last message
      await update(ref(database, `conversations/${selectedChat}`), {
        lastMessage: `Файл илгээсэн: ${file.name}`,
        lastMessageTime: Date.now(),
      })

      // Mark as unread for the user
      const conversation = conversations.find((c) => c.id === selectedChat)
      if (conversation && conversation.participants) {
        const userId = conversation.participants.find((p: string) => p !== "admin")
        if (userId) {
          await update(ref(database, `conversations/${selectedChat}/unread`), {
            [userId]: true,
          })
        }
      }

      toast({
        title: "Амжилттай",
        description: "Файл илгээгдлээ",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Файл илгээхэд алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setImagePreview(null)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  // Delete chat function
  const handleDeleteChat = async () => {
    if (!selectedChat) return

    try {
      // Get the conversation to find the user ID
      const conversation = conversations.find((c) => c.id === selectedChat)
      if (!conversation) {
        toast({
          title: "Алдаа гарлаа",
          description: "Чат олдсонгүй",
          variant: "destructive",
        })
        return
      }

      const userId = conversation.participants.find((p: string) => p !== "admin")

      // Delete messages
      await remove(ref(database, `messages/${selectedChat}`))

      // Delete conversation
      await remove(ref(database, `conversations/${selectedChat}`))

      // Delete from user's chats
      if (userId) {
        await remove(ref(database, `userChats/${userId}/${selectedChat}`))
      }

      // Delete from admin's chats
      await remove(ref(database, `adminChats/${selectedChat}`))

      toast({
        title: "Амжилттай",
        description: "Чат устгагдлаа",
      })

      // Reset selected chat
      setSelectedChat(null)
      setMessages([])
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Чат устгахад алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  // Ban user function
  const handleBanUser = async () => {
    if (!selectedChat) return

    try {
      // Get the conversation to find the user ID
      const conversation = conversations.find((c) => c.id === selectedChat)
      if (!conversation) {
        toast({
          title: "Алдаа гарлаа",
          description: "Чат олдсонгүй",
          variant: "destructive",
        })
        return
      }

      const userId = conversation.participants.find((p: string) => p !== "admin")
      if (!userId) {
        toast({
          title: "Алдаа гарлаа",
          description: "Хэрэглэгч олдсонгүй",
          variant: "destructive",
        })
        return
      }

      // Check if user is already banned
      const isBanned = bannedUsers[userId]

      if (isBanned) {
        // Unban user
        await update(ref(database, "bannedUsers"), {
          [userId]: null,
        })

        toast({
          title: "Амжилттай",
          description: "Хэрэглэгчийн бан цуцлагдлаа",
        })
      } else {
        // Ban user
        await update(ref(database, "bannedUsers"), {
          [userId]: true,
        })

        // Send notification message
        const newMessageRef = push(ref(database, `messages/${selectedChat}`))
        await set(newMessageRef, {
          text: "Таны чат хаагдсан байна. Та дахин мессеж илгээх боломжгүй.",
          sender: "admin",
          senderName: "Админ",
          timestamp: Date.now(),
          isAdmin: true,
          isSystemMessage: true,
        })

        toast({
          title: "Амжилттай",
          description: "Хэрэглэгч амжилттай бан хийгдлээ",
        })
      }
    } catch (error) {
      console.error("Error banning user:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Хэрэглэгчийг бан хийхэд алдаа гарлаа",
        variant: "destructive",
      })
    } finally {
      setBanDialogOpen(false)
    }
  }

  // Debug function to check if messages exist
  const debugCheckMessages = async () => {
    if (!selectedChat) return

    try {
      const messagesRef = ref(database, `messages/${selectedChat}`)
      const snapshot = await get(messagesRef)

      if (snapshot.exists()) {
        console.log("Messages data:", snapshot.val())
        const messagesData = snapshot.val()

        // Check for image messages
        const imageMessages = Object.values(messagesData).filter(
          (msg: any) => msg.fileUrl && msg.fileType && msg.fileType.startsWith("image/"),
        )

        console.log("Image messages:", imageMessages)

        toast({
          title: "Мессежүүд олдлоо",
          description: `${Object.keys(messagesData).length} мессеж байна, үүнээс ${imageMessages.length} зураг байна`,
        })
      } else {
        console.log("No messages found in database")
        toast({
          title: "Мессеж олдсонгүй",
          description: "Энэ чатад мессеж байхгүй байна",
        })
      }
    } catch (error) {
      console.error("Error checking messages:", error)
    }
  }

  // Check if user is banned
  const isUserBanned = (conversation: any) => {
    if (!conversation || !conversation.participants) return false

    const userId = conversation.participants.find((p: string) => p !== "admin")
    return userId ? bannedUsers[userId] : false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const unreadChats = conversations.filter((chat) => chat.unread)
  const selectedConversation = conversations.find((c) => c.id === selectedChat)
  const currentUserBanned = selectedConversation ? isUserBanned(selectedConversation) : false

  return (
    <>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage || "/placeholder.svg"} alt="Зураг" onClose={() => setLightboxImage(null)} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Чат устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та энэ чатыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive text-destructive-foreground">
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentUserBanned ? "Хэрэглэгчийн бан цуцлах" : "Хэрэглэгчийг бан хийх"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentUserBanned
                ? "Та энэ хэрэглэгчийн бан цуцлахдаа итгэлтэй байна уу? Хэрэглэгч дахин чатлах боломжтой болно."
                : "Та энэ хэрэглэгчийг бан хийхдээ итгэлтэй байна уу? Хэрэглэгч цаашид чатлах боломжгүй болно."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className={currentUserBanned ? "bg-primary" : "bg-destructive text-destructive-foreground"}
            >
              {currentUserBanned ? "Бан цуцлах" : "Бан хийх"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Чат удирдлага</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Бүх чат ({conversations.length})</TabsTrigger>
            <TabsTrigger value="unread">Уншаагүй ({unreadChats.length})</TabsTrigger>
            <TabsTrigger value="archived">Архивласан (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Чатын жагсаалт</CardTitle>
                    <CardDescription>Нийт {conversations.length} чат</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {conversations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Чат олдсонгүй</div>
                    ) : (
                      <div className="divide-y max-h-[600px] overflow-y-auto">
                        {conversations.map((chat) => (
                          <div
                            key={chat.id}
                            className={`p-4 cursor-pointer hover:bg-gray-100 ${
                              selectedChat === chat.id ? "bg-gray-100" : ""
                            } ${chat.unread ? "font-semibold" : ""}`}
                            onClick={() => setSelectedChat(chat.id)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium flex items-center">
                                {chat.participantNames?.filter((name: string) => name !== "Админ").join(", ") ||
                                  "Хэрэглэгч"}
                                {chat.unread && (
                                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    Шинэ
                                  </span>
                                )}
                                {isUserBanned(chat) && (
                                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    Бан
                                  </span>
                                )}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(chat.lastMessageTime || Date.now()).toLocaleString("mn-MN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 truncate mt-1">
                              {chat.lastMessage || "Мессеж байхгүй"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span>
                          {selectedChat
                            ? conversations
                                .find((c) => c.id === selectedChat)
                                ?.participantNames?.filter((name: string) => name !== "Админ")
                                .join(", ") || "Чатын дэлгэрэнгүй"
                            : "Чатын дэлгэрэнгүй"}
                        </span>
                        {currentUserBanned && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Ban className="h-3 w-3 mr-1" /> Бан хийгдсэн
                          </span>
                        )}
                      </div>
                      {selectedChat && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBanDialogOpen(true)}
                            className={`text-xs ${currentUserBanned ? "text-green-600" : "text-red-600"}`}
                          >
                            {currentUserBanned ? "Бан цуцлах" : "Бан хийх"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-xs text-red-600"
                          >
                            Устгах
                          </Button>
                          <Button variant="outline" size="sm" onClick={debugCheckMessages} className="text-xs">
                            Шалгах
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedChat ? "Чатын түүх" : "Чат сонгоно уу"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0">
                    {!selectedChat ? (
                      <div className="text-center text-gray-500 py-12 flex-1">Чат сонгоно уу</div>
                    ) : loadingMessages ? (
                      <div className="flex items-center justify-center py-12 flex-1">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        <span>Мессежүүдийг ачааллаж байна...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-12 flex-1">
                        <p>Мессеж олдсонгүй</p>
                        <p className="text-sm mt-2">Чатын ID: {selectedChat}</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 flex-1 overflow-y-auto max-h-[500px]">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.isSystemMessage
                                ? "bg-yellow-100 mx-auto max-w-[90%] text-center"
                                : message.isAdmin
                                  ? "bg-blue-100 ml-auto mr-2 max-w-[80%]"
                                  : "bg-gray-100 mr-auto ml-2 max-w-[80%]"
                            }`}
                          >
                            {!message.isSystemMessage && (
                              <div className="font-medium text-sm">
                                {message.senderName || "Хэрэглэгч"}
                                <span className="text-xs text-gray-500 ml-2">
                                  {new Date(message.timestamp || Date.now()).toLocaleString("mn-MN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}

                            {/* System message */}
                            {message.isSystemMessage && (
                              <div className="flex items-center justify-center text-amber-800">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                <span>{message.text}</span>
                              </div>
                            )}

                            {/* Only show text if it's not empty and not a system message */}
                            {message.text && !message.isSystemMessage && <div className="mt-1">{message.text}</div>}

                            {/* Image message */}
                            {message.fileUrl && message.fileType?.startsWith("image/") && (
                              <div className="mt-2">
                                <div
                                  className="cursor-pointer"
                                  onClick={() => {
                                    console.log("Opening image in lightbox:", message.fileUrl)
                                    setLightboxImage(message.fileUrl)
                                  }}
                                >
                                  <img
                                    src={message.fileUrl || "/placeholder.svg"}
                                    alt={message.fileName || "Зураг"}
                                    className="max-w-full rounded-md object-cover hover:opacity-90 transition-opacity"
                                    style={{ maxHeight: "200px" }}
                                    onError={(e) => {
                                      console.error("Image failed to load:", message.fileUrl)
                                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                    }}
                                  />
                                  <div className="text-xs mt-1">Зураг илгээсэн байна (Томруулахын тулд дарна уу)</div>
                                </div>
                              </div>
                            )}

                            {/* File message (non-image) */}
                            {message.fileUrl && !message.fileType?.startsWith("image/") && (
                              <div className="mt-2">
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 underline flex items-center gap-1"
                                >
                                  <PaperclipIcon className="h-4 w-4" />
                                  {message.fileName}
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}

                    {imagePreview && selectedChat && (
                      <div className="p-3 border-t">
                        <div className="relative">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Image preview"
                            className="max-w-full rounded-md object-cover mx-auto"
                            style={{ maxHeight: "150px" }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setImagePreview(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="text-xs text-center mt-1 text-gray-500">Зураг илгээхэд бэлэн байна</div>
                        </div>
                      </div>
                    )}

                    {selectedChat && (
                      <div className="p-3 border-t mt-auto flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={isUploading ? "opacity-50" : ""}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <PaperclipIcon className="h-4 w-4" />
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />
                        <Input
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Мессеж бичих..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          size="icon"
                          disabled={(!messageText.trim() && !isUploading) || currentUserBanned}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unread">
            <Card>
              <CardHeader>
                <CardTitle>Уншаагүй чатууд</CardTitle>
                <CardDescription>Уншаагүй чатуудын жагсаалт ({unreadChats.length})</CardDescription>
              </CardHeader>
              <CardContent>
                {unreadChats.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">Уншаагүй чат олдсонгүй</div>
                ) : (
                  <div className="divide-y">
                    {unreadChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="p-4 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSelectedChat(chat.id)
                          document.querySelector('[data-value="all"]')?.click()
                        }}
                      >
                        <div className="font-medium flex items-center">
                          {chat.participantNames?.filter((name: string) => name !== "Админ").join(", ") || "Хэрэглэгч"}
                          <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Шинэ</span>
                          {isUserBanned(chat) && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Бан</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(chat.lastMessageTime || Date.now()).toLocaleString("mn-MN")}
                        </div>
                        <div className="text-sm truncate">{chat.lastMessage || "Мессеж байхгүй"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archived">
            <Card>
              <CardHeader>
                <CardTitle>Архивласан чатууд</CardTitle>
                <CardDescription>Архивласан чатуудын жагсаалт</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-12">Архивласан чат олдсонгүй</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
