"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Clock, FileText, Plus, Rocket } from "lucide-react"
import NewMeetingButton from "@/components/meeting/new-meeting-button"
import MeetingsList from "@/components/meeting/meetings-list"
import ResumesList from "@/components/resume/resumes-list"
import LoadingSpinner from "@/components/ui/loader-spinner"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [meetings, setMeetings] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Separate effect for fetching user credits
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (status !== "authenticated") return

      try {
        setIsLoadingCredits(true)
        const response = await fetch("/api/user/credits")

        if (!response.ok) {
          throw new Error("Failed to fetch user credits")
        }

        const data = await response.json()
        setUserCredits(data.credits)
      } catch (err) {
        console.error("Error fetching user credits:", err)
      } finally {
        setIsLoadingCredits(false)
      }
    }

    fetchUserCredits()
  }, [status])

  useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch meetings
        const meetingsRes = await fetch("/api/meetings")
        if (!meetingsRes.ok) throw new Error("Failed to fetch meetings")
        const meetingsData = await meetingsRes.json()

        // Fetch resumes
        const resumesRes = await fetch("/api/resume")
        if (!resumesRes.ok) throw new Error("Failed to fetch resumes")
        const resumesData = await resumesRes.json()

        setMeetings(meetingsData)
        setResumes(resumesData.resumes || [])
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (status === "authenticated" && session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}!</p>
          </div>

          {/* Inline credits display instead of using the component */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Your Credits</p>
                    {isLoadingCredits ? (
                      <div className="flex items-center mt-1">
                        <LoadingSpinner size="sm" />
                        <p className="text-sm text-gray-500 ml-2">Loading...</p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-indigo-700">{userCredits?.toLocaleString() || 0}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/pricing")}
                  className="ml-4 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                >
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Launch Copilot button */}
        <div className="mb-6">
          <Link href="/copilot">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Rocket className="mr-2 h-4 w-4" />
              Launch Interview Copilot
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Interviews</span>
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Resumes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interview Sessions</CardTitle>
                <CardDescription>Start a new interview or continue an existing one.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <NewMeetingButton />

                  {meetings.length > 0 ? (
                    <div className="space-y-4 mt-6">
                      <MeetingsList meetings={meetings} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You haven't created any interviews yet.</p>
                      <p className="text-muted-foreground">Click the button above to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumes</CardTitle>
                <CardDescription>Manage your resumes for personalized interview responses.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => router.push("/resume/new")} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Resume
                  </Button>

                  {resumes.length > 0 ? (
                    <div className="space-y-4 mt-6">
                      <ResumesList resumes={resumes} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">You haven't added any resumes yet.</p>
                      <p className="text-muted-foreground">
                        Adding a resume helps tailor interview responses to your experience.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return null
}
