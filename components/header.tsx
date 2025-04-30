"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Search,
  User,
  LogOut,
  Settings,
  BookmarkIcon,
  Package,
  MessageCircle,
  MessageSquare,
  Home,
  HelpCircle,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { useChat } from "@/contexts/chat-context"

export function Header() {
  const pathname = usePathname()
  const { user, userData, logout } = useAuth()
  const { settings, loading } = useSiteSettings()
  const { unreadCount, setChatWidgetVisible } = useChat()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleOpenUserChat = () => {
    setChatWidgetVisible(true) // Нэгдсэн чатын цонхыг нээх
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        isScrolled ? "bg-white shadow-sm" : "bg-white/80 backdrop-blur-md",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            {!loading && settings.logoData ? (
              <div className="h-8 w-8 relative">
                <Image
                  src={settings.logoData || "/placeholder.svg"}
                  alt={settings.siteName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">М</span>
              </div>
            )}
            <span className="font-bold text-xl">{!loading ? settings.siteName : "МонголТээвэр"}</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(navigationMenuTriggerStyle(), pathname === "/" && "bg-primary/10 text-primary")}
                  >
                    <Home className="h-4 w-4 mr-2" /> Нүүр
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/search" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(navigationMenuTriggerStyle(), pathname === "/search" && "bg-primary/10 text-primary")}
                  >
                    Хайлт
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/post" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(navigationMenuTriggerStyle(), pathname === "/post" && "bg-primary/10 text-primary")}
                  >
                    Зар нэмэх
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(pathname?.startsWith("/help") && "bg-primary/10 text-primary")}>
                  Тусламж
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/20 to-primary/5 p-6 no-underline outline-none focus:shadow-md"
                          href="/help"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">Тусламжийн төв</div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Түгээмэл асуултууд болон хэрэглэх заавар
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/help/faq"
                        >
                          <div className="text-sm font-medium leading-none">Түгээмэл асуултууд</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Хэрэглэгчдийн түгээмэл асуултууд
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/help/guide"
                        >
                          <div className="text-sm font-medium leading-none">Хэрэглэх заавар</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Платформыг хэрхэн ашиглах талаарх заавар
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          href="/help/contact"
                        >
                          <div className="text-sm font-medium leading-none">Холбоо барих</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Бидэнтэй холбоо барих
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Facebook-style Search */}
        </div>

        <div className="flex items-center gap-2">
          {/* User-to-user chat button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleOpenUserChat}
              aria-label="Хэрэглэгчидтэй чатлах"
            >
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          )}

          {/* User Menu (Desktop) */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userData?.photoURL || undefined} alt={userData?.name || "User"} />
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userData?.name || "Хэрэглэгч"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Профайл</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/bookings">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Захиалгууд</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/bookmarks">
                    <BookmarkIcon className="mr-2 h-4 w-4" />
                    <span>Хадгалсан зарууд</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Тохиргоо</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatWidgetVisible(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Мессеж</span>
                  {unreadCount > 0 && (
                    <div className="ml-auto bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {unreadCount}
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Гарах</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Нэвтрэх
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Бүртгүүлэх</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  {user ? (
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userData?.photoURL || undefined} alt={userData?.name || "User"} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-medium">{userData?.name || "Хэрэглэгч"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Нэвтрэх
                        </Button>
                      </Link>
                      <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Бүртгүүлэх
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto py-2">
                  <nav className="grid gap-1 px-2">
                    <Link
                      href="/"
                      className={cn(
                        "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                        pathname === "/" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home className="mr-3 h-5 w-5" />
                      Нүүр хуудас
                    </Link>
                    <Link
                      href="/search"
                      className={cn(
                        "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                        pathname === "/search" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Search className="mr-3 h-5 w-5" />
                      Хайлт
                    </Link>
                    <Link
                      href="/post"
                      className={cn(
                        "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                        pathname === "/post" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="mr-3 h-5 w-5" />
                      Зар нэмэх
                    </Link>
                    <Link
                      href="/help"
                      className={cn(
                        "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                        pathname?.startsWith("/help") ? "bg-primary/10 text-primary" : "hover:bg-muted",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HelpCircle className="mr-3 h-5 w-5" />
                      Тусламж
                    </Link>

                    {user && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <button
                          className={cn(
                            "flex items-center py-3 px-3 rounded-md text-sm font-medium w-full text-left",
                            "hover:bg-muted",
                          )}
                          onClick={() => {
                            handleOpenUserChat()
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <MessageCircle className="mr-3 h-5 w-5" />
                          Мессежүүд
                          {unreadCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                        <Link
                          href="/profile"
                          className={cn(
                            "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                            pathname === "/profile" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="mr-3 h-5 w-5" />
                          Профайл
                        </Link>
                        <Link
                          href="/profile/bookings"
                          className={cn(
                            "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                            pathname === "/profile/bookings" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Package className="mr-3 h-5 w-5" />
                          Захиалгууд
                        </Link>
                        <Link
                          href="/profile/bookmarks"
                          className={cn(
                            "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                            pathname === "/profile/bookmarks" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <BookmarkIcon className="mr-3 h-5 w-5" />
                          Хадгалсан зарууд
                        </Link>
                        <Link
                          href="/profile/settings"
                          className={cn(
                            "flex items-center py-3 px-3 rounded-md text-sm font-medium",
                            pathname === "/profile/settings" ? "bg-primary/10 text-primary" : "hover:bg-muted",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          Тохиргоо
                        </Link>
                      </>
                    )}
                  </nav>
                </div>

                {user && (
                  <div className="border-t p-4">
                    <button
                      className="flex items-center py-2 px-3 rounded-md text-sm font-medium hover:bg-muted w-full"
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Гарах
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
