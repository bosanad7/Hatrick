import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentCallback } from "@/lib/myfatoorah";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  const isError = url.searchParams.get("error") === "true";
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

  if (!paymentId) {
    return NextResponse.redirect(`${baseUrl}/register?payment=failed`);
  }

  try {
    const result = await verifyPaymentCallback(paymentId);

    if (result.success) {
      // Update subscription with payment info
      const sub = await db.subscription.findFirst({
        where: { mfPaymentId: result.invoiceId },
      });

      if (sub) {
        await db.subscription.update({
          where: { id: sub.id },
          data: {
            mfPaymentStatus: "Paid",
            mfPaymentRef: result.paymentRef,
            mfPaymentDate: new Date(result.date),
            status: "ACTIVE",
          },
        });
      }

      // Also check public registration
      const pubReg = await db.publicRegistration.findFirst({
        where: { mfPaymentId: result.invoiceId },
      });

      if (pubReg) {
        await db.publicRegistration.update({
          where: { id: pubReg.id },
          data: {
            mfPaymentStatus: "Paid",
            mfPaymentRef: result.paymentRef,
            status: "PAID",
          },
        });

        // Complete the registration — create user, parent, player, subscription
        await completePublicRegistration(pubReg.id);
      }

      return NextResponse.redirect(`${baseUrl}/register/success?ref=${result.invoiceId}`);
    } else {
      // Update failure status
      const sub = await db.subscription.findFirst({
        where: { mfPaymentId: result.invoiceId },
      });
      if (sub) {
        await db.subscription.update({
          where: { id: sub.id },
          data: { mfPaymentStatus: result.status },
        });
      }

      const pubReg = await db.publicRegistration.findFirst({
        where: { mfPaymentId: result.invoiceId },
      });
      if (pubReg) {
        await db.publicRegistration.update({
          where: { id: pubReg.id },
          data: { mfPaymentStatus: result.status, status: "FAILED" },
        });
      }

      return NextResponse.redirect(`${baseUrl}/register?payment=failed`);
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(`${baseUrl}/register?payment=error`);
  }
}

/** Complete a public registration after successful payment */
async function completePublicRegistration(regId: string) {
  const reg = await db.publicRegistration.findUnique({ where: { id: regId } });
  if (!reg || reg.status === "COMPLETED") return;

  const bcrypt = await import("bcryptjs");

  // Find or create user
  let user = await db.user.findUnique({ where: { email: reg.parentEmail } });
  if (!user) {
    const tempPassword = await bcrypt.hash(`hattrick${Date.now()}`, 10);
    user = await db.user.create({
      data: {
        email: reg.parentEmail,
        name: reg.parentName,
        phone: reg.parentPhone,
        password: tempPassword,
        role: "PARENT",
      },
    });
  }

  // Find or create parent
  let parent = await db.parent.findUnique({ where: { userId: user.id } });
  if (!parent) {
    parent = await db.parent.create({
      data: {
        userId: user.id,
        phone: reg.parentPhone,
        address: reg.parentAddress,
      },
    });
  }

  // Create player
  const player = await db.player.create({
    data: {
      firstName: reg.playerFirstName,
      lastName: reg.playerLastName,
      dateOfBirth: reg.playerDob,
      gender: reg.playerGender,
      playerType: reg.playerType,
      ageGroup: reg.ageGroup,
      parentId: parent.id,
      civilIdImage: reg.civilIdImage,
      civilIdNumber: reg.civilIdNumber,
      nationality: reg.civilIdNationality,
    },
  });

  // Create subscription
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 10);

  const sub = await db.subscription.create({
    data: {
      playerId: player.id,
      parentId: parent.id,
      type: "NEW_MEMBERSHIP",
      plan: reg.plan,
      status: "ACTIVE",
      startDate: now,
      endDate,
      totalSessions: 40,
      amount: reg.amount,
      discount: reg.discount,
      mfPaymentId: reg.mfPaymentId,
      mfPaymentRef: reg.mfPaymentRef,
      mfPaymentStatus: "Paid",
      mfPaymentDate: new Date(),
    },
  });

  // Update registration record
  await db.publicRegistration.update({
    where: { id: regId },
    data: {
      status: "COMPLETED",
      playerId: player.id,
      subscriptionId: sub.id,
    },
  });
}
