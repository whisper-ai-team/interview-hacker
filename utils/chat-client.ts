// This file handles client-side chat interactions but delegates actual API calls to a server endpoint

export async function* askGPT(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model: "gpt4o" | "gemini" = "gpt4o",
) {
  try {
    console.log(`[OpenAI] Sending request to ${model}`)
    console.log(`[OpenAI] Messages:`, JSON.stringify(messages, null, 2))

    // Get resume context if available
    let resumeContent = null
    try {
      if (typeof window !== "undefined") {
        const storedResume = sessionStorage.getItem("userResume")
        if (storedResume) {
          const resumeData = JSON.parse(storedResume)
          resumeContent = resumeData.content
          console.log("[OpenAI] Resume content loaded from session storage")
        }
      }
    } catch (error) {
      console.error("[OpenAI] Error accessing session storage:", error)
    }

    // Create the request to our secure API endpoint
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        model,
        resumeContent,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[OpenAI] API request failed:", error)
      yield `Error: API request failed with status ${response.status}`
      return
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      console.error("[OpenAI] Failed to get response reader")
      yield "Error: Failed to read response stream"
      return
    }

    const decoder = new TextDecoder()
    let chunkCount = 0
    let totalContent = ""

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      chunkCount++

      // Process each line (in case multiple chunks arrive together)
      const lines = chunk.split("\n").filter((line) => line.trim() !== "")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const content = line.substring(6)

          if (content === "[DONE]") {
            continue
          }

          try {
            // Parse the JSON content
            const parsed = JSON.parse(content)
            const textContent = parsed.choices[0]?.delta?.content || ""

            if (textContent) {
              totalContent += textContent
              console.log(`[OpenAI] Chunk #${chunkCount}: "${textContent}"`)
              yield textContent
            }
          } catch (e) {
            console.error("[OpenAI] Error parsing chunk:", e)
          }
        }
      }
    }

    // Log completion
    console.log(`[OpenAI] Request completed with ${chunkCount} chunks`)
    console.log(`[OpenAI] Final response: "${totalContent.substring(0, 100)}${totalContent.length > 100 ? "..." : ""}"`)
  } catch (error) {
    console.error("[OpenAI] Error calling API:", error)
    console.error("[OpenAI] Error details:", error instanceof Error ? error.stack : String(error))
    yield "Sorry, I encountered an error while generating a response. Please check your network connection."
  }
}

export async function sendMessage(message: string, context = "") {
  try {
    // Get resume context if available
    let resumeContent = null
    try {
      if (typeof window !== "undefined") {
        const storedResume = sessionStorage.getItem("userResume")
        if (storedResume) {
          const resumeData = JSON.parse(storedResume)
          resumeContent = resumeData.content
        }
      }
    } catch (error) {
      console.error("Error accessing session storage:", error)
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context,
        resumeContent,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send message")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}
