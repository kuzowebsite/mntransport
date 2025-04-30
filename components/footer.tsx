"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Facebook, Instagram, Twitter, Mail, Phone, MapPinned } from "lucide-react"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  const { settings, loading } = useSiteSettings()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t mt-auto">
      <div className="container mx-auto py-12 px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Лого болон сайтын нэр */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              {loading ? (
                <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
              ) : settings.logoData ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                  <Image
                    src={settings.logoData || "/placeholder.svg"}
                    alt={`${settings.siteName} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              )}
              <h2 className="text-xl font-bold">{loading ? "Ачаалж байна..." : settings.siteName}</h2>
            </div>
            <p className="text-gray-600 mb-6">
              {loading
                ? "Ачаалж байна..."
                : settings.siteDescription || "Хот, аймаг, сум хоорондын тээврийн үйлчилгээний платформ"}
            </p>
            <div className="flex gap-3">
              <Link
                href="https://facebook.com"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-gray-600" />
              </Link>
              <Link
                href="https://instagram.com"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-gray-600" />
              </Link>
              <Link
                href="https://twitter.com"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 text-gray-600" />
              </Link>
            </div>
          </div>

          {/* Холбоосууд */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-5">Үйлчилгээ</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/search" className="text-gray-600 hover:text-primary transition-colors">
                Хайлт
              </Link>
              <Link href="/post" className="text-gray-600 hover:text-primary transition-colors">
                Зар нэмэх
              </Link>
              <Link href="/profile" className="text-gray-600 hover:text-primary transition-colors">
                Хэрэглэгчийн профайл
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-primary transition-colors">
                Тусламж
              </Link>
            </nav>
          </div>

          {/* Нэмэлт холбоосууд */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-5">Компани</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/about" className="text-gray-600 hover:text-primary transition-colors">
                Бидний тухай
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-primary transition-colors">
                Үйлчилгээний нөхцөл
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-primary transition-colors">
                Нууцлалын бодлого
              </Link>
              <Link href="/faq" className="text-gray-600 hover:text-primary transition-colors">
                Түгээмэл асуултууд
              </Link>
            </nav>
          </div>

          {/* Холбоо барих */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-5">Холбоо барих</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-gray-600">
                  {loading ? "Ачаалж байна..." : settings.contactEmail || "info@mongoltransport.mn"}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-gray-600">{loading ? "Ачаалж байна..." : settings.phone || "+976 99112233"}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPinned className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-gray-600">
                  {loading ? "Ачаалж байна..." : settings.address || "Улаанбаатар хот, Монгол улс"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            &copy; {currentYear} {loading ? "Ачаалж байна..." : settings.siteName || "МонголТээвэр"}. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-primary transition-colors">
              Үйлчилгээний нөхцөл
            </Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary transition-colors">
              Нууцлалын бодлого
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
