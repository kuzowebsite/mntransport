"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

const navItems = [
  { name: "Хяналтын самбар", href: "/admin", icon: LayoutDashboard },
  { name: "Хэрэглэгчид", href: "/admin/users", icon: Users },
  { name: "Зарууд", href: "/admin/posts", icon: FileText },
  { name: "Захиалгууд", href: "/admin/bookings", icon: Calendar },
  { name: "Баталгаажуулалт", href: "/admin/verifications", icon: ShieldCheck },
  { name: "Чат удирдлага", href: "/admin/chat", icon: MessageSquare },
  { name: "Тохиргоо", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut(auth)
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar for desktop */}
      <div
        className={cn(
          "bg-slate-900 text-white w-64 min-h-screen flex-shrink-0 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold mb-6">Админ удирдлага</h1>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center text-white border-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Гарах
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Content padding for desktop */}
      <div className="lg:pl-64" />
    </>
  )
}
