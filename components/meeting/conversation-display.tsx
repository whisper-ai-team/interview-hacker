"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Clock, Loader2, MessageSquare, Bot } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type Message = {
  id: string
  type: "question" | "answer"
  content: string
  timestamp: Date
  isProcessing?: boolean
}

interface ConversationDisplayProps {
  meetingId?: string
  messages: Message[]
  onCopyMessage: (message: Message) => void
  isTranscribing: boolean
  currentTranscript: string
  timeUntilNextProcess: number
  isSimulationMode?: boolean
}

export default function ConversationDisplay({
  meetingId,
  messages,
  onCopyMessage,
  isTranscribing,
  currentTranscript,
  timeUntilNextProcess,
  isSimulationMode = false,
}: ConversationDisplayProps) {
  const [activeTab, setActiveTab] = useState("conversation")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="h-full border-0 shadow-lg bg-white rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Interview Conversation
          </div>
          {/* Remove the Tabs component since we only have one tab */}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-60px)] overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
              <Bot className="h-16 w-16 text-indigo-200 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">Your Interview Assistant</h3>
              <p className="max-w-md">
                {isSimulationMode
                  ? "Simulation mode is active. Questions will be generated automatically."
                  : "Share your screen with audio to start the interview. I'll transcribe the conversation and provide helpful responses."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.type === "question" ? "items-start" : "items-end"} space-y-2`}
                >
                  <div
                    className={`flex items-center text-xs text-gray-500 ${
                      message.type === "question" ? "self-start" : "self-end"
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-xl p-4 ${
                      message.type === "question" ? "bg-gray-100 text-gray-800" : "bg-indigo-600 text-white shadow-md"
                    }`}
                  >
                    {message.isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating response...</span>
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div
                          className={`absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                            message.type === "question" ? "text-gray-500" : "text-white/70"
                          }`}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onCopyMessage(message)}
                                >
                                  <Copy className="h-4 w-4" />
                                  <span className="sr-only">Copy</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy to clipboard</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Current transcript indicator */}
              {isTranscribing && currentTranscript && (
                <div className="flex flex-col items-start space-y-2 opacity-70">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Now</span>
                  </div>
                  <div className="max-w-[85%] rounded-xl p-4 bg-gray-100 text-gray-800 border border-gray-200 border-dashed">
                    <div className="whitespace-pre-wrap">{currentTranscript}</div>
                  </div>
                </div>
              )}

              {/* This div is used to scroll to the bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
