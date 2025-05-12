import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Get a specific resume
export async function GET(req: Request, { params }: { params: { resumeId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resumeId = params.resumeId

    if (!resumeId) {
      return NextResponse.json({ message: "Resume ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const resume = await db.resume.findUnique({
      where: {
        id: resumeId,
        userId: user.id,
      },
    })

    if (!resume) {
      return NextResponse.json({ message: "Resume not found" }, { status: 404 })
    }

    return NextResponse.json({ resume })
  } catch (error) {
    console.error("Resume fetch error:", error)

    return NextResponse.json(
      {
        message: "Failed to fetch resume",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Update a resume
export async function PATCH(req: Request, { params }: { params: { resumeId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resumeId = params.resumeId
    const body = await req.json()
    const { title, content } = body

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const resume = await db.resume.findUnique({
      where: {
        id: resumeId,
      },
    })

    if (!resume) {
      return NextResponse.json({ message: "Resume not found" }, { status: 404 })
    }

    if (resume.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const updatedResume = await db.resume.update({
      where: {
        id: resumeId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    })

    return NextResponse.json({ resume: updatedResume })
  } catch (error) {
    console.error("Resume update error:", error)

    return NextResponse.json(
      {
        message: "Failed to update resume",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Delete a resume
export async function DELETE(req: Request, { params }: { params: { resumeId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const resumeId = params.resumeId

    if (!resumeId) {
      return NextResponse.json({ message: "Resume ID is required" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // First check if the resume exists and belongs to the user
    const resume = await db.resume.findUnique({
      where: {
        id: resumeId,
      },
    })

    if (!resume) {
      return NextResponse.json({ message: "Resume not found" }, { status: 404 })
    }

    if (resume.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Delete the resume
    await db.resume.delete({
      where: {
        id: resumeId,
      },
    })

    return NextResponse.json({ message: "Resume deleted successfully" })
  } catch (error) {
    console.error("Resume deletion error:", error)

    return NextResponse.json(
      {
        message: "Failed to delete resume",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
