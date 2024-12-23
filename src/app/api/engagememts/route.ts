import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { engagements, twitterHandles } from "@/lib/db/schema";
import { Engagement } from "@/lib/types";
import { eq } from "drizzle-orm";
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

async function getUserEngagements(user_id: string): Promise<Engagement[]> {
  const userEngagements = await db
    .select({
      author: {
        id: twitterHandles.id,
        handle: twitterHandles.handle,
      },
      type: engagements.engagement_type,
      parent_tweet_id: engagements.engaged_tweet_id,
      tweet_id: engagements.tweet_id,
    })
    .from(engagements)
    .innerJoin(twitterHandles, eq(engagements.handle_id, twitterHandles.id))
    .where(eq(engagements.user_id, user_id));

  return userEngagements.map((engagement) => ({
    author: {
      id: engagement.author?.id.toString(),
      handle: engagement.author?.handle,
    },
    type: engagement.type,
    parent_tweet_id: engagement.parent_tweet_id.toString(),
    tweet_id: engagement.tweet_id?.toString(),
  }));
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEngagements = await getUserEngagements(session.user.id);
  return NextResponse.json(userEngagements, { status: 200 });
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