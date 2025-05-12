import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Meeting {
  id: string
  title: string
  createdAt: Date | string
  completed: boolean
}

interface MeetingCardProps {
  meeting: Meeting
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  // Handle date formatting with validation
  let formattedDate = "Unknown date"
  let createdAtDate: Date

  try {
    // Check if createdAt is already a Date object
    if (meeting.createdAt instanceof Date) {
      createdAtDate = meeting.createdAt
    } else {
      // Try to parse the string to a Date
      createdAtDate = new Date(meeting.createdAt)
    }

    // Validate that the date is valid
    if (!isNaN(createdAtDate.getTime())) {
      formattedDate = formatDistanceToNow(createdAtDate, { addSuffix: true })
    }
  } catch (error) {
    console.error("Error formatting date:", error)
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-indigo-900">{meeting.title || "Interview Session"}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="flex items-center">
          {meeting.completed ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Completed</span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">In Progress</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link href={`/meeting/${meeting.id}`}>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
            {meeting.completed ? "View Session" : "Continue Session"}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
