import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Get all resumes for the current user
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

    const resumes = await db.resume.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ resumes })
  } catch (error) {
    console.error("Resumes fetch error:", error)

    return NextResponse.json(
      {
        message: "Failed to fetch resumes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// Create a new resume
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, content } = body

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

    // Create a new resume
    const resume = await db.resume.create({
      data: {
        userId: user.id,
        title,
        content: content || "",
      },
    })

    return NextResponse.json({ resume })
  } catch (error) {
    console.error("Resume creation error:", error)

    return NextResponse.json(
      {
        message: "Failed to create resume",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
