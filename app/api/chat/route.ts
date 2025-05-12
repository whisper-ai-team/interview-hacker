import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { OpenAIStream, StreamingTextResponse } from "ai"

// Initialize OpenAI client securely on the server
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is missing" }, { status: 500 })
    }

    // Parse request body
    const { messages, model, resumeContent } = await req.json()

    // Validate request data
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    // Prepare system message with resume context if available
    let systemMessage =
      messages.find((msg) => msg.role === "system")?.content ||
      "You are an AI interview coach helping with job interview preparation."

    if (resumeContent && !systemMessage.includes("RESUME INFORMATION")) {
      // Extract key information from resume to avoid token limits
      const resumeExcerpt = resumeContent.length > 2000 ? resumeContent.substring(0, 2000) + "..." : resumeContent

      systemMessage = `You are an AI interview coach helping with job interview preparation. 
Use the following resume information to personalize your responses and provide relevant advice:

RESUME INFORMATION:
${resumeExcerpt}

When answering questions, refer to the candidate's experience and skills from their resume when relevant. 
Tailor your advice to their background, but don't explicitly mention that you're using their resume unless asked.`
    }

    // Add system message to the beginning of messages array if it doesn't already have one
    const messagesWithSystem =
      messages[0]?.role === "system"
        ? messages.map((msg, i) => (i === 0 ? { ...msg, content: systemMessage } : msg))
        : [{ role: "system", content: systemMessage }, ...messages]

    // Create OpenAI request
    const response = await openai.chat.completions.create({
      model: model === "gemini" ? "gpt-4o" : "gpt-4o", // We're simulating Gemini with GPT-4o
      messages: messagesWithSystem,
      stream: true,
    })

    // Create a streaming response
    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Error in chat API route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
