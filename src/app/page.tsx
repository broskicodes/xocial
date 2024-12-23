"use client";

import { Header } from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Twitter } from "lucide-react";
import { CheckPulse } from "@/components/check/check";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen w-full bg-background relative">
      <main className="flex-1 flex flex-col h-screen w-full bg-background">
        {/* <BannerCTA /> */}
        <Header />
        <div className="flex justify-center items-center h-full flex-1">
          <div className="flex flex-col items-center gap-4 h-full justify-center">
            <div className="flex flex-col items-center gap-6 mb-12">
              <h1 className="max-w-3xl text-center font-heading text-4xl font-semibold sm:text-5xl tracking-tight">
                {"Who's engaging with your tweets?"}
              </h1>
              <p className="max-w-xl text-center text-base text-gray-500 sm:text-lg">
                {"Track which followers engage the most with your content. See who your \"hot leads\" are and how well your posts are converting."}
              </p>
            </div>
            {!session && (
              <div className="flex flex-col items-center gap-2">
                <Button size="lg" onClick={() => signIn("twitter")}>
                  <Twitter className="mr-2 h-5 w-5" fill="currentColor" />
                  Get Started
                </Button>
                <span className="text-sm text-gray-500">{"Try it, it's free!"}</span>
              </div>
            )}
            {session && <CheckPulse />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
