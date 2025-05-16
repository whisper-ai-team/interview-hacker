"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import {
  AlertCircle,
  Clock,
  FileText,
  Plus,
  Rocket,
  BarChart3,
  Calendar,
  ChevronRight,
  Sparkles,
  Zap,
  ArrowUpRight,
  Bell,
  Settings,
  User,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import NewMeetingButton from "@/components/meeting/new-meeting-button"
import MeetingsList from "@/components/meeting/meetings-list"
import ResumesList from "@/components/resume/resumes-list"
import LoadingSpinner from "@/components/ui/loader-spinner"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [meetings, setMeetings] = useState<any[]>([])
  const [resumes, setResumes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(false)
  const [progress, setProgress] = useState(0)

  // Intersection observer hooks for scroll animations
  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Simulate progress for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

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
        const [mRes, rRes] = await Promise.all([fetch("/api/meetings"), fetch("/api/resume")])
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-primary/5 to-background">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading your dashboard..." />
          <p className="mt-4 text-muted-foreground animate-pulse">Preparing your interview data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="destructive" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Alert>
      </div>
    )
  }

  return session?.user ? (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header/Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-xl hidden sm:inline-block">InterviewHackr</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/api/auth/signout")}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back,{" "}
              <span className="font-medium text-foreground">{session.user.name || session.user.email}</span>!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/pricing")} className="hidden sm:flex">
              <Zap className="mr-2 h-4 w-4 text-primary" />
              Upgrade Plan
            </Button>

            <Link href="/copilot" passHref>
              <Button className="group shadow-sm" size="sm">
                <Rocket className="mr-2 h-4 w-4" />
                Launch Copilot
                <ArrowUpRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8"
          ref={statsRef}
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={cardVariants}>
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingCredits ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold">{userCredits?.toLocaleString() || "0"}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {userCredits && userCredits > 0 ? "Credits available for interviews" : "Purchase credits to continue"}
                </p>
              </CardContent>
              <CardFooter className="p-0">
                <div className="w-full bg-primary/10 h-1">
                  <div className="bg-primary h-1" style={{ width: `${Math.min((userCredits || 0) / 10, 100)}%` }}></div>
                </div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meetings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {meetings.length > 0 ? `Last interview: ${new Date().toLocaleDateString()}` : "No interviews yet"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resumes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resumes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resumes.length > 0 ? "Resumes available for interviews" : "Add a resume to improve responses"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interview Progress</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{progress}%</div>
                  <Badge variant="outline" className="text-xs">
                    Good
                  </Badge>
                </div>
                <Progress value={progress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">+12% from last week</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
          <Tabs defaultValue="meetings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Interviews</span>
              </TabsTrigger>
              <TabsTrigger value="resumes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Resumes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="meetings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Interview Sessions</CardTitle>
                      <CardDescription>Start a new interview or continue an existing one.</CardDescription>
                    </div>
                    <NewMeetingButton className="shadow-sm" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {meetings.length > 0 ? (
                    <MeetingsList meetings={meetings} />
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-lg border border-border">
                      <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-foreground font-medium">No interviews yet</p>
                      <p className="mt-1 text-muted-foreground">
                        Start your first interview session to practice your skills.
                      </p>
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Interview
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resumes" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Resumes</CardTitle>
                      <CardDescription>Manage your resumes for personalized interview responses.</CardDescription>
                    </div>
                    <Button onClick={() => router.push("/resume/new")} className="shadow-sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Resume
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {resumes.length > 0 ? (
                    <ResumesList resumes={resumes} />
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-lg border border-border">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-foreground font-medium">No resumes added yet</p>
                      <p className="mt-1 text-muted-foreground">
                        Adding a resume helps tailor interview responses to your experience.
                      </p>
                      <Button className="mt-4" size="sm" onClick={() => router.push("/resume/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Resume
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest interview sessions and updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length > 0 ? (
                <div className="space-y-4">
                  {meetings.slice(0, 3).map((meeting, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{meeting.title || "Interview Session"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString()} • {Math.floor(Math.random() * 30) + 10} minutes
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <span className="text-xs">View</span>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity to display.</p>
                  <p className="text-sm mt-1">Start an interview to see your activity here.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" size="sm" className="ml-auto gap-1">
                View All Activity
                <ChevronRight className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  ) : null
}
