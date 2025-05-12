import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Create a new meeting
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title } = body

    if (!title || typeof title !== "string") {
      return NextResponse.json({ message: "Title is required and must be a string" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Create a new meeting without the isCompleted field
    const meeting = await db.meeting.create({
      data: {
        userId: user.id,
        title: title || "Untitled Meeting",
        creditsUsed: 0,
      },
    })

    return NextResponse.json(meeting)
  } catch (error) {
    console.error("Meeting creation error:", error)

    // Return a structured error response
    return NextResponse.json(
      {
        message: "Failed to create meeting",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Get user's meetings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const meetings = await db.meeting.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(meetings)
  } catch (error) {
    console.error("Meetings fetch error:", error)

    return NextResponse.json(
      {
        message: "Failed to fetch meetings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
