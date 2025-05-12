import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Get a specific meeting
export async function GET(req: Request, { params }: { params: { meetingId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const meetingId = params.meetingId

    if (!meetingId) {
      return NextResponse.json({ message: "Meeting ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const meeting = await db.meeting.findUnique({
      where: {
        id: meetingId,
        userId: user.id,
      },
    })

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error("Meeting fetch error:", error)

    return NextResponse.json(
      {
        message: "Failed to fetch meeting",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Update a meeting
export async function PATCH(req: Request, { params }: { params: { meetingId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const meetingId = params.meetingId
    const body = await req.json()
    const { transcript, responses, creditsUsed } = body

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const meeting = await db.meeting.findUnique({
      where: {
        id: meetingId,
      },
    })

    if (!meeting) {
      return NextResponse.json({ message: "Meeting not found" }, { status: 404 })
    }

    if (meeting.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const updatedMeeting = await db.meeting.update({
      where: {
        id: meetingId,
      },
      data: {
        ...(transcript !== undefined && { transcript }),
        ...(responses !== undefined && { responses }),
        ...(creditsUsed !== undefined && { creditsUsed }),
      },
    })

    return NextResponse.json({ meeting: updatedMeeting })
  } catch (error) {
    console.error("Meeting update error:", error)

    return NextResponse.json(
      {
        message: "Failed to update meeting",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
