"use client"

import { Clock, Copy, MessageSquare, Bot } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

export interface Message {
  id: string
  type: "question" | "answer"
  content: string
  timestamp: Date
  isProcessing?: boolean
}

export interface ConversationDisplayProps {
  messages: Message[]
  onCopyMessage?: (message: Message) => void
  isTranscribing: boolean
  currentTranscript: string | null
  timeUntilNextProcess?: number
  isSimulationMode?: boolean
}

export function ConversationDisplay({
  messages,
  onCopyMessage,
  isTranscribing,
  currentTranscript,
  timeUntilNextProcess,
  isSimulationMode,
}: ConversationDisplayProps) {
  // Format seconds for display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    return `${seconds}s`
  }

  // Auto-scroll to bottom when new messages arrive
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, currentTranscript])

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white p-4 rounded-t-xl">
        <h2 className="text-lg font-semibold flex items-center justify-between">
          <span>Real-time Conversation</span>
          {isTranscribing && timeUntilNextProcess !== undefined && (
            <Badge className="bg-white/20 text-white">
              <Clock className="h-3 w-3 mr-1" />
              Next processing in {formatTime(timeUntilNextProcess)}
            </Badge>
          )}
        </h2>
        {isSimulationMode && (
          <div className="mt-2 text-xs bg-white/20 p-2 rounded">
            Running in simulation mode. Screen sharing is not available in this environment.
          </div>
        )}
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-b-xl shadow-lg overflow-hidden">
        <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="max-w-md">
                <h3 className="text-lg font-medium text-gray-700 mb-2">No conversation yet</h3>
                <p className="text-gray-500">
                  {isSimulationMode
                    ? "Simulation mode will generate meeting content automatically."
                    : "Start screen sharing with audio to begin transcribing and generating responses."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "question" ? "justify-start" : "justify-end"} mb-4`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 message-bubble ${
                      message.type === "question"
                        ? "bg-gray-100 text-gray-800 question"
                        : "bg-indigo-100 text-indigo-900 answer"
                    }`}
                  >
                    <div className="flex items-center mb-1 text-xs text-gray-500">
                      {message.type === "question" ? (
                        <MessageSquare className="h-3 w-3 mr-1" />
                      ) : (
                        <Bot className="h-3 w-3 mr-1" />
                      )}
                      <span>
                        {message.type === "question" ? "Transcript" : "AI Response"} •{" "}
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {message.isProcessing ? (
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {onCopyMessage && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCopyMessage(message)}
                              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Show current transcript if transcribing */}
              {isTranscribing && currentTranscript && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] rounded-lg p-3 bg-gray-50 text-gray-600 border border-gray-200">
                    <div className="flex items-center mb-1 text-xs text-gray-500">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>Currently transcribing...</span>
                    </div>
                    <p className="whitespace-pre-wrap">{currentTranscript}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
