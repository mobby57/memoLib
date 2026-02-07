import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Get subscription
    const subscription = await prisma.billingSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        payments: [],
      });
    }

    // Get payments
    const payments = await prisma.billingPayment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      subscription,
      payments,
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
