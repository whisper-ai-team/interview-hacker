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
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    const fetchUserCredits = async () => {
      setIsLoadingCredits(true)
      try {
        const res = await fetch("/api/user/credits")
        if (!res.ok) throw new Error("Failed to fetch credits")
        const { credits } = await res.json()
        setUserCredits(credits)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingCredits(false)
      }
    }
    fetchUserCredits()
  }, [status])

  useEffect(() => {
    if (status !== "authenticated") return
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [mRes, rRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/resume"),
        ])
        if (!mRes.ok || !rRes.ok) throw new Error("Failed to load")
        const mData = await mRes.json()
        const rData = await rRes.json()
        setMeetings(mData)
        setResumes(rData.resumes || [])
      } catch (err) {
        console.error(err)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [status])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <AlertTitle className="text-lg text-red-600">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return session?.user ? (
    <div className="min-h-screen bg-indigo-50 py-12">
      <div className="container mx-auto max-w-screen-lg px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-indigo-900">Dashboard</h1>
            <p className="mt-1 text-indigo-700">
              Welcome back, <span className="font-medium">{session.user.name || session.user.email}</span>!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Card className="w-44 rounded-xl shadow-md border border-indigo-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                    <div>
                      <p className="text-sm text-indigo-500">Your Credits</p>
                      {isLoadingCredits ? (
                        <div className="flex items-center mt-1">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2 text-sm text-indigo-500">Loading...</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-2xl font-bold text-indigo-800">
                          {userCredits?.toLocaleString() || "0"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/pricing")}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Buy
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Link href="/copilot" passHref>
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition rounded-xl">
                <Rocket className="h-4 w-4" />
                Launch Copilot
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="meetings" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-indigo-200">
            <TabsTrigger
              value="meetings"
              className="flex-1 text-center py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg text-indigo-700 hover:bg-indigo-50 transition"
            >
              <Clock className="inline-block h-5 w-5 mr-1" />
              Interviews
            </TabsTrigger>
            <TabsTrigger
              value="resumes"
              className="flex-1 text-center py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:rounded-lg text-indigo-700 hover:bg-indigo-50 transition"
            >
              <FileText className="inline-block h-5 w-5 mr-1" />
              Resumes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-6">
            <Card className="rounded-xl shadow-md border border-indigo-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-indigo-900">Interview Sessions</CardTitle>
                <CardDescription className="text-indigo-600">
                  Start a new interview or continue an existing one.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <NewMeetingButton className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition" />
                {meetings.length > 0 ? (
                  <MeetingsList meetings={meetings} />
                ) : (
                  <div className="text-center py-12 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-indigo-600">No interviews yet.</p>
                    <p className="mt-1 text-indigo-500">Click above to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumes" className="space-y-6">
            <Card className="rounded-xl shadow-md border border-indigo-200 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-indigo-900">Resumes</CardTitle>
                <CardDescription className="text-indigo-600">
                  Manage your resumes for personalized interview responses.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Button
                  onClick={() => router.push("/resume/new")}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  <Plus className="h-4 w-4" />
                  Add New Resume
                </Button>
                {resumes.length > 0 ? (
                  <ResumesList resumes={resumes} />
                ) : (
                  <div className="text-center py-12 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-indigo-600">No resumes added yet.</p>
                    <p className="mt-1 text-indigo-500">
                      Adding one helps tailor interview responses.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  ) : null
}
