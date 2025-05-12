/**
 * Resume parsing utilities
 */

export interface ParsedResume {
    raw: string
    sections: {
      [key: string]: string
    }
    contact?: {
      name?: string
      email?: string
      phone?: string
      location?: string
      linkedin?: string
      website?: string
    }
    skills: string[]
    experience: {
      title?: string
      company?: string
      date?: string
      description: string
    }[]
    education: {
      degree?: string
      institution?: string
      date?: string
      description?: string
    }[]
  }
  
  /**
   * Parse a resume text into structured sections
   */
  export function parseResume(text: string): ParsedResume {
    // Initialize the parsed resume
    const parsedResume: ParsedResume = {
      raw: text,
      sections: {},
      skills: [],
      experience: [],
      education: [],
      contact: {},
    }
  
    // Common section headers in resumes
    const sectionHeaders = [
      "EDUCATION",
      "EXPERIENCE",
      "WORK EXPERIENCE",
      "EMPLOYMENT",
      "SKILLS",
      "TECHNICAL SKILLS",
      "PROJECTS",
      "CERTIFICATIONS",
      "ACHIEVEMENTS",
      "SUMMARY",
      "OBJECTIVE",
      "PROFILE",
      "CONTACT",
      "REFERENCES",
      "PUBLICATIONS",
      "LANGUAGES",
      "INTERESTS",
      "ACTIVITIES",
      "VOLUNTEER",
      "AWARDS",
    ]
  
    // Extract contact information
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phoneRegex = /\b(\+\d{1,2}\s)?$$?\d{3}$$?[\s.-]?\d{3}[\s.-]?\d{4}\b/g
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/g
    const websiteRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  
    // Extract email
    const emails = text.match(emailRegex)
    if (emails && emails.length > 0) {
      parsedResume.contact.email = emails[0]
    }
  
    // Extract phone
    const phones = text.match(phoneRegex)
    if (phones && phones.length > 0) {
      parsedResume.contact.phone = phones[0]
    }
  
    // Extract LinkedIn
    const linkedins = text.match(linkedinRegex)
    if (linkedins && linkedins.length > 0) {
      parsedResume.contact.linkedin = linkedins[0]
    }
  
    // Extract website
    const websites = text.match(websiteRegex)
    if (websites && websites.length > 0) {
      parsedResume.contact.website = websites[0]
    }
  
    // Try to extract name (usually at the beginning)
    const lines = text.split("\n").filter((line) => line.trim() !== "")
    if (lines.length > 0) {
      // First non-empty line is often the name
      parsedResume.contact.name = lines[0].trim()
    }
  
    // Split the resume into sections
    let currentSection = "HEADER"
    parsedResume.sections[currentSection] = ""
  
    for (const line of lines) {
      const upperLine = line.toUpperCase().trim()
  
      // Check if this line is a section header
      const isHeader = sectionHeaders.some(
        (header) => upperLine === header || upperLine.includes(header + ":") || upperLine.includes(header + " "),
      )
  
      if (isHeader) {
        currentSection = upperLine
        parsedResume.sections[currentSection] = ""
      } else {
        parsedResume.sections[currentSection] += line + "\n"
      }
    }
  
    // Extract skills
    const skillsSections = Object.keys(parsedResume.sections).filter((section) => section.includes("SKILL"))
  
    if (skillsSections.length > 0) {
      const skillsText = skillsSections.map((section) => parsedResume.sections[section]).join(" ")
  
      // Extract skills by splitting on commas, bullets, or new lines
      const skillsList = skillsText
        .replace(/•/g, ",")
        .replace(/\n/g, ",")
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0 && skill.length < 50) // Filter out empty or too long items
  
      parsedResume.skills = [...new Set(skillsList)] // Remove duplicates
    }
  
    // Extract experience
    const experienceSections = Object.keys(parsedResume.sections).filter(
      (section) => section.includes("EXPERIENCE") || section.includes("EMPLOYMENT"),
    )
  
    if (experienceSections.length > 0) {
      for (const section of experienceSections) {
        const experienceText = parsedResume.sections[section]
        const experienceBlocks = experienceText.split(/\n\s*\n/) // Split by empty lines
  
        for (const block of experienceBlocks) {
          if (block.trim().length > 0) {
            const lines = block.split("\n").filter((line) => line.trim() !== "")
            if (lines.length > 0) {
              const experience = {
                title: lines[0].trim(),
                company: lines.length > 1 ? lines[1].trim() : undefined,
                date: lines.length > 2 ? lines[2].trim() : undefined,
                description: lines.slice(3).join("\n"),
              }
              parsedResume.experience.push(experience)
            }
          }
        }
      }
    }
  
    // Extract education
    const educationSections = Object.keys(parsedResume.sections).filter((section) => section.includes("EDUCATION"))
  
    if (educationSections.length > 0) {
      for (const section of educationSections) {
        const educationText = parsedResume.sections[section]
        const educationBlocks = educationText.split(/\n\s*\n/) // Split by empty lines
  
        for (const block of educationBlocks) {
          if (block.trim().length > 0) {
            const lines = block.split("\n").filter((line) => line.trim() !== "")
            if (lines.length > 0) {
              const education = {
                degree: lines[0].trim(),
                institution: lines.length > 1 ? lines[1].trim() : undefined,
                date: lines.length > 2 ? lines[2].trim() : undefined,
                description: lines.length > 3 ? lines.slice(3).join("\n") : undefined,
              }
              parsedResume.education.push(education)
            }
          }
        }
      }
    }
  
    return parsedResume
  }
  
  /**
   * Save parsed resume to session storage
   */
  export function saveParsedResumeToStorage(parsedResume: ParsedResume): void {
    try {
      if (typeof window === "undefined") {
        return
      }
  
      const resumeData = {
        content: parsedResume.raw,
        parsed: parsedResume,
        fileName: parsedResume.contact?.name || "Resume",
        timestamp: new Date().toISOString(),
      }
  
      sessionStorage.setItem("userResume", JSON.stringify(resumeData))
      console.log("Parsed resume saved to session storage")
    } catch (error) {
      console.error("Error saving parsed resume to storage:", error)
    }
  }
  
  /**
   * Get parsed resume from session storage
   */
  export function getParsedResumeFromStorage(): ParsedResume | null {
    try {
      if (typeof window === "undefined") {
        return null
      }
  
      const storedResume = sessionStorage.getItem("userResume")
      if (!storedResume) {
        return null
      }
  
      const resumeData = JSON.parse(storedResume)
      return resumeData.parsed || null
    } catch (error) {
      console.error("Error getting parsed resume from storage:", error)
      return null
    }
  }
  