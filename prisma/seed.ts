import { PrismaClient, Role, AgeGroup, PlayerStatus, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Hattrick demo accounts...\n");

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // ── 1. Admin ──────────────────────────────────────────────────────────────
  const adminUser = await db.user.upsert({
    where: { email: "admin@hattrick.kw" },
    update: {},
    create: {
      email: "admin@hattrick.kw",
      name: "Ahmad Al-Rashidi",
      password: await hash("admin123"),
      role: Role.ADMIN,
    },
  });
  console.log("✅ Admin:       admin@hattrick.kw       / admin123");

  // ── 2. Manager ───────────────────────────────────────────────────────────
  const managerUser = await db.user.upsert({
    where: { email: "manager@hattrick.kw" },
    update: {},
    create: {
      email: "manager@hattrick.kw",
      name: "Sara Al-Kandari",
      password: await hash("manager123"),
      role: Role.MANAGER,
    },
  });
  console.log("✅ Manager:     manager@hattrick.kw     / manager123");

  // ── 3. Coach ─────────────────────────────────────────────────────────────
  const coachUser = await db.user.upsert({
    where: { email: "coach@hattrick.kw" },
    update: {},
    create: {
      email: "coach@hattrick.kw",
      name: "Mohammed Al-Ajmi",
      password: await hash("coach123"),
      role: Role.COACH,
    },
  });

  const coach = await db.coach.upsert({
    where: { userId: coachUser.id },
    update: {},
    create: {
      userId: coachUser.id,
      coachRole: "HEAD_COACH",
      speciality: "Midfield & Tactics",
      licenseNo: "KFA-2024-001",
      hireDate: new Date("2023-09-01"),
    },
  });
  console.log("✅ Coach:       coach@hattrick.kw       / coach123");

  // ── 4. Parent ─────────────────────────────────────────────────────────────
  const parentUser = await db.user.upsert({
    where: { email: "parent@hattrick.kw" },
    update: {},
    create: {
      email: "parent@hattrick.kw",
      name: "Khalid Al-Rashidi",
      password: await hash("parent123"),
      role: Role.PARENT,
      phone: "+965 9123 4567",
    },
  });

  const parent = await db.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      address: "Block 5, Street 12, Salmiya, Kuwait",
      relationship: "Father",
      phone: "+965 9123 4567",
    },
  });
  console.log("✅ Parent:      parent@hattrick.kw      / parent123");

  // ── 5. Call Center ────────────────────────────────────────────────────────
  const callCenterUser = await db.user.upsert({
    where: { email: "callcenter@hattrick.kw" },
    update: {},
    create: {
      email: "callcenter@hattrick.kw",
      name: "Fatima Al-Sabah",
      password: await hash("callcenter123"),
      role: Role.CALL_CENTER,
      phone: "+965 9876 5432",
    },
  });
  console.log("✅ Call Center: callcenter@hattrick.kw  / callcenter123");

  // ── 6. Demo player linked to parent ──────────────────────────────────────
  const player = await db.player.upsert({
    where: { id: "demo-player-001" },
    update: {},
    create: {
      id: "demo-player-001",
      firstName: "Omar",
      lastName: "Al-Rashidi",
      dateOfBirth: new Date("2015-04-12"),
      gender: Gender.MALE,
      ageGroup: AgeGroup.U11,
      playerType: "OUTFIELD",
      position: "Midfielder",
      jerseyNumber: 10,
      status: PlayerStatus.ACTIVE,
      parentId: parent.id,
      enrollmentDate: new Date("2024-09-01"),
      clothingSize: "M",
      preferredShirtName: "OMAR",
      preferredShirtNumber: 10,
    },
  });

  // Second player for the same parent (sibling)
  const player2 = await db.player.upsert({
    where: { id: "demo-player-002" },
    update: {},
    create: {
      id: "demo-player-002",
      firstName: "Yousef",
      lastName: "Al-Rashidi",
      dateOfBirth: new Date("2017-08-20"),
      gender: Gender.MALE,
      ageGroup: AgeGroup.U8,
      playerType: "GOALKEEPER",
      position: "Goalkeeper",
      jerseyNumber: 1,
      status: PlayerStatus.ACTIVE,
      parentId: parent.id,
      enrollmentDate: new Date("2024-10-01"),
      clothingSize: "S",
      preferredShirtName: "YOUSEF",
      preferredShirtNumber: 1,
    },
  });
  console.log("✅ Players:     Omar (U11) + Yousef (U8, GK)");

  // ── 7. Demo groups ────────────────────────────────────────────────────────
  const group = await db.group.upsert({
    where: { id: "demo-group-001" },
    update: {},
    create: {
      id: "demo-group-001",
      name: "Eagles U11",
      ageGroup: AgeGroup.U11,
      maxCapacity: 16,
      description: "Under-11 development squad",
    },
  });

  const groupU9 = await db.group.upsert({
    where: { id: "demo-group-002" },
    update: {},
    create: {
      id: "demo-group-002",
      name: "Falcons U8",
      ageGroup: AgeGroup.U8,
      maxCapacity: 14,
      description: "Under-9 beginner squad",
    },
  });

  await db.groupPlayer.upsert({
    where: { groupId_playerId: { groupId: group.id, playerId: player.id } },
    update: {},
    create: { groupId: group.id, playerId: player.id },
  });

  await db.groupPlayer.upsert({
    where: { groupId_playerId: { groupId: groupU9.id, playerId: player2.id } },
    update: {},
    create: { groupId: groupU9.id, playerId: player2.id },
  });
  console.log("✅ Groups:      Eagles U11, Falcons U8");

  // ── 8. Demo training sessions ─────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(16, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(17, 30, 0, 0);

  const sessionExists = await db.trainingSession.findFirst({ where: { groupId: group.id, coachId: coach.id } });
  if (!sessionExists) {
    await db.trainingSession.create({
      data: {
        title: "Tactical Training",
        groupId: group.id,
        coachId: coach.id,
        pitch: "PITCH_1",
        startTime: tomorrow,
        endTime: tomorrowEnd,
        status: "SCHEDULED",
        notes: "Focus on passing and positioning",
      },
    });
    console.log("✅ Session:     Tactical Training (tomorrow, Pitch 1)");
  }

  // ── 9. Demo payment ───────────────────────────────────────────────────────
  const paymentExists = await db.payment.findFirst({ where: { parentId: parent.id } });
  if (!paymentExists) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    await db.payment.create({
      data: {
        parentId: parent.id,
        playerId: player.id,
        type: "MONTHLY",
        amount: 75.0,
        currency: "KWD",
        status: "PENDING",
        dueDate,
      },
    });
    console.log("✅ Payment:     75 KWD monthly fee (pending)");
  }

  // ── 10. Demo subscriptions ────────────────────────────────────────────────
  const subExists = await db.subscription.findFirst({ where: { playerId: player.id } });
  if (!subExists) {
    const startDate = new Date("2024-09-01");
    const endDate = new Date("2025-06-30");
    await db.subscription.create({
      data: {
        playerId: player.id,
        parentId: parent.id,
        type: "NEW_MEMBERSHIP",
        status: "ACTIVE",
        startDate,
        endDate,
        totalSessions: 40,
        usedSessions: 12,
        maxPostponements: 3,
        usedPostponements: 1,
        amount: 72.0,
        discount: 0,
      },
    });
    await db.subscription.create({
      data: {
        playerId: player2.id,
        parentId: parent.id,
        type: "NEW_MEMBERSHIP",
        status: "ACTIVE",
        startDate,
        endDate,
        totalSessions: 40,
        usedSessions: 8,
        maxPostponements: 3,
        usedPostponements: 0,
        amount: 60.0,
        discount: 12.0,
        loyaltyBenefitApplied: false,
      },
    });
    console.log("✅ Subs:        2 active subscriptions (Omar 72 KWD, Yousef 60 KWD)");
  }

  // ── 11. Demo coupon ───────────────────────────────────────────────────────
  const couponExists = await db.coupon.findFirst({ where: { code: "HATTRICK10" } });
  if (!couponExists) {
    await db.coupon.create({
      data: {
        code: "HATTRICK10",
        type: "PERCENTAGE",
        value: 10,
        maxUses: 100,
        usedCount: 3,
        minPlayers: 1,
        validFrom: new Date("2024-01-01"),
        validUntil: new Date("2025-12-31"),
        isActive: true,
      },
    });
    await db.coupon.create({
      data: {
        code: "FAMILY20",
        type: "FIXED",
        value: 20,
        maxUses: 50,
        usedCount: 0,
        minPlayers: 2,
        validFrom: new Date("2024-06-01"),
        validUntil: new Date("2025-12-31"),
        isActive: true,
      },
    });
    console.log("✅ Coupons:     HATTRICK10 (10%), FAMILY20 (20 KWD off)");
  }

  // ── 12. Demo merchandise ──────────────────────────────────────────────────
  const merchExists = await db.merchandise.findFirst({ where: { name: "Academy Jersey" } });
  if (!merchExists) {
    await db.merchandise.create({
      data: { name: "Academy Jersey", description: "Official Hattrick Heroes training jersey", category: "CLOTHING", price: 15.0, stock: 50, sizes: "XS,S,M,L,XL", isActive: true },
    });
    await db.merchandise.create({
      data: { name: "Training Shorts", description: "Black training shorts with logo", category: "CLOTHING", price: 8.0, stock: 60, sizes: "XS,S,M,L,XL", isActive: true },
    });
    await db.merchandise.create({
      data: { name: "Academy Socks", description: "Knee-high performance socks", category: "SOCKS", price: 3.5, stock: 100, sizes: "S,M,L", isActive: true },
    });
    await db.merchandise.create({
      data: { name: "Training Ball", description: "Size 4 training football", category: "EQUIPMENT", price: 12.0, stock: 30, isActive: true },
    });
    console.log("✅ Merch:       4 merchandise items");
  }

  // ── 13. Demo announcements ────────────────────────────────────────────────
  const announcementExists = await db.announcement.findFirst({ where: { title: "Welcome to Hattrick Academy!" } });
  if (!announcementExists) {
    await db.announcement.create({
      data: {
        title: "Welcome to Hattrick Academy!",
        body: "We are excited to have you join the Hattrick Heroes Football Academy. Training for the new season starts next week. Please make sure all registration fees are paid by the end of the month.",
        target: "ALL",
        pinned: true,
      },
    });
    await db.announcement.create({
      data: {
        title: "Parent Meeting — Season Kickoff",
        body: "All parents are invited to attend our season kickoff meeting on Saturday at 5:00 PM at the academy clubhouse. We will discuss the training schedule, fees, and academy rules.",
        target: "PARENTS",
        pinned: false,
      },
    });
    console.log("✅ Announce:    2 demo announcements");
  }

  // ── 14. Demo notification ─────────────────────────────────────────────────
  const notifExists = await db.notification.findFirst({ where: { userId: parentUser.id } });
  if (!notifExists) {
    await db.notification.create({
      data: {
        userId: parentUser.id,
        type: "SESSION_REMINDER",
        channel: "PLATFORM",
        title: "Training Tomorrow",
        body: "Omar has Tactical Training tomorrow at 4:00 PM on Pitch 1.",
        isRead: false,
      },
    });
    await db.notification.create({
      data: {
        userId: parentUser.id,
        type: "PAYMENT_CONFIRM",
        channel: "PLATFORM",
        title: "Payment Due Soon",
        body: "Your monthly fee of 75 KWD is due in 7 days.",
        isRead: false,
      },
    });
    console.log("✅ Notifs:      2 demo notifications for parent");
  }

  console.log("\n🎉 Seed complete! Demo login credentials:\n");
  console.log("  Role        | Email                    | Password");
  console.log("  ------------|--------------------------|---------------");
  console.log("  Admin       | admin@hattrick.kw        | admin123");
  console.log("  Manager     | manager@hattrick.kw      | manager123");
  console.log("  Coach       | coach@hattrick.kw        | coach123");
  console.log("  Parent      | parent@hattrick.kw       | parent123");
  console.log("  Call Center | callcenter@hattrick.kw   | callcenter123");
  console.log("");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
