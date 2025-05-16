"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DeepgramTranscriber } from "@/utils/deepgram-transcriber"
import { OpenAIClient } from "@/utils/openai-client"
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
  Download,
  Users,
  Clock,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { generateUUID } from "@/utils/uuid"
import  LoadingSpinner  from "@/components/ui/loader-spinner"

// Add import for the CSS at the top
import "@/app/conversation.css"
import { useSession } from "next-auth/react"
import ConversationDisplay from "@/components/meeting/conversation-display"

export default function CopilotPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // State for user data
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
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

    if (status === "authenticated") {
      fetchUserData()
    }
  }, [status])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUser(data.user)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching user data:", err)
      setLoadingError("Failed to load user data. Please try again.")
      setIsLoading(false)
    }
  }

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
          // No need to update a meeting in the database
          console.log("Response generated successfully")
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
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case "connecting":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            {isReconnecting ? "Reconnecting..." : "Connecting..."}
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600">
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

  // Check for API keys
  useEffect(() => {
    // We no longer need to check for the Deepgram API key in the client
    // since we're using a server-side API route
    const openaiKey = "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"

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading interview copilot..." />
      </div>
    )
  }

  if (loadingError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div
      ref={mainContainerRef}
      className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center">
              <Rocket className="h-8 w-8 text-indigo-600 mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Interview Hacker
              </h1>
            </div>
            <p className="text-gray-600">Transcribe your interview and get AI-powered responses in real-time</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={useFallbackMode ? "default" : "outline"}
              size="sm"
              onClick={toggleFallbackMode}
              className={useFallbackMode ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {useFallbackMode ? "Fallback Mode: ON" : "Fallback Mode: OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
              {showAdvancedSettings ? (
                <ChevronDown className="h-3 w-3 ml-1" />
              ) : (
                <ChevronRight className="h-3 w-3 ml-1" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
              <Info className="h-4 w-4 mr-1" />
              {showDebugInfo ? "Hide Debug" : "Show Debug"}
            </Button>
            {conversationMessages.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportConversation}>
                <Download className="h-4 w-4 mr-1" />
                Export Transcript
              </Button>
            )}
          </div>
        </header>

        {/* Advanced Settings Panel */}
        {showAdvancedSettings && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-indigo-500" />
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
        )}

        {/* API Key Warnings */}
        {!hasOpenAIKey && (
          <div className="mb-6 space-y-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Missing OpenAI API Key</p>
                <p className="text-sm text-amber-700">Add OPENAI_API_KEY to your environment variables.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 border-rose-200 bg-rose-50">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <AlertTitle className="text-rose-800">Error</AlertTitle>
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
                    Enable Fallback Mode
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Info */}
        {showDebugInfo && (
          <div className="mb-6 bg-gray-900 text-gray-200 rounded-xl p-4 text-xs font-mono shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Debug Information</h3>
              <Button variant="ghost" size="sm" onClick={() => setDebugLogs([])} className="h-6 text-xs text-gray-400">
                Clear
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {debugLogs.map((log, i) => (
                <div key={i} className="py-1 border-b border-gray-700">
                  {log}
                </div>
              ))}
              {debugLogs.length === 0 && <div className="text-gray-500">No logs yet</div>}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Screen Sharing */}
          <div className="lg:col-span-4">
            {/* Meeting Status Card */}
            <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>{isSimulationMode ? "Simulation Mode" : "Interview Status"}</span>
                  {isTranscribing && getConnectionStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {!isScreenSharing ? (
                  <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Share2 className="h-12 w-12 text-indigo-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Start Your Interview</h3>
                    <p className="text-gray-500 text-sm mb-5">
                      Share a screen with audio to start transcribing your interview.
                    </p>
                    <Button
                      onClick={startScreenShare}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md transition-all"
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isSimulationMode ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center text-amber-800 mb-2">
                          <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                          <h3 className="font-medium">Simulation Mode Active</h3>
                        </div>
                        <p className="text-sm text-amber-700">
                          Screen sharing is not available in this environment. Running in simulation mode with
                          auto-generated interview questions.
                        </p>
                      </div>
                    ) : (
                      <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-md">
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-contain" />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                          Preview
                        </div>
                      </div>
                    )}

                    {/* Meeting Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-indigo-500 mr-2" />
                          <span className="font-medium text-sm">Participants</span>
                        </div>
                        <Badge variant="outline">{participantCount}</Badge>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-indigo-500 mr-2" />
                          <span className="font-medium text-sm">Duration</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {lastProcessedTime ? `Started at ${lastProcessedTime.toLocaleTimeString()}` : "Just started"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mic className="h-4 w-4 text-indigo-500 mr-2" />
                          <span className="font-medium text-sm">Audio</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">{getAudioLevelIndicator()}</div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={stopScreenShare}
                        className="bg-rose-500 hover:bg-rose-600"
                      >
                        <StopCircle className="mr-2 h-4 w-4" /> {isSimulationMode ? "End Simulation" : "End Interview"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Transcript Card */}
            <Card className="mt-6 overflow-hidden border-0 shadow-lg bg-white rounded-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
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
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 ease-in-out"
                              style={{
                                width: `${Math.min(100, 100 - (timeUntilNextProcess / 30000) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isTranscribing ? (
                    connectionStatus === "connecting" ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin mr-2" />
                        <p className="text-gray-500">Connecting to Deepgram...</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">Listening for speech...</p>
                    )
                  ) : (
                    <p className="text-gray-400 italic">Start an interview to see transcription</p>
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
          </div>

          {/* Right Column - Conversation Display */}
          <div className="lg:col-span-8">
            <div className="h-full">
              <ConversationDisplay
                meetingId="standalone"
                messages={conversationMessages}
                onCopyMessage={handleCopyMessage}
                isTranscribing={isTranscribing}
                currentTranscript={transcript}
                timeUntilNextProcess={timeUntilNextProcess}
                isSimulationMode={isSimulationMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollToTop && (
        <Button
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 shadow-lg bg-indigo-600 hover:bg-indigo-700 transition-all"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}
