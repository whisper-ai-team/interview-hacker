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
import { Badge } from "@/components/ui/badge"
import { Clock, Edit, FileText, MoreVertical, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ResumesListProps {
  resumes: any[]
}

export default function ResumesList({ resumes }: ResumesListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null)

  const handleEditResume = (resumeId: string) => {
    router.push(`/resume/${resumeId}`)
  }

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/resume/${resumeToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete resume")
      }

      // Refresh the page to update the resumes list
      router.refresh()
      toast({
        title: "Resume deleted",
        description: "The resume has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting resume:", error)
      toast({
        title: "Failed to delete resume",
        description: "An error occurred while deleting the resume",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setResumeToDelete(null)
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

  // Function to truncate content for preview
  const truncateContent = (content: string | null, maxLength = 100) => {
    if (!content) return "No content available"
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content
  }

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <Card key={resume.id} className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center">
                  {resume.title}
                  {resume.isDefault && (
                    <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                      Default
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(resume.createdAt)}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditResume(resume.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResumeToDelete(resume.id)}>
                    <Trash className="h-4 w-4 mr-2 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {resume.content ? truncateContent(resume.content) : "No content available"}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleEditResume(resume.id)}>
              <FileText className="h-4 w-4 mr-2" />
              View & Edit
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={!!resumeToDelete} onOpenChange={(open) => !open && setResumeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resume. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteResume()
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
