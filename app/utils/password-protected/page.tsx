"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";

export default function DeprecatedPassword() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/utils/verify-password-protected", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        router.push(redirect);
      } else {
        toast({
          title: "Error",
          description: "Invalid password. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {/* bbyo logo */}
          <Image
            className="mx-auto"
            src="/bbyo-logo.png"
            width={50}
            height={50}
            alt="BBYO Logo"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Access Deprecated Tool
          </h1>
          <p className="text-sm text-muted-foreground">
            This tool is deprecated. Please enter the password to continue.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Continue"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/utils")}
          >
            Back to Utilities
          </Button>
        </form>
      </div>
    </div>
  );
}
