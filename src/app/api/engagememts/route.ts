import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { engagements } from "@/lib/db/schema";
import { Engagement } from "@/lib/types";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";


async function insertEngagement(user_id: string, engagement: Engagement) {
  await db.insert(engagements).values({
    user_id,
    handle_id: BigInt(engagement.author.id),
    engaged_tweet_id: BigInt(engagement.parent_tweet_id),
    engagement_type: engagement.type,
    tweet_id: engagement.tweet_id ? BigInt(engagement.tweet_id) : null,
  })
  .onConflictDoNothing();
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { engagements } = await request.json();

  for (const engagement of engagements) {
    await insertEngagement(session.user.id, engagement);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}