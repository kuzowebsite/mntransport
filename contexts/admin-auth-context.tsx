"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import { auth, database } from "@/lib/firebase"

type User = {
  uid: string
  email: string | null
  displayName: string | null
  role?: string
}

type AdminAuthContextType = {
  user: User | null
  isAdmin: boolean
  loading: boolean
  admin: User | null
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  admin: null,
})

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from database to check role
          const userRef = ref(database, `users/${firebaseUser.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            const userData = snapshot.val()
            const userWithRole = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: userData.role,
            }

            setUser(userWithRole)
            setIsAdmin(userData.role === "admin")
            console.log("User role:", userData.role, "isAdmin:", userData.role === "admin")
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
            })
            setIsAdmin(false)
            console.log("User exists in Firebase Auth but not in database")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setIsAdmin(false)
        }
      } else {
        console.log("No user signed in")
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, loading, admin: user }}>{children}</AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
