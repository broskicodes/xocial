CREATE TYPE "public"."engagement_type" AS ENUM('like', 'retweet', 'reply', 'quote');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "engagements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"handle_id" bigint NOT NULL,
	"engaged_tweet_id" bigint NOT NULL,
	"engagement_type" "engagement_type" NOT NULL,
	"tweet_id" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "engagements_tweet_id_unique" UNIQUE("tweet_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "job_status" NOT NULL,
	"type" text NOT NULL,
	"params" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tweets" (
	"tweet_id" bigint PRIMARY KEY NOT NULL,
	"handle_id" bigint NOT NULL,
	"url" text NOT NULL,
	"text" text NOT NULL,
	"date" timestamp NOT NULL,
	"bookmark_count" integer NOT NULL,
	"retweet_count" integer NOT NULL,
	"reply_count" integer NOT NULL,
	"like_count" integer NOT NULL,
	"quote_count" integer NOT NULL,
	"view_count" integer NOT NULL,
	"language" text NOT NULL,
	"is_reply" boolean NOT NULL,
	"is_retweet" boolean NOT NULL,
	"is_quote" boolean NOT NULL,
	"parent_tweet_id" bigint,
	"entities" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "twitter_handles" (
	"id" bigint PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"pfp" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "twitter_handles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"twitter_handle_id" bigint NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"oauth_token" text,
	"oauth_token_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_twitter_handle_id_unique" UNIQUE("twitter_handle_id")
);
--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_handle_id_twitter_handles_id_fk" FOREIGN KEY ("handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_engaged_tweet_id_tweets_tweet_id_fk" FOREIGN KEY ("engaged_tweet_id") REFERENCES "public"."tweets"("tweet_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engagements" ADD CONSTRAINT "engagements_tweet_id_tweets_tweet_id_fk" FOREIGN KEY ("tweet_id") REFERENCES "public"."tweets"("tweet_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_handle_id_twitter_handles_id_fk" FOREIGN KEY ("handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_twitter_handle_id_twitter_handles_id_fk" FOREIGN KEY ("twitter_handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_engagement_idx" ON "engagements" USING btree ("user_id","handle_id","engaged_tweet_id","engagement_type") WHERE "engagements"."engagement_type" IN ('like', 'retweet');