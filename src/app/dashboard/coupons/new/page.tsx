import { Header } from "@/components/layout/header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CouponForm } from "@/components/registration/coupon-form";

export default async function NewCouponPage() {
  const session = await auth();
  const role = (session?.user as { role?: Role })?.role;
  if (role !== Role.ADMIN) {
    redirect("/dashboard/access-denied");
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="New Coupon" subtitle="Create a new discount code" />
      <div className="flex-1 overflow-auto p-6">
        <CouponForm />
      </div>
    </div>
  );
}
