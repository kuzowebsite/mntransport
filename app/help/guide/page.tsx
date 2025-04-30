"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function GuidePage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Хайлтын функц
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Энд хайлтын логик хэрэгжүүлэх
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Гарын авлага</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/help">Бүгд</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/help/faq">Асуултууд</Link>
          </Button>
          <Button variant="default" asChild>
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
                placeholder="Гарын авлага хайх..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Хайх</Button>
          </form>
        </CardContent>
      </Card>

      {/* Гарын авлага */}
      <Card>
        <CardHeader>
          <CardTitle>Гарын авлага</CardTitle>
          <CardDescription>МонголТээвэр платформыг ашиглах талаарх дэлгэрэнгүй гарын авлагууд</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Хэрэглэгчийн гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Хэрэглэгчийн гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформыг хэрхэн ашиглах талаар дэлгэрэнгүй тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Жолоочийн гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Жолоочийн гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформыг жолооч хэрхэн ашиглах талаар дэлгэрэнгүй тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Ачаа тээврийн гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Ачаа тээврийн гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформ дээр ачаа тээврийн үйлчилгээг хэрхэн ашиглах талаар
                  дэлгэрэнгүй тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Зорчигч тээврийн гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Зорчигч тээврийн гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформ дээр зорчигч тээврийн үйлчилгээг хэрхэн ашиглах талаар
                  дэлгэрэнгүй тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Төлбөр хийх гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Төлбөр хийх гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформ дээр төлбөр хэрхэн хийх талаар дэлгэрэнгүй тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Баталгаажуулалтын гарын авлага</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center mb-4">
                  <FileText className="h-8 w-8 text-blue-500 mr-2" />
                  <span>Баталгаажуулалтын гарын авлага.pdf</span>
                </div>
                <p className="text-sm text-gray-600">
                  Энэхүү гарын авлагад МонголТээвэр платформ дээр баталгаажуулалт хэрхэн хийх талаар дэлгэрэнгүй
                  тайлбарласан.
                </p>
                <Button variant="outline" className="mt-4 w-full">
                  Татаж авах
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
