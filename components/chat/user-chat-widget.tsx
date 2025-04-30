"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, PaperclipIcon, Send, MoreVertical, Trash2, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageLightbox } from "./image-lightbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
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

export function UserChatWidget() {
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const { user } = useAuth()
  const {
    chats,
    messages,
    unreadCount,
    activeChatId,
    setActiveChatId,
    sendMessage,
    deleteMessage,
    markChatAsRead,
    loadingChats,
    loadingMessages,
    currentRecipientId,
    setCurrentRecipientId,
    isChatWidgetVisible,
    setChatWidgetVisible,
  } = useChat()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState<any>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isChatWidgetVisible) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isChatWidgetVisible])

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
    if ((!message.trim() && !imagePreview) || isUploading || !currentRecipientId) return

    try {
      await sendMessage(currentRecipientId, message)
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
    if (!event.target.files || !event.target.files[0] || !currentRecipientId) return

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
    const chat = chats.find((c) => c.id === chatId)
    setSelectedChat(chat)
  }

  const handleDrag = (e: React.DragEvent, ui: { deltaX: number; deltaY: number }) => {
    setPosition({
      x: position.x + ui.deltaX,
      y: position.y + ui.deltaY,
    })
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
      return "Өнөөдөр"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Өчигдөр"
    } else {
      return date.toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" })
    }
  }

  if (!user) return null

  return (
    <>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage || "/placeholder.svg"} alt="Зураг" onClose={() => setLightboxImage(null)} />
      )}

      <motion.div
        drag={!isChatWidgetVisible}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        onDrag={handleDrag}
        className="fixed z-50"
        style={{
          bottom: `${position.y}px`,
          right: `${position.x}px`,
        }}
      >
        {isChatWidgetVisible ? (
          <Card className="w-80 sm:w-96 shadow-lg flex flex-col h-96">
            <div className="flex items-center justify-between bg-primary text-primary-foreground p-3">
              <h3 className="font-medium">{!selectedChat ? "Чатууд" : selectedChat.participantName}</h3>
              <div className="flex items-center">
                {selectedChat && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-primary-foreground hover:text-primary-foreground"
                    onClick={() => {
                      setSelectedChat(null)
                      setActiveChatId(null)
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-primary-foreground hover:text-primary-foreground"
                  onClick={() => setChatWidgetVisible(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {!selectedChat ? (
              // Chat list view
              <ScrollArea className="flex-1">
                {loadingChats ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <p className="text-sm text-muted-foreground">Чат байхгүй байна.</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={cn(
                          "p-3 rounded-md hover:bg-secondary/50 cursor-pointer border",
                          activeChatId === chat.id ? "bg-secondary" : "",
                          chat.unreadCount > 0 ? "border-primary" : "border-border",
                        )}
                        onClick={() => handleChatSelect(chat.id, chat.participantId)}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={chat.photoURL || undefined} alt={chat.participantName} />
                            <AvatarFallback>{chat.participantName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className="font-medium truncate">{chat.participantName}</p>
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {formatDate(chat.lastMessageTime)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                              {chat.unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : (
              // Chat message view
              <>
                <ScrollArea className="flex-1 p-3 bg-secondary/20">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                      <span className="text-muted-foreground">Ачааллаж байна...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Чатлах хэсэг. Ямар нэг асуулт байвал энд бичнэ үү.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === user.uid ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 ${
                              msg.sender === user.uid ? "bg-primary text-primary-foreground" : "bg-secondary"
                            } relative group`}
                          >
                            <div className="text-xs opacity-70 mb-1 flex justify-between">
                              <span>
                                {msg.sender === user.uid ? "Та" : msg.senderName} • {formatTime(msg.timestamp)}
                              </span>

                              {/* Message actions dropdown - only for user's own messages */}
                              {msg.sender === user.uid && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            </div>

                            {/* Only show text if it's not empty */}
                            {msg.text && <div>{msg.text}</div>}

                            {/* Image message */}
                            {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                              <div className="mt-2">
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
                                  <div className="text-xs mt-1">Зураг илгээсэн байна (Томруулахын тулд дарна уу)</div>
                                </div>
                              </div>
                            )}

                            {/* File message (non-image) */}
                            {msg.fileUrl && !msg.fileType?.startsWith("image/") && (
                              <div className="mt-2">
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
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {imagePreview && (
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
                      <div className="text-xs text-center mt-1 text-muted-foreground">Зураг илгээхэд бэлэн байна</div>
                    </div>
                  </div>
                )}

                {/* Message input area */}
                <div className="p-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={isUploading ? "opacity-50" : ""}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !currentRecipientId}
                  >
                    <PaperclipIcon className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading || !currentRecipientId}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={!currentRecipientId ? "Чат сонгоогүй байна" : "Мессеж бичих..."}
                    className="resize-none min-h-10 h-10"
                    disabled={!currentRecipientId}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={(!message.trim() && !imagePreview) || isUploading || !currentRecipientId}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg"
            onClick={() => !isDragging && setChatWidgetVisible(true)}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        )}
      </motion.div>

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

export default UserChatWidget
