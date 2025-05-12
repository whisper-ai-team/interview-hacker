"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, MoreVertical, Play, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MeetingsListProps {
  meetings: any[]
}

export default function MeetingsList({ meetings }: MeetingsListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null)

  const handleContinueMeeting = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`)
  }

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/meetings/${meetingToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete meeting")
      }

      // Refresh the page to update the meetings list
      router.refresh()
      toast({
        title: "Meeting deleted",
        description: "The meeting has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting meeting:", error)
      toast({
        title: "Failed to delete meeting",
        description: "An error occurred while deleting the meeting",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setMeetingToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{meeting.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMeetingToDelete(meeting.id)}>
                    <Trash className="h-4 w-4 mr-2 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="flex items-center text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(meeting.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {meeting.messages && meeting.messages.length > 0
                ? `${meeting.messages.length} messages`
                : "No messages yet"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleContinueMeeting(meeting.id)}>
              <Play className="h-4 w-4 mr-2" />
              Continue Interview
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={!!meetingToDelete} onOpenChange={(open) => !open && setMeetingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meeting and all its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteMeeting()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
