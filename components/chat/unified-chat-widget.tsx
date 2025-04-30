"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  X,
  PaperclipIcon,
  Send,
  MessageCircle,
  ArrowLeft,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Search,
  Smile,
  ImageIcon,
  ThumbsUp,
  Trash,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ImageLightbox } from "./image-lightbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useChat } from "@/contexts/chat-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

export function UnifiedChatWidget() {
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, userData } = useAuth()
  const {
    // User-to-user chat
    unreadCount,
    activeChatId,
    setActiveChatId,
    isChatWidgetVisible,
    setChatWidgetVisible,
    chats,
    messages,
    sendMessage,
    deleteMessage,
    markChatAsRead,
    loadingChats,
    loadingMessages,
    currentRecipientId,
    setCurrentRecipientId,
    removeChat,

    // Admin chat
    isAdminChatVisible,
    setAdminChatVisible,
    adminMessages,
    sendAdminMessage,
    adminUnreadCount,
    loadingAdminChat,
  } = useChat()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Filter chats based on search query
  const filteredChats = chats.filter(
    (chat) =>
      chat.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isChatWidgetVisible) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, adminMessages, isChatWidgetVisible])

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (activeChatId && isChatWidgetVisible) {
      markChatAsRead(activeChatId)
    }
  }, [activeChatId, isChatWidgetVisible, markChatAsRead])

  // Update selected chat when active chat changes
  useEffect(() => {
    if (activeChatId) {
      const chat = chats.find((c) => c.id === activeChatId)
      setSelectedChat(chat)
    } else {
      setSelectedChat(null)
    }
  }, [activeChatId, chats])

  const handleSendMessage = async () => {
    if (!message.trim() && !isUploading) return

    if (currentRecipientId) {
      try {
        await sendMessage(currentRecipientId, message.trim())
        setMessage("")
      } catch (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Алдаа гарлаа",
          description: "Мессеж илгээхэд алдаа гарлаа",
          variant: "destructive",
        })
      }
    } else if (isAdminChatVisible) {
      if (!user || isBanned) return

      try {
        await sendAdminMessage(message.trim())
        setMessage("")
      } catch (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Алдаа гарлаа",
          description: "Мессеж илгээхэд алдаа гарлаа",
          variant: "destructive",
        })
      }
    }
  }

  const handleSendThumbsUp = async () => {
    if (currentRecipientId) {
      try {
        await sendMessage(currentRecipientId, "👍")
      } catch (error) {
        console.error("Error sending thumbs up:", error)
      }
    } else if (isAdminChatVisible) {
      if (!user || isBanned) return
      try {
        await sendAdminMessage("👍")
      } catch (error) {
        console.error("Error sending thumbs up:", error)
      }
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    setMessageToDelete(messageId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return

    try {
      await deleteMessage(messageToDelete)
      setMessageToDelete(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting message:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Мессеж устгахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return

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
      if (currentRecipientId) {
        // Upload file to Firebase Storage
        const fileRef = storageRef(storage, `chat-files/user-chats/${Date.now()}-${file.name}`)
        await uploadBytes(fileRef, file)
        const fileUrl = await getDownloadURL(fileRef)

        // Send message with file
        await sendMessage(
          currentRecipientId,
          file.type.startsWith("image/") ? "" : `Файл илгээсэн: ${file.name}`,
          fileUrl,
          file.name,
          file.type,
        )
      } else if (isAdminChatVisible) {
        if (!user || isBanned) return

        // Upload file to Firebase Storage
        const fileRef = storageRef(storage, `chat-files/admin-chat/${Date.now()}-${file.name}`)
        await uploadBytes(fileRef, file)
        const fileUrl = await getDownloadURL(fileRef)

        // Send message with file
        await sendAdminMessage(
          file.type.startsWith("image/") ? "" : `Файл илгээсэн: ${file.name}`,
          fileUrl,
          file.name,
          file.type,
        )
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

  const handleChatSelect = (chatId: string, recipientId: string) => {
    setActiveChatId(chatId)
    setCurrentRecipientId(recipientId)
    setAdminChatVisible(false)
  }

  const handleAdminChatSelect = () => {
    setActiveChatId(null)
    setCurrentRecipientId(null)
    setAdminChatVisible(true)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return formatTime(timestamp)
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Өчигдөр"
    } else {
      return date.toLocaleDateString("mn-MN", { month: "2-digit", day: "2-digit" })
    }
  }

  const handleCloseChat = () => {
    setChatWidgetVisible(false)
    setSelectedChat(null)
    setActiveChatId(null)
    setAdminChatVisible(false)
  }

  const getActiveMessages = () => {
    if (isAdminChatVisible) {
      return adminMessages
    } else if (activeChatId) {
      return messages
    }
    return []
  }

  const getActiveTitle = () => {
    if (isAdminChatVisible) {
      return "Админтай холбогдох"
    } else if (selectedChat) {
      return selectedChat.participantName
    }
    return "Чатууд"
  }

  const isActiveChat = activeChatId || isAdminChatVisible

  const handleRemoveChat = async () => {
    if (!activeChatId) return

    try {
      await removeChat(activeChatId)
      setActiveChatId(null)
      setCurrentRecipientId(null)
      toast({
        title: "Амжилттай",
        description: "Чат устгагдлаа",
      })
    } catch (error) {
      console.error("Error removing chat:", error)
      toast({
        title: "Алдаа гарлаа",
        description: "Чат устгахад алдаа гарлаа",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage || "/placeholder.svg"} alt="Зураг" onClose={() => setLightboxImage(null)} />
      )}

      {/* Fixed button to open chat */}
      {!isChatWidgetVisible && (
        <div className="fixed z-50 bottom-4 right-4 flex flex-col space-y-2">
          <Button
            size="lg"
            className="rounded-full shadow-lg h-14 w-14 flex items-center justify-center"
            onClick={() => setChatWidgetVisible(true)}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount + adminUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount + adminUnreadCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Chat widget - Facebook Messenger style */}
      {isChatWidgetVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <Card className="w-full max-w-5xl h-[80vh] flex flex-col shadow-xl">
            <div className="flex h-full">
              {/* Left sidebar - Chat list */}
              <div className={`w-80 border-r flex flex-col ${isActiveChat ? "hidden md:flex" : "flex"}`}>
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Чатууд</h3>
                  <Button variant="ghost" size="sm" className="rounded-full" onClick={handleCloseChat}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Search */}
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Хайх..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Chat list */}
                <ScrollArea className="flex-1">
                  {loadingChats ? (
                    <div className="flex items-center justify-center h-full p-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="p-1">
                      {/* Admin chat option */}
                      <div
                        className={cn(
                          "p-2 rounded-lg hover:bg-secondary/50 cursor-pointer",
                          isAdminChatVisible ? "bg-secondary" : "",
                        )}
                        onClick={handleAdminChatSelect}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 border">
                            <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-medium truncate">Админ</p>
                              {adminUnreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                                  {adminUnreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {adminMessages.length > 0
                                ? adminMessages[adminMessages.length - 1].text || "Файл илгээсэн"
                                : "Админтай холбогдох"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User chats */}
                      {filteredChats.length === 0 && searchQuery ? (
                        <div className="p-4 text-center text-muted-foreground">Хайлтад тохирох чат олдсонгүй</div>
                      ) : filteredChats.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">Чат байхгүй байна</div>
                      ) : (
                        filteredChats.map((chat) => (
                          <div
                            key={chat.id}
                            className={cn(
                              "p-2 rounded-lg hover:bg-secondary/50 cursor-pointer",
                              activeChatId === chat.id ? "bg-secondary" : "",
                            )}
                            onClick={() => handleChatSelect(chat.id, chat.participantId)}
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage src={chat.photoURL || undefined} alt={chat.participantName} />
                                <AvatarFallback>{chat.participantName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline">
                                  <p
                                    className={cn("font-medium truncate", chat.unreadCount > 0 ? "font-semibold" : "")}
                                  >
                                    {chat.participantName}
                                  </p>
                                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                    {formatDate(chat.lastMessageTime)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p
                                    className={cn(
                                      "text-sm truncate",
                                      chat.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground",
                                    )}
                                  >
                                    {chat.lastMessage}
                                  </p>
                                  {chat.unreadCount > 0 && (
                                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                                      {chat.unreadCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right side - Chat area */}
              <div className={`flex-1 flex flex-col ${isActiveChat ? "flex" : "hidden md:flex"}`}>
                {/* Chat header */}
                <div className="p-3 border-b flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full md:hidden"
                      onClick={() => {
                        setActiveChatId(null)
                        setAdminChatVisible(false)
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>

                    {isActiveChat && (
                      <>
                        <Avatar className="h-9 w-9">
                          {isAdminChatVisible ? (
                            <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage
                                src={selectedChat?.photoURL || undefined}
                                alt={selectedChat?.participantName}
                              />
                              <AvatarFallback>{selectedChat?.participantName?.charAt(0)}</AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{getActiveTitle()}</h3>
                          <p className="text-xs text-muted-foreground">
                            {isAdminChatVisible ? "Онлайн" : "Сүүлд онлайн байсан: Өнөөдөр"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isActiveChat && !isAdminChatVisible && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-destructive hover:bg-destructive/10"
                        onClick={handleRemoveChat}
                      >
                        <Trash className="h-5 w-5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={handleCloseChat}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Chat messages */}
                {isActiveChat ? (
                  <>
                    <ScrollArea className="flex-1 p-4 bg-secondary/10">
                      {(isAdminChatVisible && loadingAdminChat) || (!isAdminChatVisible && loadingMessages) ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                          <span className="text-muted-foreground">Ачааллаж байна...</span>
                        </div>
                      ) : getActiveMessages().length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">Чатлах хэсэг</p>
                          <p className="text-xs text-muted-foreground mt-2">Ямар нэг асуулт байвал энд бичнэ үү.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getActiveMessages().map((msg) => {
                            const isOwnMessage = isAdminChatVisible ? !msg.isAdmin : msg.sender === user.uid

                            return (
                              <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                {!isOwnMessage && (
                                  <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                                    {isAdminChatVisible ? (
                                      <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
                                    ) : (
                                      <>
                                        <AvatarImage
                                          src={selectedChat?.photoURL || undefined}
                                          alt={selectedChat?.participantName}
                                        />
                                        <AvatarFallback>{selectedChat?.participantName?.charAt(0)}</AvatarFallback>
                                      </>
                                    )}
                                  </Avatar>
                                )}

                                <div
                                  className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-2 relative group",
                                    isOwnMessage
                                      ? "bg-primary text-primary-foreground rounded-tr-none"
                                      : "bg-secondary rounded-tl-none",
                                  )}
                                >
                                  {/* Message content */}
                                  {msg.text && <div className="break-words">{msg.text}</div>}

                                  {/* Image message */}
                                  {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                                    <div className="mt-1">
                                      <div className="cursor-pointer" onClick={() => setLightboxImage(msg.fileUrl)}>
                                        <img
                                          src={msg.fileUrl || "/placeholder.svg"}
                                          alt={msg.fileName || "Зураг"}
                                          className="max-w-full rounded-md object-cover hover:opacity-90 transition-opacity"
                                          style={{ maxHeight: "200px" }}
                                          onError={(e) => {
                                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* File message (non-image) */}
                                  {msg.fileUrl && !msg.fileType?.startsWith("image/") && (
                                    <div className="mt-1">
                                      <a
                                        href={msg.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline flex items-center gap-1"
                                      >
                                        <PaperclipIcon className="h-4 w-4" />
                                        {msg.fileName}
                                      </a>
                                    </div>
                                  )}

                                  {/* Message actions */}
                                  {isOwnMessage && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 absolute -right-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() => handleDeleteMessage(msg.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Устгах
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}

                                  {/* Time */}
                                  <div className="text-[10px] opacity-70 mt-1 text-right">
                                    {formatTime(msg.timestamp)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    {/* Message input */}
                    <div className="p-3 border-t flex flex-col gap-2 bg-card">
                      {imagePreview && (
                        <div className="relative p-2 bg-secondary/20 rounded-md">
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
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading || (isAdminChatVisible && isBanned)}
                        >
                          <ImageIcon className="h-5 w-5 text-primary" />
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={isUploading || (isAdminChatVisible && isBanned)}
                          accept="image/*,.pdf,.doc,.docx,.txt"
                        />

                        <div className="flex-1 flex items-center bg-secondary rounded-full px-4 py-1">
                          <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={isAdminChatVisible && isBanned ? "Чат хаагдсан байна" : "Мессеж бичих..."}
                            className="resize-none min-h-9 h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0"
                            disabled={isAdminChatVisible && isBanned}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full p-0 h-8 w-8"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          >
                            <Smile className="h-5 w-5 text-primary" />
                          </Button>
                        </div>

                        {message.trim() ? (
                          <Button
                            onClick={handleSendMessage}
                            size="icon"
                            className="rounded-full"
                            disabled={isAdminChatVisible && isBanned}
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSendThumbsUp}
                            size="icon"
                            className="rounded-full"
                            disabled={isAdminChatVisible && isBanned}
                          >
                            <ThumbsUp className="h-5 w-5" />
                          </Button>
                        )}
                      </div>

                      {isAdminChatVisible && isBanned && (
                        <div className="bg-red-100 p-3 rounded-lg text-center mt-2">
                          <div className="flex items-center justify-center text-red-600 mb-2">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <span className="font-medium">Таны чат хаагдсан байна</span>
                          </div>
                          <p className="text-sm text-red-600">
                            Та дахин мессеж илгээх боломжгүй. Асуудал үүссэн бол админтай холбогдоно уу.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-secondary/10">
                    <div className="text-center p-4">
                      <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-xl font-medium mb-2">Чат сонгоогүй байна</h3>
                      <p className="text-muted-foreground">Чатлахын тулд зүүн талаас хэрэглэгч сонгоно уу</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete message confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Мессеж устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та энэ мессежийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMessage} className="bg-destructive text-destructive-foreground">
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default UnifiedChatWidget
