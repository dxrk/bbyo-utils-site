"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import React from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

let html2pdf: (
  arg0: HTMLDivElement,
  arg1: {
    margin: number;
    filename: string;
    image: { type: string; quality: number };
    html2canvas: {
      scale: number;
      // Set border to 0 to remove the border
      border: number;
    };
    jsPDF: {
      unit: string;
      format: number[]; // Width and height in millimeters
      orientation: string;
    };
  }
) => Promise<void>;

if (typeof window !== "undefined") {
  import("html2pdf.js").then((module) => {
    html2pdf = module.default;
  });
}

export default function ChartersUtil() {
  const [form, setForm] = useState({
    charterType: "Permanent",
    order: "AZA",
    names: "",
    chapterName: "",
    communityName: "",
    date: "",
  });

  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const [showPreview, setShowPreview] = useState(false);

  const [charterImage, setCharterImage] = useState("");
  const [charterImageId, setCharterImageId] = useState<string>("");
  const [charterFilename, setCharterFilename] = useState<string>("");

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const [override, setOverride] = useState({
    columns: NaN,
    yPosition: NaN,
    fontSize: NaN,
  });

  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session) {
    redirect("/");
  }

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOverride((prevOverride) => ({
      ...prevOverride,
      [name]: value === "" ? NaN : parseInt(value),
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const { order, names, communityName, charterType, chapterName } = form;

    generateCharter(
      order,
      names,
      communityName,
      charterType,
      chapterName,
      date,
      override
    );
  };

  async function generateCharter(
    order: string,
    memberList: string,
    community: string,
    charter: string,
    chapter: string,
    date: Date | undefined,
    override?: { columns: number; yPosition: number; fontSize: number }
  ) {
    toast({
      title: "Generating Charter...",
      description: `Generating ${order} ${charter} charter for ${chapter}...`,
    });

    // Set loading state
    setIsLoading(true);

    // block button from being pressed
    const button = document.getElementsByName(
      "generate"
    )[0] as HTMLButtonElement;
    button.disabled = true;

    // Filter out NaN values from override
    const filteredOverride = override
      ? {
          ...(isNaN(override.columns) ? {} : { columns: override.columns }),
          ...(isNaN(override.yPosition)
            ? {}
            : { yPosition: override.yPosition }),
          ...(isNaN(override.fontSize) ? {} : { fontSize: override.fontSize }),
        }
      : undefined;

    // Only send override if it has properties
    const finalOverride =
      filteredOverride && Object.keys(filteredOverride).length > 0
        ? filteredOverride
        : undefined;

    const charterType = `${order} ${charter} Charter Template`;
    try {
      // Use the new Next.js API endpoint instead of the Express server
      const res = await fetch("/api/charters/generate-charter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberList,
          chapter,
          community,
          charter: charterType,
          date,
          override: finalOverride,
        }),
      });

      if (res.status !== 200) {
        if (res.status === 400) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill out all fields.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "There was an error generating your charter.",
          });
        }
      } else {
        toast({
          title: "Charter Generated!",
          description: "Your charter has been generated.",
        });

        // Get the JSON response with imageId and filename
        const { imageId, filename } = await res.json();
        setCharterImageId(imageId);
        setCharterFilename(filename);

        // Now make a second request to get the actual image using the imageId
        const imageResponse = await fetch(
          `/api/charters/generate-charter?id=${imageId}&filename=${filename}`
        );
        const image = await imageResponse.blob();

        const url = URL.createObjectURL(image);

        setShowPreview(true);
        setCharterImage(url);
      }
    } catch (error: unknown) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error generating your charter.",
      });
    } finally {
      // Reset loading state
      setIsLoading(false);
      button.disabled = false;
    }
  }

  async function downloadPdf(charterType: string) {
    if (html2pdf) {
      const containerDiv = document.createElement("div");
      const imgElement = document.createElement("img");
      const format = charterType.includes("Temporary")
        ? [255, 420.3]
        : [330, 510];
      toast({
        title: "Downloading Charter...",
        description: `Downloading ${form.chapterName} ${form.charterType} charter...`,
      });
      imgElement.src = charterImage;
      containerDiv.appendChild(imgElement);

      const pdfOptions = {
        margin: 0,
        filename: `${form.chapterName}-${form.charterType}.pdf`,
        image: { type: "png", quality: 1 },
        html2canvas: {
          scale: 1.2,
          // Set border to 0 to remove the border
          border: 0,
        },
        jsPDF: {
          unit: "mm",
          format,
          orientation: "portrait",
        },
      };

      html2pdf(containerDiv, pdfOptions);
    }
  }

  // Function to directly download the generated image
  const downloadDirectImage = async () => {
    if (!charterImageId || !charterFilename) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "No charter image available to download",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Fetch the image using the stored ID and filename
      const imageResponse = await fetch(
        `/api/charters/generate-charter?id=${charterImageId}&filename=${charterFilename}`
      );

      if (!imageResponse.ok) {
        throw new Error("Failed to retrieve charter image");
      }

      const imageBlob = await imageResponse.blob();

      // Download the image
      const link = document.createElement("a");
      link.href = URL.createObjectURL(imageBlob);
      link.download = charterFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        variant: "default",
        title: "Charter Downloaded!",
        description: "Your charter has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading charter:", error);
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to download charter. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <h2 className="text-2xl font-bold">Chapter Charters Utility</h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="charterType"
                >
                  Charter Type:
                </label>
                <RadioGroup
                  defaultValue="Permanent"
                  onValueChange={(value) =>
                    setForm({ ...form, charterType: value })
                  }
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Permanent" id="Permanent" />
                    <Label htmlFor="Permanent">Permanent</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Temporary" id="Temporary" />
                    <Label htmlFor="Temporary">Temporary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Celebratory" id="Celebratory" />
                    <Label htmlFor="Celebratory">Celebratory</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="order"
                >
                  Order:
                </label>
                <RadioGroup
                  defaultValue="AZA"
                  onValueChange={(value) => setForm({ ...form, order: value })}
                  className="flex flex-wrap gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AZA" id="AZA" />
                    <Label htmlFor="AZA">AZA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BBG" id="BBG" />
                    <Label htmlFor="BBG">BBG</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BBYO" id="BBYO" />
                    <Label htmlFor="BBYO">BBYO</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="chapterName"
                >
                  Chapter Name:
                </label>
                <Input
                  id="chapterName"
                  name="chapterName"
                  placeholder="Chapter Name"
                  value={form.chapterName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="communityName"
                >
                  Community/Council Name:
                </label>
                <Input
                  id="communityName"
                  name="communityName"
                  placeholder="Community or Council Name"
                  value={form.communityName}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Charter Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {!form.charterType.includes("Temporary") && (
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-2"
                    htmlFor="names"
                  >
                    Charter Names: (One per line)
                  </label>
                  <textarea
                    id="names"
                    name="names"
                    rows={10}
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Enter names, one per line"
                    value={form.names}
                    onChange={handleChange}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  name="generate"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Generate Charter"}
                </Button>
              </div>
            </div>
          </form>

          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>
                  {form.chapterName} {form.charterType} Charter
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[70vh]">
                <div className="flex justify-center">
                  <Image
                    src={charterImage}
                    alt="Generated Charter"
                    width={800}
                    height={600}
                    className="max-w-full h-auto"
                    unoptimized
                  />
                </div>
              </div>

              {/* Advanced options section inside popup - more compact layout */}
              <div className="p-2 border rounded-md mt-2 bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium">Advanced Adjustments</h3>
                  <p className="text-xs text-muted-foreground">
                    Make adjustments and click &ldquo;Regenerate&rdquo;
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="columns" className="text-xs">
                      Columns
                    </Label>
                    <Input
                      id="columns"
                      name="columns"
                      type="number"
                      placeholder="Auto"
                      value={isNaN(override.columns) ? "" : override.columns}
                      onChange={handleOverrideChange}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="yPosition" className="text-xs">
                      Y Position
                    </Label>
                    <Input
                      id="yPosition"
                      name="yPosition"
                      type="number"
                      placeholder="0"
                      value={
                        isNaN(override.yPosition) ? "" : override.yPosition
                      }
                      onChange={handleOverrideChange}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="fontSize" className="text-xs">
                      Font Size
                    </Label>
                    <Input
                      id="fontSize"
                      name="fontSize"
                      type="number"
                      placeholder="Auto"
                      value={isNaN(override.fontSize) ? "" : override.fontSize}
                      onChange={handleOverrideChange}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full mt-2 h-8 text-sm"
                  disabled={isLoading}
                  onClick={() => {
                    setShowPreview(false);
                    // Small delay to allow dialog to close before regenerating
                    setTimeout(() => {
                      const {
                        order,
                        names,
                        communityName,
                        charterType,
                        chapterName,
                      } = form;
                      generateCharter(
                        order,
                        names,
                        communityName,
                        charterType,
                        chapterName,
                        date,
                        override
                      );
                    }, 100);
                  }}
                >
                  {isLoading
                    ? "Regenerating..."
                    : "Regenerate with Adjustments"}
                </Button>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                  }}
                >
                  Close
                </Button>
                <Button variant="outline" onClick={downloadDirectImage}>
                  Download PNG
                </Button>
                <Button
                  onClick={() =>
                    downloadPdf(`${form.order} ${form.charterType}`)
                  }
                >
                  Download PDF
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </main>
  );
}
