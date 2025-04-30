"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import { database } from "@/lib/firebase"
import { ref, onValue, get, set, push, remove, update } from "firebase/database"
import { toast } from "@/components/ui/use-toast"

type Message = {
  id: string
  text: string
  sender: string
  senderName: string
  timestamp: number
  isAdmin?: boolean
  fileUrl?: string
  fileName?: string
  fileType?: string
  isRead?: boolean
}

type Chat = {
  id: string
  participantId: string
  participantName: string
  lastMessage: string
  lastMessageTime: number
  unreadCount: number
  photoURL?: string
}

type ChatContextType = {
  // User-to-user chat
  unreadCount: number
  activeChatId: string | null
  setActiveChatId: (id: string | null) => void
  isChatWidgetVisible: boolean
  setChatWidgetVisible: (visible: boolean) => void
  chats: Chat[]
  messages: Message[]
  sendMessage: (
    recipientId: string,
    text: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  markChatAsRead: (chatId: string) => Promise<void>
  startNewChat: (recipientId: string, recipientName: string) => Promise<string>
  loadingChats: boolean
  loadingMessages: boolean
  currentRecipientId: string | null
  setCurrentRecipientId: (id: string | null) => void
  removeChat: (chatId: string) => Promise<void>

  // Admin chat
  isAdminChatVisible: boolean
  setAdminChatVisible: (visible: boolean) => void
  adminChatId: string | null
  adminMessages: Message[]
  sendAdminMessage: (text: string, fileUrl?: string, fileName?: string, fileType?: string) => Promise<void>
  deleteAdminMessage: (messageId: string) => Promise<void>
  adminUnreadCount: number
  loadingAdminChat: boolean
}

const ChatContext = createContext<ChatContextType>({
  unreadCount: 0,
  activeChatId: null,
  setActiveChatId: () => {},
  isChatWidgetVisible: false,
  setChatWidgetVisible: () => {},
  chats: [],
  messages: [],
  sendMessage: async () => {},
  deleteMessage: async () => {},
  markChatAsRead: async () => {},
  startNewChat: async () => "",
  loadingChats: false,
  loadingMessages: false,
  currentRecipientId: null,
  setCurrentRecipientId: () => {},
  removeChat: async () => {},

  // Admin chat
  isAdminChatVisible: false,
  setAdminChatVisible: () => {},
  adminChatId: null,
  adminMessages: [],
  sendAdminMessage: async () => {},
  deleteAdminMessage: async () => {},
  adminUnreadCount: 0,
  loadingAdminChat: false,
})

export const useChat = () => useContext(ChatContext)

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // User-to-user chat state
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isChatWidgetVisible, setChatWidgetVisible] = useState(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [currentRecipientId, setCurrentRecipientId] = useState<string | null>(null)

  // Admin chat state
  const [isAdminChatVisible, setAdminChatVisible] = useState(false)
  const [adminChatId, setAdminChatId] = useState<string | null>(null)
  const [adminMessages, setAdminMessages] = useState<Message[]>([])
  const [adminUnreadCount, setAdminUnreadCount] = useState(0)
  const [loadingAdminChat, setLoadingAdminChat] = useState(false)

  const { user, userData } = useAuth()

  // Load user's chats
  useEffect(() => {
    if (!user) {
      setChats([])
      setUnreadCount(0)
      setLoadingChats(false)
      return
    }

    setLoadingChats(true)
    const userChatsRef = ref(database, `userChats/${user.uid}`)

    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setChats([])
        setUnreadCount(0)
        setLoadingChats(false)
        return
      }

      try {
        const chatIds = Object.keys(snapshot.val())
        const chatsData: Chat[] = []
        let totalUnread = 0

        for (const chatId of chatIds) {
          const chatRef = ref(database, `conversations/${chatId}`)
          const chatSnapshot = await get(chatRef)

          if (chatSnapshot.exists()) {
            const chatData = chatSnapshot.val()

            // Skip admin chats - they will be handled separately
            if (chatData.participants && chatData.participants.includes("admin")) {
              continue
            }

            // Find the other participant (not the current user)
            const otherParticipantId =
              chatData.participants && chatData.participants.find((p: string) => p !== user.uid)

            if (otherParticipantId) {
              // Get participant name and photo
              const participantName =
                chatData.participantNames?.[chatData.participants.indexOf(otherParticipantId)] || "Хэрэглэгч"

              // Get unread count for this chat
              const unreadCount = chatData.unread?.[user.uid] ? 1 : 0
              totalUnread += unreadCount

              // Get user photo if available
              let photoURL = undefined
              const userRef = ref(database, `users/${otherParticipantId}`)
              const userSnapshot = await get(userRef)
              if (userSnapshot.exists()) {
                photoURL = userSnapshot.val().photoURL
              }

              chatsData.push({
                id: chatId,
                participantId: otherParticipantId,
                participantName,
                lastMessage: chatData.lastMessage || "",
                lastMessageTime: chatData.lastMessageTime || 0,
                unreadCount,
                photoURL,
              })
            }
          }
        }

        // Sort chats by last message time (newest first)
        chatsData.sort((a, b) => b.lastMessageTime - a.lastMessageTime)

        setChats(chatsData)
        setUnreadCount(totalUnread)
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setLoadingChats(false)
      }
    })

    return () => unsubscribe()
  }, [user])

  // Load messages for active chat
  useEffect(() => {
    if (!activeChatId || !user) {
      setMessages([])
      return
    }

    setLoadingMessages(true)
    const messagesRef = ref(database, `messages/${activeChatId}`)

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([])
        setLoadingMessages(false)
        return
      }

      const messagesData = snapshot.val()
      const formattedMessages = Object.keys(messagesData)
        .map((key) => ({
          id: key,
          ...messagesData[key],
        }))
        .sort((a, b) => a.timestamp - b.timestamp)

      setMessages(formattedMessages)
      setLoadingMessages(false)
    })

    return () => unsubscribe()
  }, [activeChatId, user])

  // Load admin chat
  useEffect(() => {
    if (!user) {
      setAdminChatId(null)
      setAdminMessages([])
      setAdminUnreadCount(0)
      return
    }

    setLoadingAdminChat(true)

    // Check if user has an admin chat
    const userChatsRef = ref(database, `userChats/${user.uid}`)

    const unsubscribe = onValue(userChatsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setAdminChatId(null)
        setAdminMessages([])
        setLoadingAdminChat(false)
        return
      }

      try {
        const chatIds = Object.keys(snapshot.val())

        for (const chatId of chatIds) {
          const chatRef = ref(database, `conversations/${chatId}`)
          const chatSnapshot = await get(chatRef)

          if (chatSnapshot.exists()) {
            const chatData = chatSnapshot.val()

            // Check if this is an admin chat
            if (chatData.participants && chatData.participants.includes("admin")) {
              setAdminChatId(chatId)

              // Get unread count
              const unreadCount = chatData.unread?.[user.uid] ? 1 : 0
              setAdminUnreadCount(unreadCount)

              // Load messages for this chat
              const messagesRef = ref(database, `messages/${chatId}`)
              onValue(messagesRef, (messageSnapshot) => {
                if (messageSnapshot.exists()) {
                  const messagesData = messageSnapshot.val()
                  const formattedMessages = Object.keys(messagesData)
                    .map((key) => ({
                      id: key,
                      ...messagesData[key],
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp)

                  setAdminMessages(formattedMessages)
                } else {
                  setAdminMessages([])
                }
              })

              break
            }
          }
        }
      } catch (error) {
        console.error("Error loading admin chat:", error)
      } finally {
        setLoadingAdminChat(false)
      }
    })

    return () => unsubscribe()
  }, [user])

  // Send a message to another user
  const sendMessage = async (
    recipientId: string,
    text: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
  ) => {
    if (!user || (!text.trim() && !fileUrl)) return

    try {
      // Find existing chat or create new one
      let chatId = activeChatId

      if (!chatId) {
        // Look for existing chat with this recipient
        for (const chat of chats) {
          if (chat.participantId === recipientId) {
            chatId = chat.id
            setActiveChatId(chatId)
            break
          }
        }
      }

      // If still no chat ID, create a new chat
      if (!chatId) {
        // Get recipient name
        let recipientName = "Хэрэглэгч"
        const recipientRef = ref(database, `users/${recipientId}`)
        const recipientSnapshot = await get(recipientRef)
        if (recipientSnapshot.exists()) {
          recipientName = recipientSnapshot.val().name || recipientSnapshot.val().email || "Хэрэглэгч"
        }

        chatId = await startNewChat(recipientId, recipientName)
      }

      // Add message to the chat
      const newMessageRef = push(ref(database, `messages/${chatId}`))

      const messageData = {
        text: text.trim(),
        sender: user.uid,
        senderName: userData?.name || user.email,
        timestamp: Date.now(),
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileType && { fileType }),
      }

      await set(newMessageRef, messageData)

      // Update last message in conversation
      const updates: Record<string, any> = {
        [`conversations/${chatId}/lastMessage`]: text.trim() || "Файл илгээсэн",
        [`conversations/${chatId}/lastMessageTime`]: Date.now(),
      }

      // Mark as unread for recipient
      updates[`conversations/${chatId}/unread/${recipientId}`] = true

      await update(ref(database), updates)

      return chatId
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!user || !activeChatId) return

    try {
      const messageRef = ref(database, `messages/${activeChatId}/${messageId}`)

      // Check if message exists and belongs to current user
      const messageSnapshot = await get(messageRef)
      if (!messageSnapshot.exists()) {
        throw new Error("Message not found")
      }

      const messageData = messageSnapshot.val()
      if (messageData.sender !== user.uid) {
        throw new Error("You can only delete your own messages")
      }

      // Delete the message
      await remove(messageRef)

      // Update last message in conversation if needed
      const messagesRef = ref(database, `messages/${activeChatId}`)
      const allMessagesSnapshot = await get(messagesRef)

      if (allMessagesSnapshot.exists()) {
        const messagesData = allMessagesSnapshot.val()
        const messagesList = Object.keys(messagesData).map((key) => ({
          id: key,
          ...messagesData[key],
        }))

        // Sort by timestamp (newest first)
        messagesList.sort((a, b) => b.timestamp - a.timestamp)

        if (messagesList.length > 0) {
          // Update last message with the most recent one
          const lastMessage = messagesList[0]
          await set(
            ref(database, `conversations/${activeChatId}/lastMessage`),
            lastMessage.text || (lastMessage.fileUrl ? "Файл илгээсэн" : ""),
          )
          await set(ref(database, `conversations/${activeChatId}/lastMessageTime`), lastMessage.timestamp)
        } else {
          // No messages left, update with default values
          await set(ref(database, `conversations/${activeChatId}/lastMessage`), "Чат эхэлсэн")
          await set(ref(database, `conversations/${activeChatId}/lastMessageTime`), Date.now())
        }
      }

      toast({
        title: "Амжилттай",
        description: "Мессеж устгагдлаа",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  // Send a message to admin
  const sendAdminMessage = async (text: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (!user || (!text.trim() && !fileUrl)) return

    try {
      let chatId = adminChatId

      // If no admin chat exists, create one
      if (!chatId) {
        // Create new chat in database
        const newChatRef = push(ref(database, "conversations"))
        chatId = newChatRef.key

        if (!chatId) throw new Error("Failed to create chat")

        // Set chat data
        await set(newChatRef, {
          createdAt: Date.now(),
          participants: [user.uid, "admin"],
          participantNames: [userData?.name || user.email, "Админ"],
          lastMessage: "Шинэ харилцан яриа",
          lastMessageTime: Date.now(),
          unread: { admin: true },
        })

        // Add reference to user's chats
        await set(ref(database, `userChats/${user.uid}/${chatId}`), true)

        // Add reference to admin's chats
        await set(ref(database, `adminChats/${chatId}`), true)

        setAdminChatId(chatId)
      }

      // Add message to the chat
      const newMessageRef = push(ref(database, `messages/${chatId}`))

      const messageData = {
        text: text.trim(),
        sender: user.uid,
        senderName: userData?.name || user.email,
        timestamp: Date.now(),
        isAdmin: false,
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileType && { fileType }),
      }

      await set(newMessageRef, messageData)

      // Update last message in conversation
      const updates: Record<string, any> = {
        [`conversations/${chatId}/lastMessage`]: text.trim() || "Файл илгээсэн",
        [`conversations/${chatId}/lastMessageTime`]: Date.now(),
        [`conversations/${chatId}/unread/admin`]: true,
      }

      await update(ref(database), updates)

      return chatId
    } catch (error) {
      console.error("Error sending admin message:", error)
      throw error
    }
  }

  // Delete an admin message
  const deleteAdminMessage = async (messageId: string) => {
    if (!user || !adminChatId) return

    try {
      const messageRef = ref(database, `messages/${adminChatId}/${messageId}`)

      // Check if message exists and belongs to current user
      const messageSnapshot = await get(messageRef)
      if (!messageSnapshot.exists()) {
        throw new Error("Message not found")
      }

      const messageData = messageSnapshot.val()
      if (messageData.sender !== user.uid) {
        throw new Error("You can only delete your own messages")
      }

      // Delete the message
      await remove(messageRef)

      toast({
        title: "Амжилттай",
        description: "Мессеж устгагдлаа",
      })
    } catch (error) {
      console.error("Error deleting admin message:", error)
      throw error
    }
  }

  // Start a new chat with a user
  const startNewChat = async (recipientId: string, recipientName: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Create new chat in database
      const newChatRef = push(ref(database, "conversations"))
      const chatId = newChatRef.key

      if (!chatId) throw new Error("Failed to create chat")

      // Set chat data
      await set(newChatRef, {
        createdAt: Date.now(),
        participants: [user.uid, recipientId],
        participantNames: [userData?.name || user.email, recipientName],
        lastMessage: "Шинэ харилцан яриа",
        lastMessageTime: Date.now(),
      })

      // Add reference to user's chats
      await set(ref(database, `userChats/${user.uid}/${chatId}`), true)

      // Add reference to recipient's chats
      await set(ref(database, `userChats/${recipientId}/${chatId}`), true)

      setActiveChatId(chatId)
      return chatId
    } catch (error) {
      console.error("Error creating new chat:", error)
      throw error
    }
  }

  // Mark chat as read
  const markChatAsRead = async (chatId: string) => {
    if (!user) return

    try {
      await set(ref(database, `conversations/${chatId}/unread/${user.uid}`), false)
    } catch (error) {
      console.error("Error marking chat as read:", error)
    }
  }

  const removeChat = async (chatId: string) => {
    if (!user) return

    try {
      // Чатыг Firebase-ээс устгах
      const chatRef = ref(database, `conversations/${chatId}`)
      await remove(chatRef)

      // Чатын мессежүүдийг устгах
      const messagesRef = ref(database, `messages/${chatId}`)
      await remove(messagesRef)

      // User chats-аас устгах
      const userChatsRef = ref(database, `userChats/${user.uid}/${chatId}`)
      await remove(userChatsRef)

      // Локал state-ээс устгах
      setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId))

      toast({
        title: "Амжилттай",
        description: "Чат устгагдлаа",
      })
    } catch (error) {
      console.error("Error removing chat:", error)
      throw error
    }
  }

  return (
    <ChatContext.Provider
      value={{
        // User-to-user chat
        unreadCount,
        activeChatId,
        setActiveChatId,
        isChatWidgetVisible,
        setChatWidgetVisible: setChatWidgetVisible,
        chats,
        messages,
        sendMessage,
        deleteMessage,
        markChatAsRead,
        startNewChat,
        loadingChats,
        loadingMessages,
        currentRecipientId,
        setCurrentRecipientId,
        removeChat,

        // Admin chat
        isAdminChatVisible,
        setAdminChatVisible,
        adminChatId,
        adminMessages,
        sendAdminMessage,
        deleteAdminMessage,
        adminUnreadCount,
        loadingAdminChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
