"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard, Coins } from "lucide-react"
import { useRouter } from "next/navigation"

// Make sure to export the component as default
export default function UserCredits() {
  const { data: session } = useSession()
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCredits = async () => {
      if (!session?.user) return

      try {
        setIsLoading(true)
        const response = await fetch("/api/user/credits")

        if (!response.ok) {
          throw new Error("Failed to fetch credits")
        }

        const data = await response.json()
        setCredits(data.credits)
      } catch (error) {
        console.error("Error fetching credits:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCredits()
  }, [session])

  const handleBuyCredits = () => {
    router.push("/pricing")
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Coins className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-700">Your Credits</p>
              {isLoading ? (
                <div className="flex items-center mt-1">
                  <Loader2 className="h-4 w-4 text-indigo-500 animate-spin mr-2" />
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : (
                <p className="text-xl font-bold text-indigo-700">{credits?.toLocaleString() || 0}</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBuyCredits}
            className="ml-4 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Buy Credits
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
