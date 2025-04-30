"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { auth, database, hasValidConfig } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { ref, get, onValue } from "firebase/database"

type UserData = {
  name: string
  phone: string
  email: string
  createdAt: string
  photoURL?: string // This can now be a base64 string
}

type AuthContextType = {
  user: User | null
  userData: UserData | null
  loading: boolean
  refreshUserData: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Function to fetch user data from the database
  const fetchUserData = async (userId: string) => {
    if (!hasValidConfig || !database) return

    try {
      const userRef = ref(database, `users/${userId}`)
      const snapshot = await get(userRef)

      if (snapshot.exists()) {
        setUserData(snapshot.val())
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Function to refresh user data
  const refreshUserData = async () => {
    if (user && hasValidConfig && database) {
      await fetchUserData(user.uid)
    }
  }

  // Function to logout
  const logout = async () => {
    if (hasValidConfig && auth) {
      try {
        await auth.signOut()
        setUser(null)
        setUserData(null)
      } catch (error) {
        console.error("Error signing out:", error)
      }
    } else {
      // Mock logout for development without Firebase
      setUser(null)
      setUserData(null)
    }
  }

  useEffect(() => {
    if (hasValidConfig && auth) {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser)

          if (currentUser && database) {
            // Set up a real-time listener for user data
            const userRef = ref(database, `users/${currentUser.uid}`)
            const userListener = onValue(
              userRef,
              (snapshot) => {
                if (snapshot.exists()) {
                  setUserData(snapshot.val())
                } else {
                  setUserData(null)
                }
                setLoading(false)
              },
              (error) => {
                console.error("Error in user data listener:", error)
                setLoading(false)
              },
            )

            return () => {
              // Clean up the listener when component unmounts or user changes
              userListener()
            }
          } else {
            setUserData(null)
            setLoading(false)
          }
        },
        (error) => {
          console.error("Auth state change error:", error)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      // Use mock data for development without Firebase
      console.log("Using mock user data for development")
      // Simulate loading delay
      const timeout = setTimeout(() => {
        // For development, you can set this to a mock user or null
        // setUser(dummyUserData as unknown as User);
        // setUserData({
        //   name: "Жишээ Хэрэглэгч",
        //   phone: "+976 99112233",
        //   email: "user@example.com",
        //   createdAt: new Date().toISOString(),
        // });
        setUser(null)
        setUserData(null)
        setLoading(false)
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData, logout }}>{children}</AuthContext.Provider>
  )
}
