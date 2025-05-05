import { OpenAI } from "openai"
import { type NextRequest, NextResponse } from "next/server"

// Create an OpenAI API client on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI interview assistant that helps candidates answer interview questions based on their personal resume and experience. Provide personalized, confident responses that highlight the candidate's strengths and achievements. Frame answers using the STAR method (Situation, Task, Action, Result) where appropriate. Keep responses concise but impactful.",
        },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: false,
    })

    return NextResponse.json({
      answer: response.choices[0]?.message.content || "Sorry, I couldn't generate a response.",
    })
  } catch (error) {
    console.error("Error generating response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
