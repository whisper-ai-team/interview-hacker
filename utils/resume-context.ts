/**
 * Utility functions for handling resume context
 */

/**
 * Gets resume content from session storage and formats it for AI context
 */
export function formatResumeForAI(): string | null {
  try {
    // Only run in browser environment
    if (typeof window === "undefined") {
      return null
    }

    const storedResume = sessionStorage.getItem("userResume")
    if (!storedResume) {
      return null
    }

    const resumeData = JSON.parse(storedResume)
    if (!resumeData.content) {
      return null
    }

    // Check if this looks like binary PDF data
    const content = resumeData.content
    if (content.startsWith("%PDF-") || content.includes("endobj") || content.includes("/Type/")) {
      return `
RESUME INFORMATION:
[The user has uploaded a PDF resume, but the text couldn't be fully extracted. Please proceed with general interview questions.]

When answering questions, provide general advice and guidance for interview preparation.
`
    }

    // Limit resume content to avoid token limits
    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + "..." : content

    return `
RESUME INFORMATION:
${truncatedContent}

When answering questions, refer to the candidate's experience and skills from their resume when relevant. 
Tailor your advice to their background, but don't explicitly mention that you're using their resume unless asked.
`
  } catch (error) {
    console.error("Error formatting resume for AI:", error)
    return null
  }
}

/**
 * Saves resume content to session storage
 */
export function saveResumeToStorage(content: string, fileName: string): void {
  try {
    if (typeof window === "undefined") {
      return
    }

    const resumeData = {
      content,
      fileName,
      timestamp: new Date().toISOString(),
    }

    sessionStorage.setItem("userResume", JSON.stringify(resumeData))
    console.log("Resume saved to session storage")
  } catch (error) {
    console.error("Error saving resume to storage:", error)
  }
}

/**
 * Gets resume data from session storage
 */
export function getResumeFromStorage(): { content: string; fileName: string; timestamp: string } | null {
  try {
    if (typeof window === "undefined") {
      return null
    }

    const storedResume = sessionStorage.getItem("userResume")
    if (!storedResume) {
      return null
    }

    return JSON.parse(storedResume)
  } catch (error) {
    console.error("Error getting resume from storage:", error)
    return null
  }
}

/**
 * Clears resume data from session storage
 */
export function clearResumeFromStorage(): void {
  try {
    if (typeof window === "undefined") {
      return
    }

    sessionStorage.removeItem("userResume")
    console.log("Resume cleared from session storage")
  } catch (error) {
    console.error("Error clearing resume from storage:", error)
  }
}
