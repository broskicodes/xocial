import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      handle?: string | null;
      verified?: boolean | null;
      // subscribed?: boolean | null;
      onboarded?: boolean | null;
      created_at?: string | null;
    };
  }
}

export enum TwitterScrapeType {
  Initialize = "initialize",
  Monthly = "monthly",
  Weekly = "weekly",
  Daily = "daily",
  Update = "update",
  Micro = "micro",
}

export interface TwitterAuthor {
  id: string;
  name: string;
  handle: string;
  pfp: string;
  url: string;
  verified: boolean;
  followers?: number;
  description?: string;
}

export interface TweetEntity {
  urls: Array<{
    url: string;
  }>;
  media: Array<{
    type: string;
    url: string;
  }> | null;
}

export interface Tweet {
  tweet_id: string;
  author: TwitterAuthor;
  url: string;
  text: string;
  date: string;
  bookmark_count: number;
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  view_count: number;
  language: string;
  entities: TweetEntity;
  is_reply: boolean;
  is_retweet: boolean;
  is_quote: boolean;
  is_thread: boolean;
  parent_tweet_id?: string;
}

export interface Engagement {
  parent_tweet_id: string;
  tweet_id?: string;
  author: {
    id: string;
    handle: string;
  };
  type: "reply" | "quote" | "like" | "retweet";
}

export interface EngagementStats {
  [authorId: string]: {
    handle: string;
    engagements: {
      [key in "reply" | "quote" | "like" | "retweet"]: number;
    };
  };
}
