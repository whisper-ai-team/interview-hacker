"use client"

import Link from "next/link"
import { Download, ArrowLeft, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface MeetingCompletedProps {
  meetingId: string
  creditsUsed: number
  onExport: () => void
}

export function MeetingCompleted({ meetingId, creditsUsed, onExport }: MeetingCompletedProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center">Interview Session Completed</CardTitle>
          <CardDescription className="text-center">
            Your interview practice session has been successfully completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            You used <span className="font-semibold">{creditsUsed} credits</span> during this session.
          </p>
          <p>You can download the transcript of your interview or return to the dashboard to start a new session.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button onClick={onExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Transcript
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
