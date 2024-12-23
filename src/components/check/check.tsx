import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { ClientMessageType, MessageStatus, useWebSocketStore } from "@/stores/websocket";
import { Engagement, EngagementStats, Tweet, TwitterScrapeType } from "@/lib/types";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function CheckPulse() {
  const { data: session } = useSession();
  const { trackedMessages, send } = useWebSocketStore();
  const [isLoading, setIsLoading] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [stats, setStats] = useState<EngagementStats>({});
  const [stage, setStage] = useState(0);
  const [selectedEngagements, setSelectedEngagements] = useState<{
    handle: string;
    type: string;
    tweetIds: string[];
  } | null>(null);

  const getTweets = async () => {
    const msgId = send({
      type: ClientMessageType.Tweets,
      payload: {
        scrapeType: TwitterScrapeType.Weekly,
        handles: [session?.user?.handle],
      },
    });
    setMessageId(msgId);
    setIsLoading(true);
  };

  const getLikesAndRetweets = async () => {
    setIsLoading(true);

    const likesResponse = await fetch("/api/engagememts/twitter-api?job=likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tweets }),
    });
    const likes = await likesResponse.json();
    console.log(likes);

    const retweetsResponse = await fetch("/api/engagememts/twitter-api?job=retweets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tweets }),
    });
    const retweets = await retweetsResponse.json();
    console.log(retweets);

    if (retweetsResponse.ok && likesResponse.ok) {
      setEngagements((engagements) => [
        ...engagements,
        ...retweets.map((retweet: any) => ({
          parent_tweet_id: retweet.tweet_id,
          author: {
            id: retweet.id,
            handle: retweet.username,
          },
          type: "retweet",
        })),
        ...likes.map((like: any) => ({
          parent_tweet_id: like.tweet_id,
          author: {
            id: like.id,
            handle: like.username,
          },
          type: "like",
        })),
      ]);
      setStage(3);
    } else {
      toast.error("Twitter is rate limitimg us :(. Please try again in a few minutes.");
      setStage(0);
    }
    setIsLoading(false);
  };

  const getQuotesAndReplies = async () => {
    const msgId = send({
      type: ClientMessageType.Engagements,
      payload: {
        tweetIds: tweets.map((tweet) => tweet.tweet_id),
        handle: session?.user?.handle,
      },
    });
    setMessageId(msgId);
    setIsLoading(true);
  };

  const saveEngagements = async () => {
    const response = await fetch("/api/engagememts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ engagements }),
    });
    if (response.ok) {
      toast.success("Engagements saved successfully");
      setStage(5);
    } else {
      toast.error("Failed to save engagements");
      setStage(0);
    }
  };
  // const handleCheckPulse = async () => {
  //   const likes = await getLikesAndRetweets();
  //   const quotes = await getQuotesAndReplies();
  // };

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      
      (async () => {
        const response = await fetch("/api/engagememts");
        const userEngagements = await response.json();

        if (response.ok && userEngagements && userEngagements.length > 0) {
          setEngagements(userEngagements);
          setStage(5);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [session]);

  useEffect(() => {
    if (messageId && trackedMessages.has(messageId)) {
      const msg = trackedMessages.get(messageId);
      if (msg?.status === MessageStatus.Success) {
        switch (msg.message.type) {
          case ClientMessageType.Tweets:
            console.log(msg.response);
            setTweets(msg.response?.payload as Tweet[]);
            setStage(2);
            break;
          case ClientMessageType.Engagements:
            const engagements = (msg.response?.payload as Tweet[]).map((tweet) => ({
              parent_tweet_id: tweet.parent_tweet_id,
              tweet_id: tweet.tweet_id,
              author: {
                id: tweet.author.id,
                handle: tweet.author.handle,
              },
              type: tweet.is_reply ? "reply" : "quote",
            })) as Engagement[];
            setEngagements((oldEngagements) => [...oldEngagements, ...engagements]);
            console.log(engagements);
            setStage(4);
            break;
        }
        setMessageId(null);
        setIsLoading(false);
      }
    }
  }, [trackedMessages, messageId]);

  useEffect(() => {
    const newStats = engagements.reduce((acc, { author, type }) => {
      if (!acc[author.id]) {
        acc[author.id] = {
          handle: author.handle,
          engagements: { reply: 0, quote: 0, like: 0, retweet: 0 },
        };
      }
      acc[author.id].engagements[type]++;
      return acc;
    }, {} as EngagementStats);

    setStats(newStats);

    // Log sorted stats
    const sortedStats = Object.entries(newStats)
      .map(([id, data]) => ({
        id,
        handle: data.handle,
        total: Object.values(data.engagements).reduce((a, b) => a + b, 0),
        ...data.engagements,
      }))
      .sort((a, b) => b.total - a.total);

    console.log(sortedStats);
  }, [engagements]);

  useEffect(() => {
    switch (stage) {
      case 1:
        getTweets();
        break;
      case 2:
        toast.success(`Fetched ${tweets.length} tweets`);
        getLikesAndRetweets();
        break;
      case 3:
        getQuotesAndReplies();
        break;
      case 4:
        toast.success(`Fetched ${engagements.length} total engagements`);
        saveEngagements();
        break;
      case 5:
        break;
      default:
        break;
    }
  }, [stage]);

  const getEngagementsForUser = (handle: string, type: "like" | "retweet" | "reply" | "quote") => {
    return engagements
      .filter((e) => e.author.handle === handle && e.type === type)
      .map((e) => e.parent_tweet_id);
  };

  const renderStageView = () => {
    switch (stage) {
      case 0:
        return (
          <Button disabled={isLoading} size="lg" onClick={() => setStage(1)}>
            Get Started
          </Button>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              </div>
              <span className="font-bold">Getting your tweets from the last 7 days...</span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              </div>
              <span className="font-bold">
                Fetching likes and retweets from your top 5 tweets...
              </span>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              </div>
              <span className="font-bold">
                Fetching quotes and replies from {tweets.length} tweets...
              </span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
              </div>
              <span className="font-bold">Saving engagements to database...</span>
            </div>
          </div>
        );
      case 5:
        const sortedStats = Object.entries(stats)
          .map(([id, data]) => ({
            id,
            handle: data.handle,
            total: Object.values(data.engagements).reduce((a, b) => a + b, 0),
            ...data.engagements,
          }))
          .sort((a, b) => b.total - a.total);

        return (
          <div className="space-y-4">
            <div>
              <span className="font-bold">Your top engagers!</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Likes</th>
                    <th className="px-4 py-2 text-center">Retweets</th>
                    <th className="px-4 py-2 text-center">Replies</th>
                    <th className="px-4 py-2 text-center">Quotes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedStats.map((stat, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 flex items-center gap-2">
                        <Link href={`https://twitter.com/${stat.handle}`} target="_blank">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={`https://unavatar.io/twitter/${stat.handle}`} />
                            <AvatarFallback>{stat.handle.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <span className="font-medium text-muted-foreground">@{stat.handle}</span>
                      </td>
                      <td className="px-4 py-2 text-center font-bold">{stat.total}</td>
                      {["like", "retweet", "reply", "quote"].map((type) => {
                        const tweetIds = getEngagementsForUser(stat.handle, type as any);
                        const count = stat[type as keyof typeof stat] as number;

                        return (
                          <td key={type} className="px-4 py-2 text-center">
                            {count > 0 ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="cursor-pointer hover:bg-muted px-2 py-1 rounded">
                                    {count}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <div className="font-medium">
                                      {type.charAt(0).toUpperCase()}
                                      {type.slice(1)}s from @{stat.handle}
                                    </div>
                                    {tweetIds.map((tweetId) => (
                                      <Link
                                        key={tweetId}
                                        href={`https://twitter.com/i/web/status/${tweetId}`}
                                        target="_blank"
                                        className="block p-2 hover:bg-muted rounded-md"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-muted-foreground">
                                            {tweetId}
                                          </span>
                                          <span className="text-sm">→</span>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              count
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  return <div className="space-y-4">{renderStageView()}</div>;
}
