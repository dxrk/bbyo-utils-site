"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function ToolRequest() {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    toolName: "",
    description: "",
    useCase: "",
    priority: "",
    comments: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "tool-request",
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      setIsSubmitted(true);
      toast({
        title: "Request Submitted",
        description: "Your tool request has been sent successfully.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSubmitted) {
    return (
      <main className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Image
                  src="/bbyo-logo.png"
                  alt="BBYO Logo"
                  width={40}
                  height={40}
                />
                <h2 className="text-2xl font-bold text-green-600">
                  Request Submitted Successfully!
                </h2>
              </div>
              <Link href="/utils">
                <Button variant="outline">Back to Utilities</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600">
                Your tool request has been sent. You can follow up with Ben
                Talesnik (btalesnik@bbyo.org) with any additional questions.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/bbyo-logo.png"
                alt="BBYO Logo"
                width={40}
                height={40}
              />
              <h2 className="text-2xl font-bold">Tool Request</h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                required
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                required
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Advisor">Advisor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                required
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tool Name</label>
              <Input
                required
                placeholder="Name of the tool you're requesting"
                value={formData.toolName}
                onChange={(e) => handleChange("toolName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                required
                placeholder="Brief description of what the tool should do"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Use Case</label>
              <Textarea
                required
                placeholder="How would you use this tool? What problem does it solve?"
                value={formData.useCase}
                onChange={(e) => handleChange("useCase", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                required
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Comments</label>
              <Textarea
                placeholder="Any additional information or specific requirements"
                value={formData.comments}
                onChange={(e) => handleChange("comments", e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
