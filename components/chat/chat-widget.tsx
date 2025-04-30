"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageSquare, X, PaperclipIcon, Send, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { storage } from "@/lib/firebase"
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { ImageLightbox } from "./image-lightbox"
import { useChat } from "@/contexts/chat-context"

export function ChatWidget() {
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [message, setMessage] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const { user, userData } = useAuth()
  const {
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
  const [isBanned, setIsBanned] = useState(false)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isAdminChatVisible) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [adminMessages, isAdminChatVisible])

  const handleSendMessage = async () => {
    if (!message.trim() && !isUploading) return
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user || isBanned) return

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

  if (!user) return null

  return (
    <>
      {lightboxImage && (
        <ImageLightbox src={lightboxImage || "/placeholder.svg"} alt="Зураг" onClose={() => setLightboxImage(null)} />
      )}

      <motion.div
        drag={!isAdminChatVisible}
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
        {isAdminChatVisible ? (
          <Card className="w-80 sm:w-96 shadow-lg flex flex-col h-96">
            <div className="flex items-center justify-between bg-primary text-primary-foreground p-3">
              <h3 className="font-medium">Админтай холбогдох</h3>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-primary-foreground hover:text-primary-foreground"
                  onClick={() => setAdminChatVisible(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 space-y-3">
              {loadingAdminChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  <span className="text-gray-500">Ачааллаж байна...</span>
                </div>
              ) : adminMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Чатлах хэсэг. Ямар нэг асуулт байвал энд бичнэ үү.
                </div>
              ) : (
                adminMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.isSystemMessage
                          ? "bg-yellow-100 mx-auto text-center"
                          : msg.isAdmin
                            ? "bg-gray-200 dark:bg-gray-800"
                            : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {msg.senderName || "Хэрэглэгч"} • {formatTime(msg.timestamp)}
                      </div>

                      {/* System message */}
                      {msg.isSystemMessage && (
                        <div className="flex items-center justify-center text-amber-800">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span>{msg.text}</span>
                        </div>
                      )}

                      {/* Only show text if it's not empty and not a system message */}
                      {msg.text && !msg.isSystemMessage && <div>{msg.text}</div>}

                      {/* Image message */}
                      {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                        <div className="mt-2">
                          <div
                            className="cursor-pointer"
                            onClick={() => {
                              setLightboxImage(msg.fileUrl)
                            }}
                          >
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
                ))
              )}
              {isBanned && (
                <div className="bg-red-100 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center text-red-600 mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Таны чат хаагдсан байна</span>
                  </div>
                  <p className="text-sm text-red-600">
                    Та дахин мессеж илгээх боломжгүй. Асуудал үүссэн бол админтай холбогдоно уу.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
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
                  <div className="text-xs text-center mt-1 text-gray-500">Зураг илгээхэд бэлэн байна</div>
                </div>
              </div>
            )}
            <div className="p-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className={isUploading ? "opacity-50" : ""}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isBanned}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading || isBanned}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isBanned ? "Чат хаагдсан байна" : "Мессеж бичих..."}
                className="resize-none min-h-10 h-10"
                disabled={isBanned}
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
                disabled={(!message.trim() && !isUploading) || !user || isBanned}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg"
            onClick={() => !isDragging && setAdminChatVisible(true)}
          >
            <MessageSquare className="h-6 w-6" />
            {adminUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {adminUnreadCount}
              </span>
            )}
          </Button>
        )}
      </motion.div>
    </>
  )
}
