import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { messages, model = "gpt-4o", resumeContent } = await req.json()

    // Validate the request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request: messages must be an array" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // If we have a message and context instead of messages array (for sendMessage function)
    if (req.body && !messages && req.body.hasOwnProperty("message")) {
      const { message, context } = await req.json()

      // Create a simple completion for non-streaming requests
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI interview coach." + (resumeContent ? `\n\nResume: ${resumeContent}` : ""),
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return NextResponse.json({
        response: completion.choices[0]?.message?.content || "No response generated",
      })
    }

    // Create a streaming response
    const response = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    })

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        // Process each chunk from the OpenAI stream
        for await (const chunk of response) {
          // Extract the content from the chunk
          const content = chunk.choices[0]?.delta?.content || ""

          if (content) {
            // Format as SSE (Server-Sent Events)
            const sseMessage = `data: ${JSON.stringify({
              choices: [{ delta: { content } }],
            })}\n\n`

            // Send the chunk to the client
            controller.enqueue(encoder.encode(sseMessage))
          }
        }

        // Signal the end of the stream
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    // Return the stream with appropriate headers
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in chat API route:", error)

    // Determine the error message and status code
    let errorMessage = "An error occurred during the API request"
    let statusCode = 500

    if (error instanceof OpenAI.APIError) {
      errorMessage = error.message
      statusCode = error.status || 500
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
