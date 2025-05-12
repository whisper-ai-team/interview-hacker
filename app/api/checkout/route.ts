import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

const CREDIT_PACKAGES = {
  small: { credits: 100, price: 999 }, // $9.99 for 100 credits
  medium: { credits: 500, price: 3999 }, // $39.99 for 500 credits
  large: { credits: 1000, price: 6999 }, // $69.99 for 1000 credits
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { package: packageName } = body

    if (!packageName || !CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES]) {
      return new NextResponse("Invalid package", { status: 400 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        email: session.user.email,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const selectedPackage = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES]

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${selectedPackage.credits} Interview Copilot Credits`,
              description: `Package of ${selectedPackage.credits} credits for Interview Copilot`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        credits: selectedPackage.credits.toString(),
      },
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
