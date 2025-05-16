// This file handles the actual API communication
import { v4 as uuidv4 } from "uuid"

type Message = {
  role: "system" | "user" | "assistant"
  content: string
}

/**
 * Creates an async generator that streams responses from the GPT model
 * @param messages The conversation history
 * @param model The model to use (e.g., "gpt-4o")
 */
export async function* askGPT(messages: Message[], model = "gpt-4o") {
  try {
    const requestId = uuidv4()
    console.log(`[askGPT] Starting request ${requestId} with ${messages.length} messages`)

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `API error: ${response.status} ${response.statusText}`
      console.error(`[askGPT] Request ${requestId} failed:`, errorMessage)
      throw new Error(errorMessage)
    }

    if (!response.body) {
      console.error(`[askGPT] Request ${requestId}: No response body`)
      throw new Error("Response body is null")
    }

    // Create a reader to read the stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    console.log(`[askGPT] Request ${requestId}: Starting to read stream`)

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log(`[askGPT] Request ${requestId}: Stream complete`)
          break
        }

        // Decode the chunk and yield it
        const chunk = decoder.decode(value, { stream: true })

        // Process the chunk - it might contain multiple SSE events
        const lines = chunk.split("\n").filter((line) => line.trim() !== "")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)

            // Check if it's the [DONE] marker
            if (data === "[DONE]") {
              console.log(`[askGPT] Request ${requestId}: Received [DONE] marker`)
              continue
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                yield parsed.choices[0].delta.content
              }
            } catch (e) {
              console.warn(`[askGPT] Request ${requestId}: Error parsing JSON:`, e)
              // If we can't parse as JSON, just yield the raw data
              yield data
            }
          }
        }
      }
    } catch (error) {
      console.error(`[askGPT] Request ${requestId}: Error reading stream:`, error)
      throw error
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    console.error("[askGPT] Error:", error)
    throw error
  }
}
