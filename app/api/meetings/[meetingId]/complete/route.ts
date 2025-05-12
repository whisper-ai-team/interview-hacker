import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { meetingId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const meetingId = params.meetingId
    const { creditsUsed } = await req.json()

    // Get the user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the meeting
    const meeting = await db.meeting.findUnique({
      where: { id: meetingId },
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    // Check if the meeting belongs to the user
    if (meeting.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the meeting with the credits used
    // We'll use a special field in responses to mark it as completed
    const completionMarker = {
      type: "system",
      content: "MEETING_COMPLETED",
      timestamp: new Date().toISOString(),
    }

    // Get existing responses or initialize empty array
    const existingResponses = meeting.responses || []

    // Add completion marker to responses
    const updatedResponses = Array.isArray(existingResponses)
      ? [...existingResponses, completionMarker]
      : [completionMarker]

    await db.meeting.update({
      where: { id: meetingId },
      data: {
        creditsUsed,
        responses: updatedResponses,
      },
    })

    return NextResponse.json({
      success: true,
      creditsUsed,
      remainingCredits: user.credits,
    })
  } catch (error) {
    console.error("Meeting completion error:", error)
    return NextResponse.json({ error: "Failed to complete meeting", details: String(error) }, { status: 500 })
  }
}
