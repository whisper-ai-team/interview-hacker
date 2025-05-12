import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
      select: {
        content: true,
      },
    })

    if (!resume) {
      return NextResponse.json({ message: "Resume not found" }, { status: 404 })
    }

    return NextResponse.json({ content: resume.content })
  } catch (error) {
    console.error("Resume content fetch error:", error)

    return NextResponse.json(
      {
        message: "Failed to fetch resume content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
