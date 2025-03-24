"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { checksData } from "./checksData";

type RoomCheck = {
  name: string;
  route: string;
  deprecated?: boolean;
};

const RoomChecksLandingPage: React.FC = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    <main className="container mx-auto p-6">
      <Card>
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/bbyo-logo.png"
                alt="BBYO Logo"
                width={40}
                height={40}
              />
              <h2 className="text-2xl font-bold">Room Checks</h2>
            </div>
            {session === undefined ? (
              <div className="skeleton w-32 h-10 bg-gray-300 rounded"></div>
            ) : isLoggedIn ? (
              <Link href="/utils">
                <Button variant="outline">Back to Utilities</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="outline">Login for Utilities</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-lg">
              Welcome to the Room Checks landing page. Here you can manage and
              view room checks for various BBYO events.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {checksData.map((roomCheck: RoomCheck) => (
                <div key={roomCheck.route}>
                  {roomCheck.deprecated ? (
                    <div className="group block p-6 rounded-lg bg-gray-100 shadow-md dark:bg-gray-800 border border-gray-200 cursor-not-allowed opacity-60">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-500">
                          {roomCheck.name}
                        </h3>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Deprecated
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Manage room checks for {roomCheck.name}.
                      </p>
                    </div>
                  ) : (
                    <Link href={`/room-checks/${roomCheck.route}`}>
                      <div className="group block p-6 rounded-lg bg-white shadow-md dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                        <h3 className="text-lg font-semibold mb-2">
                          {roomCheck.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Manage room checks for {roomCheck.name}.
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default RoomChecksLandingPage;
