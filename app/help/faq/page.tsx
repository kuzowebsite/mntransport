"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Хайлтын функц
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Энд хайлтын логик хэрэгжүүлэх
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Түгээмэл асуултууд</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/help">Бүгд</Link>
          </Button>
          <Button variant="default" asChild>
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
                placeholder="Асуулт хайх..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Хайх</Button>
          </form>
        </CardContent>
      </Card>

      {/* Түгээмэл асуултууд */}
      <Card>
        <CardHeader>
          <CardTitle>Түгээмэл асуултууд</CardTitle>
          <CardDescription>МонголТээвэр платформын талаарх түгээмэл асуултууд</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Бүртгэл үүсгэх, нэвтрэх</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Бүртгэл үүсгэх:</strong> Нүүр хуудасны баруун дээд буланд байрлах "Нэвтрэх" товчийг дарж,
                    "Бүртгүүлэх" холбоос дээр дарна. Шаардлагатай мэдээллийг бөглөж "Бүртгүүлэх" товчийг дарна.
                  </p>
                  <p>
                    <strong>Нэвтрэх:</strong> Нүүр хуудасны баруун дээд буланд байрлах "Нэвтрэх" товчийг дарж, имэйл
                    хаяг болон нууц үгээ оруулж "Нэвтрэх" товчийг дарна.
                  </p>
                  <p>
                    <strong>Нууц үг сэргээх:</strong> Нэвтрэх хуудас дээр "Нууц үгээ мартсан" холбоос дээр дарж,
                    бүртгэлтэй имэйл хаягаа оруулж "Илгээх" товчийг дарна. Имэйл хаягаар ирсэн холбоосоор орж нууц үгээ
                    шинэчилнэ.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Зар оруулах, хайх</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Зар оруулах:</strong> Дээд цэсний "Зар оруулах" холбоос дээр дарж, шаардлагатай мэдээллийг
                    бөглөж "Зар нийтлэх" товчийг дарна. Зар оруулахын тулд нэвтэрсэн байх шаардлагатай.
                  </p>
                  <p>
                    <strong>Зар хайх:</strong> Дээд цэсний "Хайлт" холбоос дээр дарж, хайх утгаа оруулж "Хайх" товчийг
                    дарна. Хайлтын үр дүнг шүүх боломжтой.
                  </p>
                  <p>
                    <strong>Зар дэлгэрэнгүй харах:</strong> Хайлтын үр дүнгээс сонирхсон зар дээр дарж дэлгэрэнгүй
                    мэдээллийг харах боломжтой.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Захиалга өгөх, хянах</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Захиалга өгөх:</strong> Зарын дэлгэрэнгүй хуудас дээр "Захиалга өгөх" товчийг дарж,
                    шаардлагатай мэдээллийг бөглөж "Захиалах" товчийг дарна. Захиалга өгөхийн тулд нэвтэрсэн байх
                    шаардлагатай.
                  </p>
                  <p>
                    <strong>Захиалга хянах:</strong> Профайл хуудасны "Захиалгууд" хэсэгт орж өөрийн захиалгуудыг харах
                    боломжтой.
                  </p>
                  <p>
                    <strong>Захиалга цуцлах:</strong> Профайл хуудасны "Захиалгууд" хэсэгт орж, цуцлах захиалгын
                    "Цуцлах" товчийг дарна.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Баталгаажуулалт хийх</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Баталгаажуулалт хийх:</strong> Профайл хуудасны "Баталгаажуулалт" хэсэгт орж, шаардлагатай
                    баримт бичгүүдийг оруулж "Илгээх" товчийг дарна. Баталгаажуулалт хийхийн тулд нэвтэрсэн байх
                    шаардлагатай.
                  </p>
                  <p>
                    <strong>Баталгаажуулалтын төлөв шалгах:</strong> Профайл хуудасны "Баталгаажуулалт" хэсэгт орж
                    баталгаажуулалтын төлөвийг харах боломжтой.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Тээврийн үйлчилгээ ашиглах</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Тээврийн үйлчилгээ хайх:</strong> Хайлтын хуудас дээр тээврийн үйлчилгээний төрөл, чиглэл,
                    огноо зэргийг сонгож "Хайх" товчийг дарна.
                  </p>
                  <p>
                    <strong>Тээврийн үйлчилгээ захиалах:</strong> Хайлтын үр дүнгээс сонирхсон үйлчилгээ дээр дарж,
                    дэлгэрэнгүй мэдээллийг харж "Захиалга өгөх" товчийг дарна.
                  </p>
                  <p>
                    <strong>Тээврийн үйлчилгээ үзүүлэх:</strong> "Зар оруулах" хэсэгт орж, тээврийн үйлчилгээний төрлийг
                    сонгож, шаардлагатай мэдээллийг бөглөж "Зар нийтлэх" товчийг дарна.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Төлбөр хийх</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Төлбөрийн хэрэгслүүд:</strong> Манай платформ дээр дараах төлбөрийн хэрэгслүүдийг ашиглах
                    боломжтой:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Банкны карт (Visa, Mastercard)</li>
                      <li>QPay</li>
                      <li>Социал Пэй</li>
                      <li>Монпэй</li>
                    </ul>
                  </p>
                  <p>
                    <strong>Төлбөр хийх:</strong> Захиалга өгөх үед төлбөрийн хэрэгслээ сонгож, шаардлагатай мэдээллийг
                    оруулж төлбөрөө хийнэ.
                  </p>
                  <p>
                    <strong>Төлбөрийн баримт:</strong> Төлбөр амжилттай хийгдсэний дараа таны имэйл хаягаар төлбөрийн
                    баримт илгээгдэнэ.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Үнэлгээ, сэтгэгдэл үлдээх</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Үнэлгээ өгөх:</strong> Үйлчилгээ авсны дараа профайл хуудасны "Захиалгууд" хэсэгт орж,
                    үнэлгээ өгөх захиалгын "Үнэлэх" товчийг дарж үнэлгээ өгнө.
                  </p>
                  <p>
                    <strong>Сэтгэгдэл үлдээх:</strong> Үйлчилгээ авсны дараа профайл хуудасны "Захиалгууд" хэсэгт орж,
                    сэтгэгдэл үлдээх захиалгын "Сэтгэгдэл үлдээх" товчийг дарж сэтгэгдлээ бичнэ.
                  </p>
                  <p>
                    <strong>Үнэлгээ, сэтгэгдэл харах:</strong> Зарын дэлгэрэнгүй хуудас дээр үйлчилгээ үзүүлэгчийн
                    үнэлгээ, сэтгэгдлүүдийг харах боломжтой.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>Аюулгүй байдал</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p>
                    <strong>Хувийн мэдээллийн аюулгүй байдал:</strong> Манай платформ таны хувийн мэдээллийг 256-бит
                    шифрлэлтээр хамгаалдаг. Таны мэдээллийг зөвшөөрөлгүйгээр гуравдагч этгээдэд дамжуулахгүй.
                  </p>
                  <p>
                    <strong>Төлбөрийн аюулгүй байдал:</strong> Бүх төлбөрийн гүйлгээ нь PCI DSS стандартын дагуу
                    хийгддэг бөгөөд таны төлбөрийн мэдээлэл манай серверт хадгалагддаггүй.
                  </p>
                  <p>
                    <strong>Хуурамч хэрэглэгчээс сэргийлэх:</strong> Бүх хэрэглэгчид баталгаажуулалт хийх шаардлагатай
                    бөгөөд хуурамч хэрэглэгчдийг илрүүлэх системтэй.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
