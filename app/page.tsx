"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="w-full max-w-3xl text-center space-y-8">
        {/* Logo and Title */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <Image
              src="/bbyo-logo.png"
              alt="BBYO Logo"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            BBYO Utilities Portal
          </h1>
          <p className="text-xl text-gray-600">
            Access tools and resources for BBYO staff and advisors
          </p>
        </div>

        {/* Login/Welcome Card */}
        <Card className="p-8 shadow-lg">
          {session ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircle className="w-12 h-12 text-gray-400" />
                )}
                <div className="text-left">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Welcome back, {session.user?.name?.split(" ")[0]}!
                  </h2>
                  <p className="text-gray-600">{session.user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push("/utils")}
                >
                  Go to Utilities
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 text-lg"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Sign in with your BBYO Outlook account to continue
                </p>
              </div>

              <Button
                className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => signIn("azure-ad", { callbackUrl: "/utils" })}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  "Loading..."
                ) : (
                  <>
                    <Image
                      src="/microsoft.svg"
                      alt="Microsoft Logo"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Sign in with Outlook
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <footer className="text-sm text-gray-500">
          <p>
            For BBYO staff and advisors only. Contact{" "}
            <a
              href="mailto:btalesnik@bbyo.org"
              className="text-blue-600 hover:underline"
            >
              btalesnik@bbyo.org
            </a>{" "}
            for support.
          </p>
        </footer>
      </div>
    </main>
  );
}
