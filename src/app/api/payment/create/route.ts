import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/myfatoorah";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customerName, customerEmail, customerPhone, displayName, referenceId } = body;

    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

    const result = await createPayment({
      invoiceValue: amount,
      displayName: displayName || "Hattrick Academy Subscription",
      customerName,
      customerEmail,
      customerPhone,
      callBackUrl: `${baseUrl}/api/payment/callback`,
      errorUrl: `${baseUrl}/api/payment/callback?error=true`,
      userDefinedField: referenceId || "",
    });

    if (!result.IsSuccess || !result.Data) {
      return NextResponse.json(
        { error: result.Message || "Failed to create payment", details: result.ValidationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invoiceId: result.Data.InvoiceId,
      invoiceUrl: result.Data.InvoiceURL,
      reference: result.Data.CustomerReference,
    });
  } catch (error) {
    console.error("Payment create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
