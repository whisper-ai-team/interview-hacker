// This is a client-side wrapper that uses the secure API endpoint

export class OpenAIClient {
  private resumeContent: string | null = null

  constructor(apiKey: string) {
    // We don't need the API key anymore as we're using a server endpoint
    console.log("[OpenAIClient] Initialized")

    // Try to load resume content from session storage
    this.loadResumeFromSessionStorage()
  }

  private loadResumeFromSessionStorage() {
    try {
      const storedResume = sessionStorage.getItem("userResume")
      if (storedResume) {
        const resumeData = JSON.parse(storedResume)
        if (resumeData.content) {
          this.resumeContent = resumeData.content
          console.log("[OpenAIClient] Resume content loaded from session storage")
        }
      }
    } catch (error) {
      console.error("[OpenAIClient] Error loading resume from session storage:", error)
    }
  }

  setResumeContent(content: string) {
    this.resumeContent = content
    console.log("[OpenAIClient] Resume content set manually")
  }

  async generateResponseWithContext(
    query: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    try {
      console.log("[OpenAIClient] Generating response with context")

      // Check if we need to refresh resume content from session storage
      if (!this.resumeContent) {
        this.loadResumeFromSessionStorage()
      }

      // Prepare system message with resume context if available
      let systemMessage = "You are an AI interview coach helping with job interview preparation."

      if (this.resumeContent) {
        // Extract key information from resume to avoid token limits
        const resumeExcerpt =
          this.resumeContent.length > 2000 ? this.resumeContent.substring(0, 2000) + "..." : this.resumeContent

        systemMessage = `You are an AI interview coach helping with job interview preparation. 
Use the following resume information to personalize your responses and provide relevant advice:

RESUME CONTENT:
${resumeExcerpt}

When answering questions, refer to the candidate's experience and skills from their resume when relevant. 
Tailor your advice to their background, but don't explicitly mention that you're using their resume unless asked.`
      }

      const messages = [
        { role: "system" as const, content: systemMessage },
        ...conversationHistory,
        { role: "user" as const, content: query },
      ]

      // Use the askGPT function from chat-client.ts which now uses a secure API endpoint
      const generator = askGPT(messages, "gpt4o")

      let fullResponse = ""

      for await (const chunk of generator) {
        fullResponse += chunk
        onChunk(fullResponse)
      }

      return fullResponse
    } catch (error) {
      console.error("[OpenAIClient] Error generating response:", error)
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// Import the askGPT function
import { askGPT } from "./chat-client"
