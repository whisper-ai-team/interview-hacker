"use client"

import { useState, useEffect, useRef } from "react"
import { DeepgramTranscriber } from "@/utils/deepgram-transcriber"
import { OpenAIClient } from "@/utils/openai-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Share2,
  StopCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Brain,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  Copy,
  Sparkles,
  Rocket,
  Download,
  Trash2,
  Mic,
  Play,
  Info,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Type for our conversation history
interface ConversationItem {
  id: number
  question: string
  answer: string
  timestamp: Date
  isProcessing?: boolean
}

// Sample questions for simulation mode
const sampleQuestions = [
  "Can you explain your experience with React and Next.js?",
  "How do you handle state management in large applications?",
  "Tell me about a challenging project you worked on and how you overcame obstacles.",
  "What's your approach to responsive design?",
  "How do you ensure your code is maintainable and scalable?",
  "Describe your experience with TypeScript and how it has improved your development workflow.",
  "What testing strategies do you implement in your projects?",
  "How do you stay updated with the latest web development trends?",
]

export default function InterviewHacker() {
  // State for screen sharing
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [selectedScreen, setSelectedScreen] = useState<MediaStream | null>(null)

  // State for transcription
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)

  // State for AI response
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [nextQuestionId, setNextQuestionId] = useState(1)

  // State for errors and status
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("Ready")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">(
    "disconnected",
  )
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [useFallbackMode, setUseFallbackMode] = useState(false)

  // Simulation mode
  const [simulationMode, setSimulationMode] = useState(false)
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const simulationTypingRef = useRef<NodeJS.Timeout | null>(null)
  const [simulationTypingText, setSimulationTypingText] = useState("")
  const [simulationCurrentQuestion, setSimulationCurrentQuestion] = useState("")
  const [simulationQuestionIndex, setSimulationQuestionIndex] = useState(0)

  // Environment detection
  const [isPreviewEnvironment, setIsPreviewEnvironment] = useState(true)

  // API keys
  const [hasDeepgramKey, setHasDeepgramKey] = useState(false)

  // Refs
  const transcriberRef = useRef<DeepgramTranscriber | null>(null)
  const openaiRef = useRef<OpenAIClient | null>(null)
  const conversationEndRef = useRef<HTMLDivElement | null>(null)
  const apiErrorCountRef = useRef(0)
  const currentQuestionIdRef = useRef<number | null>(null)

  // Track processed questions to prevent duplicates
  const processedQuestionsRef = useRef<Set<string>>(new Set())

  // Detect if we're in a preview environment
  useEffect(() => {
    // Check if we're in a preview environment by trying to detect if screen capture is available
    const checkScreenCaptureAvailability = async () => {
      try {
        // Check if navigator.mediaDevices exists
        if (!navigator.mediaDevices) {
          setIsPreviewEnvironment(true)
          addDebugLog("mediaDevices API not available - assuming preview environment")
          return
        }

        // Check if getDisplayMedia is available
        if (!navigator.mediaDevices.getDisplayMedia) {
          setIsPreviewEnvironment(true)
          addDebugLog("getDisplayMedia not available - assuming preview environment")
          return
        }

        // Check permissions policy
        try {
          // This is a simple check that will fail if display-capture is disallowed
          const permissions = await navigator.permissions.query({ name: "camera" as PermissionName })
          if (permissions.state === "denied") {
            setIsPreviewEnvironment(true)
            addDebugLog("Camera permissions denied - assuming preview environment")
            return
          }
        } catch (error) {
          // If we can't query permissions, assume we're in a preview environment
          setIsPreviewEnvironment(true)
          addDebugLog(`Permissions query failed - assuming preview environment: ${error}`)
          return
        }

        // If we get here, we might be in a regular environment
        setIsPreviewEnvironment(false)
        addDebugLog("Not in preview environment - screen sharing might be available")
      } catch (error) {
        // If any error occurs during detection, assume we're in a preview environment
        setIsPreviewEnvironment(true)
        addDebugLog(`Error detecting environment: ${error} - assuming preview environment`)
      }
    }

    checkScreenCaptureAvailability()
  }, [])

  // Load conversation history from session storage on initial load
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem("interviewHackerHistory")
      const savedNextId = sessionStorage.getItem("interviewHackerNextId")

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        // Convert string timestamps back to Date objects
        const processedHistory = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
        setConversations(processedHistory)

        // Add previously processed questions to the set
        processedHistory.forEach((item) => {
          processedQuestionsRef.current.add(item.question)
        })

        addDebugLog(`Loaded ${processedHistory.length} conversation items from session storage`)
      }

      if (savedNextId) {
        setNextQuestionId(Number.parseInt(savedNextId, 10))
      }
    } catch (error) {
      console.error("Error loading from session storage:", error)
      addDebugLog(`Error loading from session storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [])

  // Save conversation history to session storage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem("interviewHackerHistory", JSON.stringify(conversations))
      sessionStorage.setItem("interviewHackerNextId", nextQuestionId.toString())
      addDebugLog(`Saved ${conversations.length} conversation items to session storage`)
    } catch (error) {
      console.error("Error saving to session storage:", error)
      addDebugLog(`Error saving to session storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [conversations, nextQuestionId])

  // Scroll to bottom of conversation when new messages are added
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversations])

  // Toggle fallback mode
  const toggleFallbackMode = () => {
    setUseFallbackMode(!useFallbackMode)
    addDebugLog(`Fallback mode ${!useFallbackMode ? "enabled" : "disabled"}`)
  }

  // Copy response to clipboard
  const copyResponseToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          addDebugLog("Response copied to clipboard")
        })
        .catch((err) => {
          addDebugLog(`Error copying to clipboard: ${err}`)
        })
    }
  }

  // Export conversation history
  const exportHistory = () => {
    try {
      const historyText = conversations
        .map((item) => `Question #${item.id}: ${item.question}\n\nAnswer: ${item.answer}\n\n---\n\n`)
        .join("")

      const blob = new Blob([historyText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `interview-history-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addDebugLog("Conversation history exported successfully")
    } catch (error) {
      addDebugLog(`Error exporting history: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Clear conversation history
  const clearHistory = () => {
    setConversations([])
    setNextQuestionId(1)
    processedQuestionsRef.current.clear()
    sessionStorage.removeItem("interviewHackerHistory")
    sessionStorage.removeItem("interviewHackerNextId")
    addDebugLog("Conversation history cleared")
  }

  // Check for API keys
  useEffect(() => {
    const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY

    setHasDeepgramKey(!!deepgramKey)

    if (deepgramKey) {
      transcriberRef.current = new DeepgramTranscriber(deepgramKey)
      transcriberRef.current.setStatusCallback(handleStatus)
      transcriberRef.current.setAudioLevelCallback(setAudioLevel)
      transcriberRef.current.setProcessedTranscriptCallback(handleProcessedTranscript)
      transcriberRef.current.setContinuousTranscriptCallback(handleContinuousTranscript)
      transcriberRef.current.setWordCountThreshold(3) // Set to 3 words
      transcriberRef.current.setContinuousMode(true) // Enable continuous mode
    }

    // Initialize OpenAI client without API key (will use server API)
    openaiRef.current = new OpenAIClient()
    addDebugLog("OpenAI client initialized")

    return () => {
      stopEverything()
    }
  }, [])

  // Handle status updates
  const handleStatus = (message: string, isError = false) => {
    console.log(`[Status] ${message}`)
    setStatus(message)

    // Add to debug logs
    setDebugLogs((prev) => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()}: ${message}`]
      // Keep only the last 50 logs
      return newLogs.slice(-50)
    })

    // Update connection status based on message content
    if (message.includes("Connected to Deepgram")) {
      setConnectionStatus("connected")
      setError(null)
      setIsListening(true)
    } else if (message.includes("Connecting to Deepgram")) {
      setConnectionStatus("connecting")
    } else if (message.includes("Deepgram connection closed") || message.includes("Error connecting to Deepgram")) {
      setConnectionStatus("disconnected")
      setIsListening(false)
      if (!message.includes("Attempting to reconnect")) {
        setError(message)
      }
    } else if (message.includes("Maximum reconnection attempts reached")) {
      setConnectionStatus("error")
      setIsListening(false)
      setError(message)
    } else if (message.includes("Received transcript")) {
      // Clear error if we're receiving transcripts
      setError(null)
    }

    if (isError && !message.includes("Attempting to reconnect")) {
      setError(message)
    }
  }

  // Handle continuous transcript updates
  const handleContinuousTranscript = (text: string) => {
    setCurrentTranscript(text)

    // If we have an active question, update it
    if (currentQuestionIdRef.current !== null) {
      updateCurrentQuestion(text)
    } else if (text.trim().length >= 3) {
      // Start a new question if we have at least 3 characters
      startNewQuestion(text)
    }
  }

  // Start a new question
  const startNewQuestion = (text: string) => {
    const questionId = nextQuestionId
    currentQuestionIdRef.current = questionId

    // Create a new conversation item
    const newItem: ConversationItem = {
      id: questionId,
      question: text,
      answer: "",
      timestamp: new Date(),
      isProcessing: false,
    }

    // Add to conversations
    setConversations((prev) => [...prev, newItem])

    // Increment the next question ID
    setNextQuestionId((prevId) => prevId + 1)

    addDebugLog(`Started new question #${questionId}: "${text}"`)
  }

  // Update the current question
  const updateCurrentQuestion = (text: string) => {
    if (currentQuestionIdRef.current === null) return

    setConversations((prev) =>
      prev.map((item) => (item.id === currentQuestionIdRef.current ? { ...item, question: text } : item)),
    )
  }

  // Handle processed transcript (when it reaches the word threshold)
  const handleProcessedTranscript = (text: string) => {
    try {
      // Validate the text
      if (!text) {
        addDebugLog("Received empty or null processed transcript")
        return
      }

      // Ensure text is a string
      const safeText = String(text).trim()

      if (safeText === "") {
        addDebugLog("Received empty processed transcript after trimming")
        return
      }

      // Check if we've already processed this exact question to prevent duplicates
      if (processedQuestionsRef.current.has(safeText)) {
        addDebugLog(`Skipping duplicate question: "${safeText}"`)
        return
      }

      // Add to processed questions set
      processedQuestionsRef.current.add(safeText)

      addDebugLog(`Processing transcript: "${safeText}"`)

      // If we have an active question, finalize it and generate a response
      if (currentQuestionIdRef.current !== null) {
        const questionId = currentQuestionIdRef.current

        // Update the question one last time
        setConversations((prev) =>
          prev.map((item) => (item.id === questionId ? { ...item, question: safeText, isProcessing: true } : item)),
        )

        addDebugLog(`Finalized question #${questionId}: "${safeText}" - Generating response...`)

        // Generate response
        generateResponse(safeText, questionId)

        // Reset current question
        currentQuestionIdRef.current = null
        setCurrentTranscript("")
      } else {
        // This shouldn't normally happen, but handle it just in case
        addDebugLog(`No active question ID, creating new question for: "${safeText}"`)
        startNewQuestion(safeText)

        // Use the newly created question ID (nextQuestionId - 1)
        const newQuestionId = nextQuestionId - 1
        addDebugLog(`Created new question #${newQuestionId}, generating response...`)

        generateResponse(safeText, newQuestionId)
      }
    } catch (error) {
      setError(`Error processing transcript: ${error instanceof Error ? error.message : String(error)}`)
      addDebugLog(`Error in handleProcessedTranscript: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Generate response from OpenAI
  const generateResponse = async (question: string, questionId: number) => {
    if (!openaiRef.current) {
      const errorMsg = "OpenAI client not initialized."
      setError(errorMsg)
      addDebugLog(errorMsg)
      return
    }

    try {
      // Validate question
      if (!question) {
        const errorMsg = "Cannot generate response: Question is undefined or null"
        setError(errorMsg)
        addDebugLog(errorMsg)
        return
      }

      // Ensure question is a string
      const safeQuestion = String(question).trim()

      if (safeQuestion === "") {
        const errorMsg = "Cannot generate response: Question is empty"
        setError(errorMsg)
        addDebugLog(errorMsg)
        return
      }

      setIsGenerating(true)
      addDebugLog(`Generating response for question #${questionId}: "${safeQuestion}"`)

      // Mark the question as processing
      setConversations((prev) => prev.map((item) => (item.id === questionId ? { ...item, isProcessing: true } : item)))

      let fullResponse = ""

      // Use fallback mode if enabled or if we've had too many API errors
      if (useFallbackMode || apiErrorCountRef.current >= 3) {
        addDebugLog(
          `Using fallback mode for response generation (${useFallbackMode ? "explicitly enabled" : "due to API errors"})`,
        )

        try {
          fullResponse = await openaiRef.current.generateFallbackResponse(safeQuestion, (chunk) => {
            // Update the answer in the conversations array
            setConversations((prev) =>
              prev.map((item) => (item.id === questionId ? { ...item, answer: chunk, isProcessing: true } : item)),
            )
          })

          // Mark as not processing anymore
          setConversations((prev) =>
            prev.map((item) => (item.id === questionId ? { ...item, isProcessing: false } : item)),
          )

          addDebugLog(`Fallback response generated successfully (${fullResponse.length} chars)`)
        } catch (error) {
          const errorMsg = `Error generating fallback response: ${error instanceof Error ? error.message : String(error)}`
          setError(errorMsg)
          addDebugLog(errorMsg)

          // Mark as not processing anymore, but with error
          setConversations((prev) =>
            prev.map((item) =>
              item.id === questionId
                ? {
                    ...item,
                    isProcessing: false,
                    answer: "Sorry, I encountered an error generating a response. Please try again.",
                  }
                : item,
            ),
          )
        }
      } else {
        try {
          addDebugLog(`Calling OpenAI API for response to question #${questionId}`)

          fullResponse = await openaiRef.current.generateResponse(safeQuestion, (chunk) => {
            // Update the answer in the conversations array
            setConversations((prev) =>
              prev.map((item) => (item.id === questionId ? { ...item, answer: chunk, isProcessing: true } : item)),
            )
          })

          // Mark as not processing anymore
          setConversations((prev) =>
            prev.map((item) => (item.id === questionId ? { ...item, isProcessing: false } : item)),
          )

          addDebugLog(`OpenAI response generated successfully (${fullResponse.length} chars)`)

          // If the response contains an error message, increment the error count
          if (fullResponse.includes("Error") || fullResponse.includes("API error")) {
            apiErrorCountRef.current += 1
            addDebugLog(`API error detected in response. Error count: ${apiErrorCountRef.current}`)

            // If we've had too many errors, suggest fallback mode
            if (apiErrorCountRef.current >= 3 && !useFallbackMode) {
              setError("Multiple API errors detected. Consider enabling fallback mode.")
            }
          } else {
            // Reset error count on successful response
            apiErrorCountRef.current = 0
          }
        } catch (error) {
          apiErrorCountRef.current += 1
          const errorMsg = `Error with OpenAI API: ${error instanceof Error ? error.message : String(error)}`
          addDebugLog(`${errorMsg}. API error count: ${apiErrorCountRef.current}`)

          // If we've had an error, try the fallback
          addDebugLog(`Using fallback due to API error`)

          try {
            fullResponse = await openaiRef.current.generateFallbackResponse(safeQuestion, (chunk) => {
              // Update the answer in the conversations array
              setConversations((prev) =>
                prev.map((item) => (item.id === questionId ? { ...item, answer: chunk, isProcessing: true } : item)),
              )
            })

            addDebugLog(`Fallback response generated successfully after API error (${fullResponse.length} chars)`)
          } catch (fallbackError) {
            const fallbackErrorMsg = `Error generating fallback response: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
            setError(fallbackErrorMsg)
            addDebugLog(fallbackErrorMsg)

            // Set a simple error message as the answer
            fullResponse = "Sorry, I encountered an error generating a response. Please try again."
            setConversations((prev) =>
              prev.map((item) =>
                item.id === questionId ? { ...item, answer: fullResponse, isProcessing: false } : item,
              ),
            )
          }
        }
      }
    } catch (error) {
      console.error("Error generating response:", error)
      const errorMsg = `Error generating response: ${error instanceof Error ? error.message : String(error)}`
      setError(errorMsg)
      addDebugLog(errorMsg)

      // Set a simple error message as the answer
      setConversations((prev) =>
        prev.map((item) =>
          item.id === questionId
            ? {
                ...item,
                answer: "Sorry, I encountered an error generating a response. Please try again.",
                isProcessing: false,
              }
            : item,
        ),
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      setError(null)
      setConnectionStatus("disconnected")

      // If we're in a preview environment, go straight to simulation mode
      if (isPreviewEnvironment) {
        addDebugLog("In preview environment - automatically using simulation mode")
        startSimulationMode()
        return
      }

      // Only try to use getDisplayMedia if we're not in a preview environment
      try {
        // Request screen sharing with audio
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })

        setSelectedScreen(stream)
        setIsScreenSharing(true)
        setSimulationMode(false)

        // Listen for the end of screen sharing
        stream.getVideoTracks()[0].addEventListener("ended", () => {
          stopScreenShare()
        })

        // Check if we have audio tracks
        if (stream.getAudioTracks().length === 0) {
          setError("No audio detected. Make sure you checked 'Share audio' in the dialog.")
          return
        }

        // Log audio track details
        stream.getAudioTracks().forEach((track, i) => {
          console.log(`Audio track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
          addDebugLog(`Audio track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`)
        })

        // Start transcription
        startTranscription(stream)
      } catch (error) {
        console.error("Error with getDisplayMedia:", error)
        addDebugLog(`Screen sharing not available: ${error instanceof Error ? error.message : String(error)}`)

        // Fall back to simulation mode
        startSimulationMode()
      }
    } catch (error) {
      console.error("Error starting screen share:", error)
      setError(`Could not start screen sharing: ${error instanceof Error ? error.message : String(error)}`)

      // Fall back to simulation mode
      startSimulationMode()
    }
  }

  // Start simulation mode
  const startSimulationMode = () => {
    setSimulationMode(true)
    setIsScreenSharing(true)
    setConnectionStatus("connected")
    setIsListening(true)
    setError(null) // Clear any existing errors
    addDebugLog("Starting simulation mode")

    // Clear any existing simulation intervals
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    if (simulationTypingRef.current) {
      clearInterval(simulationTypingRef.current)
      simulationTypingRef.current = null
    }

    // Reset simulation state
    setSimulationTypingText("")
    setCurrentTranscript("")
    currentQuestionIdRef.current = null // Reset any active question

    // Start with a random question index for variety
    setSimulationQuestionIndex(Math.floor(Math.random() * sampleQuestions.length))

    // Add a small delay before starting the first question
    setTimeout(() => {
      addDebugLog("Starting first simulated question")
      simulateQuestion()
    }, 500)
  }

  // Simulate a question being asked
  const simulateQuestion = () => {
    // Get the current question
    const question = sampleQuestions[simulationQuestionIndex]

    // Check if we've already processed this question to prevent duplicates
    if (processedQuestionsRef.current.has(question)) {
      addDebugLog(`Skipping duplicate simulated question: "${question}". Moving to next question.`)
      setSimulationQuestionIndex((prev) => (prev + 1) % sampleQuestions.length)
      setTimeout(() => simulateQuestion(), 100) // Try the next question immediately
      return
    }

    setSimulationCurrentQuestion(question)
    addDebugLog(`Simulating question: "${question}"`)

    // Reset typing text
    setSimulationTypingText("")
    setCurrentTranscript("")

    // Make sure we start with a fresh question (no active question ID)
    currentQuestionIdRef.current = null

    // Simulate typing the question
    let charIndex = 0
    simulationTypingRef.current = setInterval(() => {
      if (charIndex <= question.length) {
        const partialQuestion = question.substring(0, charIndex)
        setSimulationTypingText(partialQuestion)

        // Update the current transcript directly
        setCurrentTranscript(partialQuestion)

        // Only call handleContinuousTranscript once when we reach a sufficient length
        // to avoid creating multiple conversation items
        if (charIndex === Math.min(10, question.length) && !currentQuestionIdRef.current) {
          handleContinuousTranscript(partialQuestion)
        }

        charIndex++
      } else {
        // Finished typing the question
        if (simulationTypingRef.current) {
          clearInterval(simulationTypingRef.current)
          simulationTypingRef.current = null
        }

        addDebugLog(`Finished typing question, processing: "${question}"`)

        // Only process if we haven't already processed this exact question
        if (!processedQuestionsRef.current.has(question)) {
          // Process the complete question
          handleProcessedTranscript(question)
        }

        // Move to the next question index
        setSimulationQuestionIndex((prev) => (prev + 1) % sampleQuestions.length)

        // Schedule the next question after a delay
        simulationIntervalRef.current = setTimeout(() => {
          if (simulationMode) {
            simulateQuestion()
          }
        }, 15000) // Wait 15 seconds before asking the next question (increased from 10)
      }
    }, 100) // Type a character every 100ms
  }

  // Stop screen sharing
  const stopScreenShare = () => {
    // Stop actual screen sharing if active
    if (selectedScreen) {
      selectedScreen.getTracks().forEach((track) => track.stop())
      setSelectedScreen(null)
    }

    // Stop simulation mode if active
    if (simulationMode) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current)
        simulationIntervalRef.current = null
      }
      if (simulationTypingRef.current) {
        clearInterval(simulationTypingRef.current)
        simulationTypingRef.current = null
      }
      setSimulationMode(false)
      setSimulationTypingText("")
    }

    setIsScreenSharing(false)
    stopTranscription()
  }

  // Start transcription
  const startTranscription = async (stream: MediaStream) => {
    if (!transcriberRef.current) {
      setError("Deepgram transcriber not initialized. Please check your API key.")
      return
    }

    try {
      setConnectionStatus("connecting")
      await transcriberRef.current.startWithStream(stream)
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
    setIsListening(false)
    setCurrentTranscript("")
    currentQuestionIdRef.current = null
  }

  // Stop everything
  const stopEverything = () => {
    stopScreenShare()
    stopTranscription()
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
            {simulationMode ? "Simulation Active" : "Connected"}
          </Badge>
        )
      case "connecting":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Connecting...
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

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Rocket className="h-6 w-6 text-indigo-600 mr-2" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Interview Hacker
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-gray-500">Fallback Mode</span>
            <Switch checked={useFallbackMode} onCheckedChange={toggleFallbackMode} />
          </div>

          {isScreenSharing && getConnectionStatusBadge()}

          {isScreenSharing ? (
            <Button variant="destructive" size="sm" onClick={stopScreenShare} className="bg-rose-500 hover:bg-rose-600">
              <StopCircle className="h-4 w-4 mr-1" /> Stop
            </Button>
          ) : (
            <>
              {isPreviewEnvironment ? (
                <Button onClick={startSimulationMode} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Play className="mr-2 h-4 w-4" /> Start Simulation
                </Button>
              ) : (
                <>
                  <Button
                    onClick={startScreenShare}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                  >
                    <Share2 className="mr-2 h-4 w-4" /> Share Screen
                  </Button>
                  <Button onClick={startSimulationMode} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Play className="mr-2 h-4 w-4" /> Simulation
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Preview Environment Notice */}
      {isPreviewEnvironment && (
        <div className="px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start text-sm">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Preview Environment Detected</p>
              <p className="text-xs text-blue-700">
                Screen sharing is not available in this preview environment. The app will automatically use simulation
                mode instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Warnings */}
      {!hasDeepgramKey && (
        <div className="px-4 py-2 space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Missing Deepgram API Key</p>
              <p className="text-xs text-amber-700">Add NEXT_PUBLIC_DEEPGRAM_API_KEY to your environment variables.</p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Mode Notice */}
      {simulationMode && (
        <div className="px-4 py-2">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex items-start text-sm">
            <Play className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-indigo-800">Simulation Mode Active</p>
              <p className="text-xs text-indigo-700">
                Running in simulation mode with pre-defined questions. Screen sharing is not available in this
                environment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !simulationMode && (
        <Alert variant="destructive" className="mx-4 mt-2 border-rose-200 bg-rose-50">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          <AlertTitle className="text-rose-800">Error</AlertTitle>
          <AlertDescription className="text-rose-700">
            {error}
            {error.includes("Deepgram connection closed") && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startScreenShare}
                  className="bg-white hover:bg-gray-50"
                  disabled={!isScreenSharing || connectionStatus === "connecting"}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
              </div>
            )}
            {error.includes("getDisplayMedia") && (
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={startSimulationMode} className="bg-white hover:bg-gray-50">
                  <Play className="h-4 w-4 mr-2" />
                  Use Simulation Mode
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Live Transcript Display */}
      {isListening && (
        <div className="mx-4 mt-2 bg-indigo-50 rounded-lg p-3 border border-indigo-100 flex items-center">
          <Mic className="h-4 w-4 text-indigo-500 mr-2 animate-pulse" />
          <div className="text-sm text-indigo-700 font-medium">
            {simulationMode ? simulationTypingText || "Listening..." : currentTranscript || "Listening..."}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="mx-4 mt-2 bg-gray-900 text-gray-200 rounded-xl p-3 text-xs font-mono shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Information</h3>
            <Button variant="ghost" size="sm" onClick={() => setDebugLogs([])} className="h-6 text-xs text-gray-400">
              Clear
            </Button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {debugLogs.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-700">
                {log}
              </div>
            ))}
            {debugLogs.length === 0 && <div className="text-gray-500">No logs yet</div>}
          </div>
        </div>
      )}

      {/* Main Content - Conversation */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex justify-between items-center">
          <h2 className="font-medium text-gray-800 flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-violet-500" />
            Conversation
          </h2>
          <div className="flex items-center gap-2">
            {!showDebugInfo && (
              <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(true)} className="text-xs">
                Debug
              </Button>
            )}
            {showDebugInfo && (
              <Button variant="outline" size="sm" onClick={() => setShowDebugInfo(false)} className="text-xs">
                Hide Debug
              </Button>
            )}
            {conversations.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={exportHistory} className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-8">
              <Brain className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Conversation Yet</h3>
              <p className="max-w-md">
                Start screen sharing or simulation mode and speak to generate a response.
                <br />
                <br />
                The system will continuously listen and transcribe your speech in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {conversations.map((item) => (
                <div key={item.id} className="grid grid-cols-2 gap-6">
                  {/* Question - Left side */}
                  <div className="col-span-1">
                    <div className="bg-indigo-50 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium text-indigo-700">Question #{item.id}</span>
                      </div>
                      <p className="text-gray-800">{item.question}</p>
                    </div>
                  </div>

                  {/* Answer - Right side */}
                  <div className="col-span-1">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Brain className="h-4 w-4 text-violet-600 mr-2" />
                          <span className="text-sm font-medium text-violet-700">AI Response</span>
                        </div>
                        {item.isProcessing && (
                          <Badge
                            variant="outline"
                            className="animate-pulse bg-violet-50 text-violet-700 border-violet-200"
                          >
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Generating...
                          </Badge>
                        )}
                      </div>

                      {item.answer ? (
                        <div>
                          <p className="text-gray-800 whitespace-pre-wrap">{item.answer}</p>
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyResponseToClipboard(item.answer)}
                              className="text-gray-500 hover:text-gray-700 h-7"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-16 text-gray-400">
                          <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                          Waiting for response...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="text-sm text-center text-gray-500">
            {isScreenSharing
              ? connectionStatus === "connected"
                ? simulationMode
                  ? "Simulation mode active - questions are being generated automatically"
                  : "Listening continuously for questions... Your speech is being transcribed in real-time."
                : "Connecting to transcription service..."
              : "Start screen sharing or simulation mode to begin"}
          </div>
        </div>
      </div>
    </div>
  )
}
