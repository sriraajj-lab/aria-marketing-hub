import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_SX5V4dUW00R0V2",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "o3lKj26tx2e2ySMNlJe0DLc3",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = "USD", plan, email, name } = body;

    if (!amount || !plan) {
      return NextResponse.json(
        { error: "Amount and plan are required" },
        { status: 400 }
      );
    }

    // Razorpay requires amount in smallest currency unit (paise for INR, cents for USD)
    const amountInCents = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInCents,
      currency,
      receipt: `dd_${plan}_${Date.now()}`,
      notes: {
        plan,
        email: email || "",
        name: name || "",
        product: "Denials Doctor",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_live_SX5V4dUW00R0V2",
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Payment initiation failed" },
      { status: 500 }
    );
  }
}
