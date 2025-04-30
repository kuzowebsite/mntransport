import { Skeleton } from "@/components/ui/skeleton"

export default function HelpLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <Skeleton className="h-12 w-full mb-6" />
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  )
}
