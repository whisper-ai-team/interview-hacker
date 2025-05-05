// A simplified and more robust OpenAI client implementation that uses server API
export class OpenAIClient {
  constructor() {
    console.log("[OpenAI] Client initialized to use server API")
  }

  async generateResponse(question: string, onChunk: (text: string) => void): Promise<string> {
    // Validate question
    if (!question) {
      const errorMsg = "Invalid question: Question is undefined or null"
      console.error(`[OpenAI] ${errorMsg}`)
      onChunk(errorMsg)
      return errorMsg
    }

    // Ensure question is a string and trim it
    const safeQuestion = String(question).trim()
    if (safeQuestion === "") {
      const errorMsg = "Invalid question: Question is empty"
      console.error(`[OpenAI] ${errorMsg}`)
      onChunk(errorMsg)
      return errorMsg
    }

    console.log(`[OpenAI] Generating response for: "${safeQuestion}"`)

    try {
      // Use our server API endpoint instead of direct OpenAI access
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: safeQuestion }),
      })

      if (!response.ok) {
        let errorMsg = `API error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error(`[OpenAI] ${errorMsg}`, errorData)
          if (errorData && errorData.error) {
            errorMsg += ` - ${errorData.error}`
          }
        } catch (e) {
          console.error(`[OpenAI] Failed to parse error response:`, e)
        }

        onChunk(errorMsg)
        return errorMsg
      }

      const data = await response.json()
      const answer = data.answer || "No response received"

      // Simulate streaming by sending chunks of the response
      const words = answer.split(" ")
      let currentResponse = ""

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30))
        currentResponse = words.slice(0, i + 1).join(" ")
        onChunk(currentResponse)
      }

      console.log(`[OpenAI] Response generated: "${answer.substring(0, 100)}..."`)
      return answer
    } catch (error) {
      const errorMsg = `Error generating response: ${error instanceof Error ? error.message : String(error)}`
      console.error(`[OpenAI] ${errorMsg}`)
      console.error("[OpenAI] Error details:", error)
      onChunk(errorMsg)
      return errorMsg
    }
  }

  // Fallback method that uses a mock response when the API fails
  async generateFallbackResponse(question: string, onChunk: (text: string) => void): Promise<string> {
    console.log(`[OpenAI] Using fallback response for: "${question}"`)

    // Generate a personalized response based on the question
    const fallbackResponse = `Based on your resume and experience, here's how I would answer the question about "${question.substring(0, 50)}${question.length > 50 ? "..." : ""}":

In my previous role at [Your Most Recent Company], I encountered a similar situation. I was tasked with [relevant responsibility related to the question]. 

To address this, I first analyzed the requirements carefully and developed a strategic approach. I leveraged my skills in [relevant skill from your resume] to implement a solution that [describe positive outcome].

The result was [quantifiable achievement if possible, e.g., "a 30% increase in efficiency" or "successful completion ahead of schedule"]. This experience demonstrates my ability to [relevant quality or skill the interviewer is likely looking for].

Would you like me to elaborate on any specific aspect of this experience?`

    try {
      // Simulate streaming
      const words = fallbackResponse.split(" ")
      let currentResponse = ""

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        currentResponse = words.slice(0, i + 1).join(" ")
        onChunk(currentResponse)
      }

      return fallbackResponse
    } catch (error) {
      console.error("[OpenAI] Error in fallback response:", error)
      const errorMessage = "Sorry, I encountered an error generating a response. Please try again."
      onChunk(errorMessage)
      return errorMessage
    }
  }
}
