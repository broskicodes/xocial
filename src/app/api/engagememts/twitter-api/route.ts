import { NextRequest, NextResponse } from "next/server";
import { createTwitterClient } from "@/lib/serverUtils";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db/drizzle";
import { twitterHandles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Tweet } from "@/lib/types";

async function insertHandle(handle_id: string, handle: string, name: string) {
  await db.insert(twitterHandles).values({
    id: BigInt(handle_id),
    handle,
    name,
    verified: false,
    url: `https://x.com/${handle}`,
  }).onConflictDoUpdate({
    target: [twitterHandles.handle],
    set: {
      name,
      handle,
      url: `https://x.com/${handle}`,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const twitterUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!twitterUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    const job = request.nextUrl.searchParams.get("job");
    const { tweets } = (await request.json()) as { tweets: Tweet[] };
    const twitterClient = await createTwitterClient(session.user.id);

    switch (job) {
      case "likes": {
        const topTweets = tweets.sort((a, b) => b.like_count - a.like_count).slice(0, 5);
        const likingUsers = (
          await Promise.all(
            topTweets.slice(0, 1).map(async (tweet) => {
              const likingUsers = await twitterClient.v2.tweetLikedBy(tweet.tweet_id);
              return await Promise.all(likingUsers.data.map(async (liker: any) => {
                await insertHandle(liker.id, liker.username, liker.name);
                return {
                  ...liker,
                  tweet_id: tweet.tweet_id,
                };
              }));
            }),
          )
        ).flat();
        return NextResponse.json(likingUsers);
      }
      case "retweets": {
        const topTweets = tweets.sort((a, b) => b.retweet_count - a.retweet_count).slice(0, 5);
        const retweeters = (
          await Promise.all(
            topTweets.slice(0, 1).map(async (tweet) => {
              const retweeters = await twitterClient.v2.tweetRetweetedBy(tweet.tweet_id);
              return await Promise.all(retweeters.data.map(async (retweeter: any) => {
                await insertHandle(retweeter.id, retweeter.username, retweeter.name);
                return {
                  ...retweeter,
                  tweet_id: tweet.tweet_id,
                };
              }));
            }),
          )
        ).flat();
        return NextResponse.json(retweeters);
      }
      default:
        return new NextResponse("Invalid job", { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
