"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { database, hasValidConfig } from "@/lib/firebase"
import { ref, onValue, update } from "firebase/database"

type SiteSettings = {
  siteName: string
  description: string
  contactEmail: string
  contactPhone: string
  address: string
  socialLinks: {
    facebook: string
    twitter: string
    instagram: string
  }
  logoData: string | null // Base64 encoded logo image
  termsAndConditions: string
  privacyPolicy: string
  aboutUs: string
}

const defaultSettings: SiteSettings = {
  siteName: "МонголТээвэр",
  description: "Монголын тээврийн үйлчилгээний платформ",
  contactEmail: "info@mongoltransport.mn",
  contactPhone: "+976 99112233",
  address: "Улаанбаатар хот, Монгол улс",
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
  },
  logoData: null,
  termsAndConditions: "",
  privacyPolicy: "",
  aboutUs: "",
}

type SiteSettingsContextType = {
  settings: SiteSettings
  loading: boolean
  error: Error | null
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  updateSettings: async () => {},
})

export const useSiteSettings = () => useContext(SiteSettingsContext)

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (hasValidConfig && database) {
      const settingsRef = ref(database, "settings/general")

      const unsubscribe = onValue(
        settingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val()
            setSettings({
              ...defaultSettings,
              ...data,
            })
          }
          setLoading(false)
        },
        (error) => {
          console.error("Error loading site settings:", error)
          setError(error)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } else {
      // Use default settings for development without Firebase
      console.log("Using default site settings for development")
      // Simulate loading delay
      const timeout = setTimeout(() => {
        setSettings(defaultSettings)
        setLoading(false)
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [])

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      if (hasValidConfig && database) {
        const settingsRef = ref(database, "settings/general")
        await update(settingsRef, newSettings)
      }
      setSettings((prev) => ({ ...prev, ...newSettings }))
    } catch (error) {
      console.error("Error updating settings:", error)
      setError(error as Error)
      throw error
    }
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}
