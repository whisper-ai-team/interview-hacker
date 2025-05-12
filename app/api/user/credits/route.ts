import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        credits: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ credits: user.credits })
  } catch (error) {
    console.error("Error fetching user credits:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch user credits",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
