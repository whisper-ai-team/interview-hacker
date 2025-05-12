import Link from "next/link"
import { CreditCard, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function InsufficientCredits() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-center">Insufficient Credits</CardTitle>
          <CardDescription className="text-center">
            You don't have enough credits to start a new interview session.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Each interview session requires at least 10 credits to start, and each AI response uses 1 credit.
          </p>
          <p className="font-medium">Purchase more credits to continue using Interview Copilot.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Credits
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
