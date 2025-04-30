"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Mail, Phone, MessageSquare } from "lucide-react"

export function ContactForm() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Амжилттай илгээгдлээ",
      description: "Таны хүсэлтийг хүлээн авлаа. Бид тантай удахгүй холбогдох болно.",
    })
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
    // Энд формын мэдээллийг серверт илгээх логик хэрэгжүүлэх
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Нэр
              </label>
              <Input
                id="name"
                name="name"
                placeholder="Таны нэр"
                value={contactForm.name}
                onChange={handleContactChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Имэйл
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@mail.com"
                value={contactForm.email}
                onChange={handleContactChange}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Гарчиг
            </label>
            <Input
              id="subject"
              name="subject"
              placeholder="Асуултын гарчиг"
              value={contactForm.subject}
              onChange={handleContactChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Мессеж
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Асуулт, санал хүсэлтээ бичнэ үү"
              rows={5}
              value={contactForm.message}
              onChange={handleContactChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Илгээх
          </Button>
        </form>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Холбоо барих мэдээлэл</h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-gray-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Имэйл</p>
              <p className="text-sm text-gray-600">info@mongoltransport.mn</p>
            </div>
          </div>
          <div className="flex items-start">
            <Phone className="h-5 w-5 text-gray-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Утас</p>
              <p className="text-sm text-gray-600">+976 7777-8888</p>
            </div>
          </div>
          <div className="flex items-start">
            <MessageSquare className="h-5 w-5 text-gray-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Чат</p>
              <p className="text-sm text-gray-600">Ажлын цагаар онлайн чатаар холбогдох</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
