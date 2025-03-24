"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { toolsData } from "./toolsData";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null; // Or a loading spinner
  }

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto">
      <div className="p-6">
        <Card>
          <CardHeader className="p-6 flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/bbyo-logo.png"
                alt="BBYO Logo"
                width={40}
                height={40}
              />
              <h2 className="text-2xl font-bold text-gray-800 px-4">
                FY25 BBYO Utilities
              </h2>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5" />
                  )}
                  <span>Welcome, {session.user?.name?.split(" ")[0]}!</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-8">
              {/* Active Tools */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                  Active Tools
                </h3>
                <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {toolsData
                    .filter((tool) => !tool.deprecated && tool.type === "tool")
                    .map((tool) => (
                      <li key={tool.route}>
                        <Link href={tool.route}>
                          <div className="group block p-6 rounded-lg bg-white shadow-md dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h3 className="text-lg font-semibold mb-2">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Forms */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">
                  Forms
                </h3>
                <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {toolsData
                    .filter((tool) => !tool.deprecated && tool.type === "form")
                    .map((tool) => (
                      <li key={tool.route}>
                        <Link href={tool.route}>
                          <div className="group block p-6 rounded-lg bg-white shadow-md dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                            <h3 className="text-lg font-semibold mb-2">
                              {tool.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Deprecated Tools */}
              {toolsData.some((tool) => tool.deprecated) && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">
                    Deprecated Tools
                  </h3>
                  <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {toolsData
                      .filter((tool) => tool.deprecated)
                      .map((tool) => (
                        <li key={tool.route}>
                          <div className="group block p-6 rounded-lg bg-gray-100 shadow-md dark:bg-gray-800 border border-gray-200 cursor-not-allowed opacity-60">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-500">
                                {tool.name}
                              </h3>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                Deprecated
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {tool.description}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
