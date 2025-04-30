"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBooking } from "@/contexts/booking-context"
import { BookingCard } from "@/components/booking/booking-card"
import { Loader2 } from "lucide-react"

export function BookingList() {
  const { providedBookings, requestedBookings, isLoading } = useBooking()
  const [activeTab, setActiveTab] = useState("provided")

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <Tabs defaultValue="provided" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="provided">
            Миний үйлчилгээнүүд
            {providedBookings.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {providedBookings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requested">
            Миний захиалгууд
            {requestedBookings.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {requestedBookings.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provided">
          {providedBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {providedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Танд одоогоор үйлчилгээ байхгүй байна</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requested">
          {requestedBookings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {requestedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/50">
              <p className="text-muted-foreground">Танд одоогоор захиалга байхгүй байна</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
