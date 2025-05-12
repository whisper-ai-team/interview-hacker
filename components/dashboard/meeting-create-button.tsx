"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function MeetingCreateButton() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your meeting",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Create a new meeting
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      })

      // Improved error handling
      if (!response.ok) {
        let errorMessage = `Error: ${response.status}`

        try {
          // Try to parse the error response as JSON
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          // If JSON parsing fails, use the status text
          errorMessage = `Error: ${response.status} ${response.statusText}`
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Navigate to the meeting page
      router.push(`/meeting/${data.id}`)

      // Close the dialog
      setIsDialogOpen(false)
      setTitle("")

      toast({
        title: "Meeting created",
        description: "Your meeting has been created successfully",
      })
    } catch (error) {
      console.error("Error creating meeting:", error)
      toast({
        title: "Failed to create meeting",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        New Interview
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a New Interview</DialogTitle>
            <DialogDescription>Enter a title for your interview session.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartMeeting}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Interview Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Frontend Developer Interview"
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
