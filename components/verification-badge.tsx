import { Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type VerificationBadgeProps = {
  providerStatus?: "none" | "partial" | "verified"
  seekerStatus?: "none" | "partial" | "verified"
  role?: "provider" | "seeker"
  className?: string
}

export function VerificationBadge({
  providerStatus = "none",
  seekerStatus = "none",
  role = "provider",
  className,
}: VerificationBadgeProps) {
  // Determine which status to display based on role
  const status = role === "provider" ? providerStatus : seekerStatus

  // If status is undefined or null, default to "none"
  const displayStatus = status || "none"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${className} ${
              displayStatus === "verified"
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : displayStatus === "partial"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            {displayStatus === "verified" ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {role === "provider" ? "Үйлчилгээ үзүүлэгч баталгаажсан" : "Үйлчилгээ хайгч баталгаажсан"}
              </>
            ) : displayStatus === "partial" ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {role === "provider" ? "Үйлчилгээ үзүүлэгч дутуу баталгаажсан" : "Үйлчилгээ хайгч дутуу баталгаажсан"}
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                {role === "provider" ? "Үйлчилгээ үзүүлэгч баталгаажаагүй" : "Үйлчилгээ хайгч баталгаажаагүй"}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {displayStatus === "verified"
            ? role === "provider"
              ? "Энэ хэрэглэгч үйлчилгээ үзүүлэгчээр бүрэн баталгаажсан"
              : "Энэ хэрэглэгч үйлчилгээ хайгчаар бүрэн баталгаажсан"
            : displayStatus === "partial"
              ? role === "provider"
                ? "Энэ хэрэглэгч үйлчилгээ үзүүлэгчээр дутуу баталгаажсан"
                : "Энэ хэрэглэгч үйлчилгээ хайгчаар дутуу баталгаажсан"
              : role === "provider"
                ? "Энэ хэрэглэгч үйлчилгээ үзүүлэгчээр баталгаажаагүй"
                : "Энэ хэрэглэгч үйлчилгээ хайгчаар баталгаажаагүй"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
