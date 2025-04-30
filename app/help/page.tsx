"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Хайлтын функц
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Энд хайлтын логик хэрэгжүүлэх
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Тусламж төв</h1>
        <div className="flex gap-2">
          <Button variant="default" asChild>
            <Link href="/help">Бүгд</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help/faq">Асуултууд</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help/guide">Гарын авлага</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help/contact">Холбоо барих</Link>
          </Button>
        </div>
      </div>

      {/* Хайлтын хэсэг */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="text"
                placeholder="Тусламж хайх..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Хайх</Button>
          </form>
        </CardContent>
      </Card>

      {/* Тусламжийн категориуд */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Түгээмэл асуултууд
            </CardTitle>
            <CardDescription>Хэрэглэгчдийн түгээмэл асуултууд</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Платформыг ашиглахтай холбоотой түгээмэл асуултууд болон хариултуудыг энд олох боломжтой.
            </p>
            <Button asChild className="w-full">
              <Link href="/help/faq">Үзэх</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Гарын авлага
            </CardTitle>
            <CardDescription>Дэлгэрэнгүй гарын авлагууд</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Платформыг ашиглах талаарх дэлгэрэнгүй гарын авлагуудыг энд олох боломжтой.
            </p>
            <Button asChild className="w-full">
              <Link href="/help/guide">Үзэх</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Холбоо барих
            </CardTitle>
            <CardDescription>Бидэнтэй холбоо барих</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Асуулт, санал хүсэлтээ илгээх эсвэл бидэнтэй шууд холбогдох бол энд дарна уу.
            </p>
            <Button asChild className="w-full">
              <Link href="/help/contact">Холбогдох</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Шинэ нэмэгдсэн тусламжийн материалууд */}
      <Card>
        <CardHeader>
          <CardTitle>Шинэ нэмэгдсэн тусламжийн материалууд</CardTitle>
          <CardDescription>Сүүлд нэмэгдсэн тусламжийн материалууд</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Төлбөр хийх заавар</p>
                  <p className="text-sm text-gray-600">Нэмэгдсэн: 2023-10-15</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/guide">Үзэх</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Баталгаажуулалт хийх заавар</p>
                  <p className="text-sm text-gray-600">Нэмэгдсэн: 2023-10-10</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/guide">Үзэх</Link>
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium">Үнэлгээ, сэтгэгдэл үлдээх заавар</p>
                  <p className="text-sm text-gray-600">Нэмэгдсэн: 2023-10-05</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/help/faq">Үзэх</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
