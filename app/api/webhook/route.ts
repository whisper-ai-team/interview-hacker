import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object

    // Retrieve the user ID and credits from metadata
    const userId = session.metadata?.userId
    const creditsToAdd = Number.parseInt(session.metadata?.credits || "0", 10)

    if (userId && creditsToAdd > 0) {
      try {
        // Update user's credits
        await db.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: creditsToAdd,
            },
          },
        })

        // Record the payment
        await db.payment.create({
          data: {
            userId,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
            status: "completed",
            stripePaymentId: session.payment_intent as string,
            stripeCustomerId: session.customer as string,
            credits: creditsToAdd,
          },
        })
      } catch (error) {
        console.error("Error processing payment:", error)
        return new NextResponse("Error processing payment", { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
