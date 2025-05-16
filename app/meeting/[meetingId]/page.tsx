"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { DeepgramTranscriber } from "@/utils/deepgram-transcriber"
import { OpenAIClient } from "@/utils/openai-client"
import { generateUUID } from "@/utils/uuid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Mic,
  Share2,
  StopCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Info,
  Settings,
  Rocket,
  ChevronRight,
  ChevronDown,
  Cpu,
  ArrowUp,
  Users,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import LoadingSpinner from "@/components/ui/loader-spinner"
import ConversationDisplay from "@/components/meeting/conversation-display"
import { MeetingCompleted } from "@/components/meeting/meeting-completed"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import "@/app/conversation.css"

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const statusCardVariants = {
  idle: { scale: 1 },
  active: { scale: 1.02, transition: { yoyo: Number.POSITIVE_INFINITY, duration: 2 } },
}

export default function MeetingPage({ params }: { params: { meetingId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // State for user and meeting data
  const [user, setUser] = useState<any>(null)
  const [meeting, setMeeting] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true)
  const [isMeetingCompletedState, setIsMeetingCompletedState] = useState(false)
  const [creditsUsed, setCreditsUsed] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // State for screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<MediaStream | null>(null)
  const [isStartingScreenShare, setIsStartingScreenShare] = useState(false)

  // State for transcription
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)
  const [lastProcessedTime, setLastProcessedTime] = useState<Date | null>(null)

  // State for status
  const [statusMessage, setStatusMessage] = useState("Ready")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "disconnected",
  )
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [useFallbackMode, setUseFallbackMode] = useState(false)

  // Advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [showTranscriptProgress, setShowTranscriptProgress] = useState(true)

  // API keys
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)

  // Refs
  const transcriberRef = useRef<DeepgramTranscriber | null>(null)
  const openaiRef = useRef<OpenAIClient | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const responseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef("")
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const apiErrorCountRef = useRef(0)
  const mainContainerRef = useRef<HTMLDivElement>(null)

  const [conversationMessages, setConversationMessages] = useState<any>([])
  const [rollingTranscript, setRollingTranscript] = useState("")
  const [timeUntilNextProcess, setTimeUntilNextProcess] = useState(30000)
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Add a new state variable for simulation mode
  const [isSimulationMode, setIsSimulationMode] = useState(false)

  // Add a state for participant count (simulated)
  const [participantCount, setParticipantCount] = useState(1)

  // Setup scroll event listener to show/hide scroll to top button
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && params.meetingId) {
      fetchMeeting()
    }
  }, [status, params.meetingId])

  const fetchMeeting = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/meetings/${params.meetingId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setMeeting(data.meeting)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching data:", err)
      setLoadingError("Failed to load meeting data. Please try again.")
      setIsLoading(false)
    }
  }

  // Check if meeting is completed by looking for a special message
  const isMeetingCompleted = () => {
    if (!meeting || !meeting.responses) return false

    // Check if responses is an array and contains the completion marker
    if (Array.isArray(meeting.responses)) {
      return meeting.responses.some((msg: any) => msg.role === "system" && msg.content === "MEETING_COMPLETED")
    }

    // If responses is an object with a messages array (older format)
    if (meeting.responses && Array.isArray(meeting.responses.messages)) {
      return meeting.responses.messages.some((msg: any) => msg.role === "system" && msg.content === "MEETING_COMPLETED")
    }

    return false
  }

  // Complete the meeting
  const completeMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.meetingId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creditsUsed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete meeting")
      }

      setIsMeetingCompletedState(true)
      addDebugLog("Meeting completed successfully")
    } catch (error) {
      console.error("Error completing meeting:", error)
      addDebugLog(`Error completing meeting: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // The rest of the component code remains unchanged...

  // Keep all the existing code below this point
  useEffect(() => {
    const handleScroll = () => {
      if (document.documentElement.scrollTop > 300) {
        setShowScrollToTop(true)
      } else {
        setShowScrollToTop(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Manual Reconnect Function
  const handleManualReconnect = () => {
    if (isScreenSharing && connectionStatus !== "connecting") {
      handleStatus("Attempting to manually reconnect...", true)
      startScreenShare()
    }
  }

  // Toggle fallback mode
  const toggleFallbackMode = () => {
    setUseFallbackMode(!useFallbackMode)
    addDebugLog(`Fallback mode ${!useFallbackMode ? "enabled" : "disabled"}`)
  }

  // Export conversation history
  const exportConversation = () => {
    try {
      const conversationText = conversationMessages
        .map((message: any) => {
          const prefix = message.type === "question" ? "Transcript" : "AI Response"
          return `${prefix} (${message.timestamp.toLocaleTimeString()}): ${message.content}\n\n`
        })
        .join("---\n\n")

      const blob = new Blob([conversationText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `interview-transcript-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addDebugLog("Conversation exported successfully")
    } catch (error) {
      addDebugLog(`Error exporting conversation: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Check for API keys
  useEffect(() => {
    // We no longer need to check for the Deepgram API key in the client
    // since we're using a server-side API route
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    setHasOpenAIKey(!!openaiKey)

    // Initialize the transcriber without an API key
    transcriberRef.current = new DeepgramTranscriber()
    transcriberRef.current.setStatusCallback(handleStatus)
    transcriberRef.current.setAudioLevelCallback(setAudioLevel)
    transcriberRef.current.setRollingTranscriptCallback(handleRollingTranscript)

    if (openaiKey) {
      openaiRef.current = new OpenAIClient(openaiKey)
      addDebugLog("OpenAI client initialized")
    }

    return () => {
      stopEverything()
    }
  }, [])

  // Update video element when screen is shared
  useEffect(() => {
    if (selectedScreen && videoRef.current) {
      videoRef.current.srcObject = selectedScreen
    }
  }, [selectedScreen])

  // Handle status updates
  const handleStatus = (message: string, isError = false) => {
    console.log(`[Status] ${message}`)
    setStatusMessage(message)

    // Add to debug logs
    setDebugLogs((prev) => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`]
      // Keep only the last 50 logs
      return newLogs.slice(-50)
    })

    // Update connection status based on message content
    if (message.includes("Connected to Deepgram")) {
      setConnectionStatus("connected")
      setIsReconnecting(false)
      setError(null)
    } else if (message.includes("Connecting to Deepgram")) {
      setConnectionStatus("connecting")
    } else if (message.includes("Deepgram connection closed") || message.includes("Error connecting to Deepgram")) {
      setConnectionStatus("disconnected")

      // If we're reconnecting, don't show an error
      if (!isReconnecting) {
        setError(message)
      }
    } else if (message.includes("Attempting to reconnect")) {
      setConnectionStatus("connecting")
      setIsReconnecting(true)
      setError(null) // Clear error during reconnection attempts
    } else if (message.includes("Maximum reconnection attempts reached")) {
      setConnectionStatus("error")
      setIsReconnecting(false)
      setError(message)
    } else if (message.includes("Received transcript")) {
      // Clear error if we're receiving transcripts
      setError(null)
    }

    if (isError && !message.includes("Attempting to reconnect")) {
      setError(message)
    }
  }

  // Handle transcript updates (real-time display)
  const handleTranscript = (text: string) => {
    // If we receive a transcript, we're definitely connected
    if (connectionStatus !== "connected") {
      setConnectionStatus("connected")
      setError(null)
    }

    if (text && typeof text === "string") {
      setTranscript(text)
      lastTranscriptRef.current = text
    }
  }

  // Update meeting with new transcript and response
  const updateMeeting = async (transcript: string, response: string) => {
    try {
      const updatedCreditsUsed = creditsUsed + 1
      setCreditsUsed(updatedCreditsUsed)

      const response = await fetch(`/api/meetings/${params.meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          responses: conversationMessages,
          creditsUsed: updatedCreditsUsed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update meeting")
      }

      addDebugLog("Meeting updated with new transcript and response")
    } catch (error) {
      console.error("Error updating meeting:", error)
      addDebugLog(`Error updating meeting: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Handle the rolling transcript (every 30 seconds)
  const handleRollingTranscript = (text: string) => {
    setRollingTranscript(text)
    setLastProcessedTime(new Date())

    // Create a new question message
    const questionId = generateUUID()
    const newQuestion: any = {
      id: questionId,
      type: "question",
      content: text,
      timestamp: new Date(),
    }

    // Add the question to the conversation
    setConversationMessages((prev) => [...prev, newQuestion])

    // Create a placeholder for the answer
    const answerId = generateUUID()
    const placeholderAnswer: any = {
      id: answerId,
      type: "answer",
      content: "",
      timestamp: new Date(),
      isProcessing: true,
    }

    // Add the placeholder to the conversation
    setConversationMessages((prev) => [...prev, placeholderAnswer])

    // Generate the answer with conversation context
    if (openaiRef.current) {
      // Build conversation history from previous messages
      const conversationHistory = conversationMessages
        .slice(-10) // Use last 10 messages for context
        .map((msg: any) => ({
          role: msg.type === "question" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        }))

      // Generate response with context
      openaiRef.current
        .generateResponseWithContext(text, conversationHistory, (chunk) => {
          // Update the answer as it's being generated
          setConversationMessages((prev) =>
            prev.map((msg: any) => (msg.id === answerId ? { ...msg, content: chunk, isProcessing: false } : msg)),
          )
        })
        .then((fullResponse) => {
          // Update the meeting in the database
          updateMeeting(text, fullResponse)
        })
        .catch((error) => {
          console.error("Error generating response:", error)
          setConversationMessages((prev) =>
            prev.map((msg: any) =>
              msg.id === answerId
                ? {
                    ...msg,
                    content: "Sorry, there was an error generating a response. Please try again.",
                    isProcessing: false,
                  }
                : msg,
            ),
          )
        })
    }

    addDebugLog(`Processed rolling transcript: "${text.substring(0, 50)}..."`)
  }

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      setIsStartingScreenShare(true)
      setError(null)
      setConnectionStatus("disconnected")
      setTranscript("")
      setRollingTranscript("")

      // Try to request screen sharing with audio
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        setSelectedScreen(stream)
        setIsScreenSharing(true)
        setIsSimulationMode(false)

        // Listen for the end of screen sharing
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          stopScreenShare()
        })

        // Check if we have audio tracks
        if (stream.getAudioTracks().length === 0) {
          setError("No audio detected. Make sure you checked 'Share audio' in the dialog.")
          setIsStartingScreenShare(false)
          return
        }

        // Log audio track details
        stream.getAudioTracks().forEach((track, i) => {
          console.log(`Audio track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
          addDebugLog(`Audio track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
        })

        // Start transcription
        startTranscription(stream)

        // Simulate 2-3 participants joining
        const randomParticipants = Math.floor(Math.random() * 2) + 2
        setParticipantCount(randomParticipants)
      } catch (error) {
        console.error("Screen sharing permission error:", error)

        // Check if this is a permission policy error
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes("permissions policy") || errorMessage.includes("Permission denied")) {
          addDebugLog("Screen sharing permission denied. Using simulation mode.")

          // Enable fallback/simulation mode
          setUseFallbackMode(true)

          // Create a simulated screen sharing session
          startSimulatedSession()
        } else {
          // For other errors, show the error message
          setError(`Could not start screen sharing: ${errorMessage}`)
          setIsStartingScreenShare(false)
        }
      }
    } catch (error) {
      console.error("Error in startScreenShare:", error)
      setError(`Error starting screen share: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsStartingScreenShare(false)
    }
  }

  // Add a new function to simulate a screen sharing session
  const startSimulatedSession = () => {
    addDebugLog("Starting simulated interview session")

    // Set UI state as if we're screen sharing
    setIsScreenSharing(true)
    setConnectionStatus("connected")
    setIsSimulationMode(true)
    setIsStartingScreenShare(false)

    // Simulate 2-4 participants
    const randomParticipants = Math.floor(Math.random() * 3) + 2
    setParticipantCount(randomParticipants)

    // Create a simulated transcript after a short delay
    setTimeout(() => {
      const simulatedTranscript = "Tell me about a time when you had to deal with a difficult team member or colleague."
      handleTranscript(simulatedTranscript)

      // Process the simulated transcript
      handleRollingTranscript(simulatedTranscript)

      addDebugLog("Simulated transcript generated")
    }, 2000)

    // Set up an interval to simulate more transcript segments
    const interviewInterval = setInterval(() => {
      // Only add a new transcript if we're still in simulation mode
      if (isScreenSharing && isSimulationMode) {
        const simulatedTranscripts = [
          "How do you prioritize your work when you have multiple deadlines?",
          "Can you describe a situation where you had to learn a new technology quickly?",
          "What's your approach to solving complex problems?",
          "Tell me about a project where you had to work with limited resources.",
          "How do you handle feedback, especially when it's critical?",
          "What strategies do you use to maintain work-life balance?",
          "Describe a situation where you had to make a difficult decision with incomplete information.",
        ]

        const randomTranscript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)]
        handleTranscript(randomTranscript)

        // Process the simulated transcript
        handleRollingTranscript(randomTranscript)

        addDebugLog("New simulated transcript generated")
      } else {
        // Clear the interval if we're no longer in simulation mode
        clearInterval(interviewInterval)
      }
    }, 30000) // New transcript every 30 seconds

    // Store the interval ID so we can clear it when stopping
    processingTimerRef.current = interviewInterval
  }

  // Stop screen sharing
  const stopScreenShare = () => {
    if (selectedScreen) {
      selectedScreen.getTracks().forEach((track) => track.stop())
      setSelectedScreen(null)
    }

    setIsScreenSharing(false)
    setIsSimulationMode(false)
    setParticipantCount(1)
    stopTranscription()

    // Clear any simulation timers
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current)
      processingTimerRef.current = null
    }

    // Complete the meeting
    completeMeeting()
  }

  // Start transcription
  const startTranscription = async (stream: MediaStream) => {
    if (!transcriberRef.current) {
      setError("Deepgram transcriber not initialized. Please check your API key.")
      return
    }

    try {
      setConnectionStatus("connecting")
      await transcriberRef.current.startWithStream(stream, handleTranscript)
      setIsTranscribing(true)

      addDebugLog("Transcription started successfully")
    } catch (error) {
      console.error("Error starting transcription:", error)
      setError(`Error starting transcription: ${error instanceof Error ? error.message : String(error)}`)
      setConnectionStatus("error")
    }
  }

  // Stop transcription
  const stopTranscription = () => {
    if (transcriberRef.current) {
      transcriberRef.current.stop()
    }

    setIsTranscribing(false)
    setConnectionStatus("disconnected")

    // Clear any pending timers
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current)
      responseTimerRef.current = null
    }

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
  }

  // Stop everything
  const stopEverything = () => {
    stopScreenShare()
    stopTranscription()

    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current)
      responseTimerRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current)
      processingTimeoutRef.current = null
    }
  }

  // Add debug log
  const addDebugLog = (message: string) => {
    setDebugLogs((prev) => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`]
      return newLogs.slice(-50)
    })
  }

  // Get connection status badge
  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case "connecting":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {isReconnecting ? "Reconnecting..." : "Connecting..."}
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Connection Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 hover:bg-gray-200">
            <span className="h-2 w-2 rounded-full bg-gray-400 mr-1 inline-block"></span>
            Disconnected
          </Badge>
        )
    }
  }

  // Get audio level indicator
  const getAudioLevelIndicator = () => {
    if (!isTranscribing) {
      return (
        <div className="flex items-center text-gray-400">
          <VolumeX className="h-4 w-4 mr-1" />
          <span className="text-xs">No audio</span>
        </div>
      )
    }

    // Create a visual indicator based on audio level
    const bars = 5
    const activeBars = Math.ceil((audioLevel / 100) * bars)

    return (
      <div className="flex items-center">
        <Volume2 className={`h-4 w-4 mr-1 ${audioLevel > 10 ? "text-emerald-500" : "text-gray-400"}`} />
        <div className="flex space-x-1">
          {Array.from({ length: bars }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${i < activeBars ? "bg-emerald-500" : "bg-gray-300"}`}
              style={{
                height: `${(i + 1) * 3}px`,
                opacity: i < activeBars ? 1 : 0.3,
                transition: "all 0.1s ease-in-out",
              }}
            />
          ))}
        </div>
        <span className="text-xs ml-1">{audioLevel > 0 ? `${audioLevel}%` : "Silent"}</span>
      </div>
    )
  }

  useEffect(() => {
    if (isTranscribing) {
      const timer = setInterval(() => {
        if (transcriberRef.current) {
          setTimeUntilNextProcess(transcriberRef.current.getTimeUntilNextProcess())
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isTranscribing])

  const handleCopyMessage = (message: any) => {
    navigator.clipboard
      .writeText(message.content)
      .then(() => {
        addDebugLog(`Message copied to clipboard: ${message.id}`)
      })
      .catch((err) => {
        addDebugLog(`Error copying to clipboard: ${err}`)
      })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen  to-indigo-50/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <LoadingSpinner size="lg" text="Loading interview session..." />
          <p className="mt-4 text-muted-foreground animate-pulse">Preparing your interview environment...</p>
        </motion.div>
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50/50 to-indigo-50/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Alert variant="destructive" className="max-w-md shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Meeting</AlertTitle>
            <AlertDescription>{loadingError}</AlertDescription>
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </div>
          </Alert>
        </motion.div>
      </div>
    )
  }

  if (isMeetingCompleted()) {
    return <MeetingCompleted meetingId={params.meetingId} />
  }

  return (
    <div
      ref={mainContainerRef}
      className="min-h-screen via-white to-indigo-50/40 p-4 md:p-8"
    >
      <motion.div className="max-w-6xl mx-auto" initial="hidden" animate="visible" variants={fadeIn}>
        <header className="mb-8">
          <motion.div
            className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
                  <div className="relative bg-gradient-to-br from-primary to-purple-600 rounded-full p-2">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-primary to-purple-600 bg-clip-text text-transparent ml-3">
                  {meeting?.title || "Interview Session"}
                </h1>
              </div>
              <p className="text-gray-600 ml-1 mt-1.5">
                {meeting?.description || "Transcribe your interview and get AI-powered responses"}
              </p>
            </div>

            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={useFallbackMode ? "default" : "outline"}
                      size="sm"
                      onClick={toggleFallbackMode}
                      className={useFallbackMode ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                    >
                      {useFallbackMode ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          Simulation Mode
                        </>
                      ) : (
                        "Enable Simulation"
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {useFallbackMode
                      ? "Currently running in simulation mode with auto-generated questions"
                      : "Use simulation mode when screen sharing is not available"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center"
              >
                <Settings className="h-4 w-4 mr-1.5" />
                Settings
                {showAdvancedSettings ? (
                  <ChevronDown className="h-3 w-3 ml-1.5" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-1.5" />
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
                <Info className="h-4 w-4 mr-1.5" />
                {showDebugInfo ? "Hide Debug" : "Show Debug"}
              </Button>

              {conversationMessages.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportConversation} className="text-primary">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Export Transcript
                </Button>
              )}
            </motion.div>
          </motion.div>
        </header>

        <AnimatePresence>
          {/* Advanced Settings Panel */}
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-primary" />
                  Advanced Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showProgress"
                      checked={showTranscriptProgress}
                      onCheckedChange={(checked) => setShowTranscriptProgress(checked as boolean)}
                    />
                    <label
                      htmlFor="showProgress"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show transcript progress
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Key Warnings */}
        <AnimatePresence>
          {!hasOpenAIKey && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 space-y-2"
            >
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start shadow-md">
                <div className="bg-amber-200/50 rounded-full p-1.5 mt-0.5 mr-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-800">Missing OpenAI API Key</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Add OPENAI_API_KEY to your environment variables to enable AI-powered responses.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Alert variant="destructive" className="border-rose-200 bg-rose-50 shadow-md rounded-xl">
                <div className="flex">
                  <div className="bg-rose-100 rounded-full p-1 mt-0.5 mr-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  </div>
                  <div>
                    <AlertTitle className="text-rose-800 font-semibold">Error</AlertTitle>
                    <AlertDescription className="text-rose-700">
                      {error}
                      {error.includes("Deepgram connection closed") && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleManualReconnect}
                            className="bg-white hover:bg-gray-50"
                            disabled={!isScreenSharing || connectionStatus === "connecting"}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reconnect
                          </Button>
                        </div>
                      )}
                      {error.includes("OpenAI API error") && !useFallbackMode && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFallbackMode}
                            className="bg-white hover:bg-gray-50"
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Enable Simulation Mode
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Debug Info */}
        <AnimatePresence>
          {showDebugInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-gray-900 text-gray-200 rounded-xl p-4 text-xs font-mono shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Debug Information</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugLogs([])}
                    className="h-6 text-xs text-gray-400"
                  >
                    Clear
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="py-1 border-b border-gray-700 last:border-b-0">
                      {log}
                    </div>
                  ))}
                  {debugLogs.length === 0 && <div className="text-gray-500">No logs yet</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Screen Sharing */}
          <div className="lg:col-span-4">
            {/* Meeting Status Card */}
            <motion.div variants={statusCardVariants} animate={isScreenSharing ? "active" : "idle"}>
              <Card className="overflow-hidden border border-purple-100/50 shadow-lg bg-white rounded-xl">
                <CardHeader className="bg-gradient-to-br from-primary to-purple-600 text-white pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      {isSimulationMode ? (
                        <>
                          <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                          Simulation Mode
                        </>
                      ) : (
                        <>
                          <Rocket className="h-5 w-5 mr-2" />
                          Interview Status
                        </>
                      )}
                    </span>
                    {isTranscribing && getConnectionStatusBadge()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {!isScreenSharing ? (
                    <motion.div
                      className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative mb-4">
                        <div className="absolute -inset-1 rounded-full bg-primary/10 blur-md animate-pulse"></div>
                        <div className="relative bg-gradient-to-br from-primary/90 to-purple-600/90 rounded-full p-3">
                          <Share2 className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Start Your Interview</h3>
                      <p className="text-gray-500 text-sm mb-5">
                        Share a screen with audio to start transcribing your interview.
                      </p>
                      <Button
                        onClick={startScreenShare}
                        className="bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-md transition-all hover:shadow-xl"
                        disabled={isStartingScreenShare}
                      >
                        {isStartingScreenShare ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Share2 className="mr-2 h-4 w-4" /> Start Interview
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {isSimulationMode ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                        >
                          <div className="flex items-center text-amber-800 mb-2">
                            <div className="bg-amber-100 rounded-full p-1 mr-2">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="font-medium">Simulation Mode Active</h3>
                          </div>
                          <p className="text-sm text-amber-700">
                            Screen sharing is not available in this environment. Running in simulation mode with
                            auto-generated interview questions.
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-md"
                        >
                          <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                            Preview
                          </div>
                        </motion.div>
                      )}

                      {/* Meeting Info */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-primary/10 rounded-full p-1 mr-2">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">Participants</span>
                          </div>
                          <Badge variant="outline" className="bg-primary/5 text-primary">
                            {participantCount}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-primary/10 rounded-full p-1 mr-2">
                              <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">Duration</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {lastProcessedTime
                              ? `Started at ${lastProcessedTime.toLocaleTimeString()}`
                              : "Just started"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-primary/10 rounded-full p-1 mr-2">
                              <Mic className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">Audio</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">{getAudioLevelIndicator()}</div>
                        </div>
                      </motion.div>

                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          onClick={stopScreenShare}
                          className="bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-md"
                        >
                          <StopCircle className="mr-2 h-4 w-4" />{" "}
                          {isSimulationMode ? "End Simulation" : "End Interview"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Live Transcript Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6"
            >
              <Card className="overflow-hidden border border-emerald-100/50 shadow-lg bg-white rounded-xl">
                <CardHeader className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mic className="mr-2 h-5 w-5" />
                      Live Transcript
                    </div>
                    {connectionStatus === "connected" && isTranscribing && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0">
                        <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                        Live
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="bg-white border border-gray-100 rounded-xl p-4 min-h-[150px] max-h-[300px] overflow-y-auto shadow-inner">
                    {transcript ? (
                      <div>
                        <p className="text-gray-800">{transcript}</p>
                        {showTranscriptProgress && (
                          <div className="mt-3 text-xs text-gray-500">
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Next update in {Math.floor(timeUntilNextProcess / 1000)}s
                              </span>
                            </div>
                            <Progress
                              value={Math.min(100, 100 - (timeUntilNextProcess / 30000) * 100)}
                              className="h-1.5 bg-emerald-100"
                            />
                          </div>
                        )}
                      </div>
                    ) : isTranscribing ? (
                      connectionStatus === "connecting" ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="bg-primary/10 p-2 rounded-full mr-2">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          </div>
                          <p className="text-gray-500">Connecting to Deepgram...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="relative mb-3">
                            <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-md animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-emerald-500/80 to-teal-500/80 rounded-full p-2">
                              <Mic className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <p className="text-gray-400 italic">Listening for speech...</p>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-gray-100 rounded-full p-3 mb-3">
                          <Mic className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-400 italic">Start an interview to see transcription</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 px-5">
                  <div className="text-xs text-gray-500 flex items-center">
                    <Settings className="h-3 w-3 mr-1" />
                    Powered by Deepgram
                  </div>
                  {connectionStatus === "disconnected" && isScreenSharing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManualReconnect}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Reconnect
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Conversation Display */}
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="h-full">
              <ConversationDisplay
                meetingId={params.meetingId}
                messages={conversationMessages}
                onCopyMessage={handleCopyMessage}
                isTranscribing={isTranscribing}
                currentTranscript={transcript}
                timeUntilNextProcess={timeUntilNextProcess}
                isSimulationMode={isSimulationMode}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              className="rounded-full w-12 h-12 shadow-lg bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all"
              onClick={scrollToTop}
              aria-label="Scroll to top"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}