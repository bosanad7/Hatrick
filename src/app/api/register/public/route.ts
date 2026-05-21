import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createPayment } from "@/lib/myfatoorah";
import { getAutoAgeGroup, PLAN_PRICES } from "@/lib/pricing";
import type { SubscriptionPlan } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      parentName, parentEmail, parentPhone, parentAddress,
      playerFirstName, playerLastName, playerDob, playerGender, playerType,
      plan, couponCode,
      civilIdImage, civilIdNumber, civilIdName, civilIdDob, civilIdNationality, civilIdConfirmed,
    } = body;

    // Validate required fields
    if (!parentName || !parentEmail || !parentPhone) {
      return NextResponse.json({ error: "Parent name, email, and phone are required" }, { status: 400 });
    }
    if (!playerFirstName || !playerLastName || !playerDob) {
      return NextResponse.json({ error: "Player name and date of birth are required" }, { status: 400 });
    }

    const selectedPlan = (plan || "TRAINING_ONLY") as SubscriptionPlan;
    const ageGroup = getAutoAgeGroup(playerDob);
    let amount = PLAN_PRICES[selectedPlan];
    let discount = 0;

    // Validate coupon if provided
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive) {
        const now = new Date();
        if (now >= coupon.validFrom && now <= coupon.validUntil) {
          if (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) {
            if (coupon.type === "PERCENTAGE") {
              discount = Math.round(amount * coupon.value / 100 * 100) / 100;
            } else {
              discount = coupon.value;
            }
            amount = Math.max(0, amount - discount);
          }
        }
      }
    }

    // Check free trial (no payment needed)
    if (body.freeTrial) {
      // Check if player with same name and parent email already used trial
      const existingPlayer = await db.player.findFirst({
        where: {
          firstName: playerFirstName,
          lastName: playerLastName,
          freeTrialUsed: true,
          parent: { user: { email: parentEmail } },
        },
      });
      if (existingPlayer) {
        return NextResponse.json({ error: "This player has already used their free trial" }, { status: 400 });
      }
    }

    // Create public registration record
    const registration = await db.publicRegistration.create({
      data: {
        parentName,
        parentEmail,
        parentPhone,
        parentAddress: parentAddress || null,
        playerFirstName,
        playerLastName,
        playerDob: new Date(playerDob),
        playerGender: playerGender || "MALE",
        playerType: playerType || "OUTFIELD",
        ageGroup: ageGroup as "U6" | "U8" | "U11" | "U14",
        plan: selectedPlan as "TRAINING_ONLY" | "TRAINING_WITH_KIT",
        amount,
        couponCode: couponCode || null,
        discount,
        civilIdImage: civilIdImage || null,
        civilIdNumber: civilIdNumber || null,
        civilIdName: civilIdName || null,
        civilIdDob: civilIdDob ? new Date(civilIdDob) : null,
        civilIdNationality: civilIdNationality || null,
        civilIdConfirmed: civilIdConfirmed || false,
        status: body.freeTrial ? "COMPLETED" : "PENDING",
      },
    });

    // If free trial, complete immediately without payment
    if (body.freeTrial) {
      await completeFreeTrial(registration.id);
      return NextResponse.json({
        success: true,
        registrationId: registration.id,
        freeTrial: true,
      });
    }

    // Create MyFatoorah payment
    if (amount > 0) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

      const payResult = await createPayment({
        invoiceValue: amount,
        displayName: `Hattrick Academy - ${playerFirstName} ${playerLastName}`,
        customerName: parentName,
        customerEmail: parentEmail,
        customerPhone: parentPhone,
        callBackUrl: `${baseUrl}/api/payment/callback`,
        errorUrl: `${baseUrl}/api/payment/callback?error=true`,
        userDefinedField: registration.id,
      });

      if (payResult.IsSuccess && payResult.Data) {
        await db.publicRegistration.update({
          where: { id: registration.id },
          data: {
            mfPaymentId: String(payResult.Data.InvoiceId),
            mfInvoiceUrl: payResult.Data.InvoiceURL,
          },
        });

        return NextResponse.json({
          success: true,
          registrationId: registration.id,
          paymentUrl: payResult.Data.InvoiceURL,
          invoiceId: payResult.Data.InvoiceId,
        });
      } else {
        return NextResponse.json({
          success: true,
          registrationId: registration.id,
          paymentUrl: null,
          note: "Payment gateway unavailable. Admin will contact you for payment.",
        });
      }
    }

    return NextResponse.json({ success: true, registrationId: registration.id });
  } catch (error) {
    console.error("Public registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

/** Complete a free trial registration immediately */
async function completeFreeTrial(regId: string) {
  const reg = await db.publicRegistration.findUnique({ where: { id: regId } });
  if (!reg) return;

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

  const player = await db.player.create({
    data: {
      firstName: reg.playerFirstName,
      lastName: reg.playerLastName,
      dateOfBirth: reg.playerDob,
      gender: reg.playerGender,
      playerType: reg.playerType,
      ageGroup: reg.ageGroup,
      parentId: parent.id,
      freeTrialUsed: true,
      freeTrialDate: new Date(),
      hasPreviousTrial: true,
    },
  });

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7); // Trial valid for 1 week

  const sub = await db.subscription.create({
    data: {
      playerId: player.id,
      parentId: parent.id,
      type: "FREE_TRIAL",
      status: "ACTIVE",
      startDate: now,
      endDate,
      totalSessions: 1,
      amount: 0,
    },
  });

  await db.publicRegistration.update({
    where: { id: regId },
    data: {
      status: "COMPLETED",
      playerId: player.id,
      subscriptionId: sub.id,
    },
  });
}
