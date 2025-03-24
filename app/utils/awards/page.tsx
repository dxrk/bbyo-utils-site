// TODO:  Need to create cloud server to host images until pdf is downloaded

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import csv from "csv-parser";
import * as FileSaver from "file-saver";
import Image from "next/image";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import { useState, useEffect } from "react";
import streamifier from "streamifier";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Trash2,
  PlusCircle,
  Download,
  RotateCcw,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AwardRecord {
  id: string;
  Name: string;
  "Award Type": string;
  Chapter: string;
  Community: string;
  isValid?: boolean;
  isProcessing?: boolean;
  isProcessed?: boolean;
  errorMessage?: string;
}

export default function AwardsUtil() {
  const { toast } = useToast();

  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [awardRecords, setAwardRecords] = useState<AwardRecord[]>([]);
  const [showOnlyInvalid, setShowOnlyInvalid] = useState(false);
  const [newRecord, setNewRecord] = useState<
    Omit<
      AwardRecord,
      "id" | "isValid" | "isProcessing" | "isProcessed" | "errorMessage"
    >
  >({
    Name: "",
    "Award Type": "",
    Chapter: "",
    Community: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [validAwardTypes, setValidAwardTypes] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available award types when component mounts
    const fetchAwardTypes = async () => {
      try {
        const response = await fetch("/api/awards/types");
        if (response.ok) {
          const data = await response.json();
          setValidAwardTypes(data.types || []);
        }
      } catch (error) {
        console.error("Failed to fetch award types:", error);
      }
    };

    fetchAwardTypes();
  }, []);

  const parseCSVBuffer = function (buffer: Buffer): Promise<AwardRecord[]> {
    return new Promise((resolve, reject) => {
      const results: AwardRecord[] = [];
      const stream = streamifier.createReadStream(buffer).pipe(csv());

      stream
        .on("data", (data: Omit<AwardRecord, "id">) => {
          // Capitalize each word in the "Name" field
          if (data["Name"]) {
            data["Name"] = capitalizeEachWord(data["Name"]);
          }
          // Add unique ID and initial validation status
          results.push({
            ...data,
            id: crypto.randomUUID(),
            isValid: undefined,
            isProcessing: false,
            isProcessed: false,
          });
        })
        .on("end", () => resolve(results))
        .on("error", (error: Error) => reject(error));
    });
  };

  // Function to capitalize each word in a string
  const capitalizeEachWord = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      // Parse and preview the CSV data
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const records = await parseCSVBuffer(buffer);

        // Validate the records
        await validateRecords(records);

        toast({
          variant: "default",
          title: `File Uploaded`,
          description: `${file.name} was uploaded successfully with ${records.length} records.`,
        });
      } catch (error) {
        console.error("Failed to parse CSV file:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to parse the CSV file.",
        });
      }
    }
  };

  // Validate all records against the API
  const validateRecords = async (records: AwardRecord[]) => {
    const validationPromises = records.map(async (record) => {
      try {
        const res = await fetch("/api/awards/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            award: record["Award Type"],
          }),
        });

        const data = await res.json();
        return {
          ...record,
          isValid: res.ok && data.valid,
          errorMessage:
            !res.ok || !data.valid
              ? data.message || "Invalid award type"
              : undefined,
        };
      } catch (error) {
        console.error("Error validating record:", error);
        return {
          ...record,
          isValid: false,
          errorMessage: "Error validating award",
        };
      }
    });

    const validatedRecords = await Promise.all(validationPromises);
    setAwardRecords(validatedRecords);
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/awards-template.csv");
      const blob = await res.blob();
      FileSaver.saveAs(blob, "awards-template.csv");
      toast({
        variant: "default",
        title: "Template Downloaded",
        description: "Template was downloaded successfully.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error downloading the template.",
      });
    }
  };

  const deleteRecord = (id: string) => {
    setAwardRecords((records) => records.filter((record) => record.id !== id));
  };

  const addRecord = () => {
    if (!newRecord.Name || !newRecord["Award Type"]) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name and Award Type are required.",
      });
      return;
    }

    const record: AwardRecord = {
      ...newRecord,
      id: crypto.randomUUID(),
      isValid: undefined,
      isProcessing: false,
      isProcessed: false,
    };

    // Validate the new record
    fetch("/api/awards/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        award: record["Award Type"],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAwardRecords([
          ...awardRecords,
          {
            ...record,
            isValid: data.valid,
            errorMessage: !data.valid
              ? data.message || "Invalid award type"
              : undefined,
          },
        ]);

        // Reset form and close dialog
        setNewRecord({
          Name: "",
          "Award Type": "",
          Chapter: "",
          Community: "",
        });
        setIsAddDialogOpen(false);

        toast({
          variant: "default",
          title: "Record Added",
          description: "The new award record has been added.",
        });
      })
      .catch(() => {
        setAwardRecords([
          ...awardRecords,
          {
            ...record,
            isValid: false,
            errorMessage: "Error validating award",
          },
        ]);
        setIsAddDialogOpen(false);
      });
  };

  const processCSV = async () => {
    try {
      if (awardRecords.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "No awards to generate. Please upload a CSV file or add records.",
        });
        return;
      }

      // Check if there are any invalid awards
      const invalidCount = awardRecords.filter(
        (record) => record.isValid === false
      ).length;
      if (invalidCount > 0) {
        toast({
          variant: "default",
          title: "Warning",
          description: `There are ${invalidCount} invalid award records that will be skipped.`,
        });
      }

      // Display toast indicating CSV processing has started
      toast({
        variant: "default",
        title: "Processing Awards...",
        description: `Starting processing of ${awardRecords.length} awards.`,
      });

      // Set loading state
      setIsLoading(true);
      setProgress(0);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Alphabetize by Name
      const sortedRecords = [...awardRecords]
        .filter((record) => record.isValid !== false)
        .sort((a, b) => (a.Name > b.Name ? 1 : b.Name > a.Name ? -1 : 0));

      // Process in batches of 5 for better performance
      const batchSize = 5;
      const totalRecords = sortedRecords.length;
      let processedCount = 0;
      let successCount = 0;

      for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = sortedRecords.slice(i, i + batchSize);

        // Mark current batch as processing
        setAwardRecords((currentRecords) =>
          currentRecords.map((record) =>
            batch.some((batchRecord) => batchRecord.id === record.id)
              ? { ...record, isProcessing: true }
              : record
          )
        );

        // Process batch in parallel
        await Promise.all(
          batch.map(async (record) => {
            try {
              if (record.Name === "") record.Name = record.Chapter;

              // Use the Next.js API endpoint
              const res = await fetch("/api/awards/generate-award", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: record.Name,
                  award: record["Award Type"],
                  chapter: record.Chapter,
                  community: record.Community,
                }),
              });

              if (!res.ok) {
                // Update record with error
                setAwardRecords((currentRecords) =>
                  currentRecords.map((r) =>
                    r.id === record.id
                      ? {
                          ...r,
                          isProcessing: false,
                          isProcessed: true,
                          isValid: false,
                          errorMessage: `Failed to generate: ${res.status}`,
                        }
                      : r
                  )
                );
                return;
              }

              // Get the JSON response with imageId and filename
              const { imageId, filename } = await res.json();

              // Get the actual image
              const imageResponse = await fetch(
                `/api/awards/generate-award?id=${imageId}&filename=${filename}`
              );

              if (!imageResponse.ok) {
                // Update record with error
                setAwardRecords((currentRecords) =>
                  currentRecords.map((r) =>
                    r.id === record.id
                      ? {
                          ...r,
                          isProcessing: false,
                          isProcessed: true,
                          isValid: false,
                          errorMessage: "Failed to download image",
                        }
                      : r
                  )
                );
                return;
              }

              const image = await imageResponse.blob();

              // Convert image blob to array buffer
              const imageBytes = await image.arrayBuffer();

              // Embed image in PDF
              const pdfImage = await pdfDoc.embedJpg(imageBytes);

              // Add image as a new page to the PDF
              const page = pdfDoc.addPage([11 * 72, 8.5 * 72]); // 8.5x11 inches
              page.drawImage(pdfImage, {
                x: 0,
                y: 0,
                width: page.getWidth(),
                height: page.getHeight(),
              });

              // Update record status
              setAwardRecords((currentRecords) =>
                currentRecords.map((r) =>
                  r.id === record.id
                    ? {
                        ...r,
                        isProcessing: false,
                        isProcessed: true,
                        isValid: true,
                      }
                    : r
                )
              );

              successCount++;
            } catch (error) {
              console.error(
                `Error processing award for ${record.Name}:`,
                error
              );

              // Update record with error
              setAwardRecords((currentRecords) =>
                currentRecords.map((r) =>
                  r.id === record.id
                    ? {
                        ...r,
                        isProcessing: false,
                        isProcessed: true,
                        isValid: false,
                        errorMessage: "Processing error",
                      }
                    : r
                )
              );
            }
          })
        );

        processedCount += batch.length;
        setProgress((processedCount / totalRecords) * 100);
      }

      if (successCount === 0) {
        throw new Error("No awards were successfully generated");
      }

      // Save the PDF as a blob
      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

      // Download the PDF
      FileSaver.saveAs(pdfBlob, "awards.pdf");

      toast({
        variant: "default",
        title: "Success",
        description: `Generated ${successCount} awards successfully.`,
      });

      // Reset file input but keep the records
      const fileInput = document.getElementById("csvfile") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error generating awards:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate awards.",
      });
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setAwardRecords([]);
    setProgress(0);
    setIsLoading(false);

    const fileInput = document.getElementById("csvfile") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const filteredRecords = showOnlyInvalid
    ? awardRecords.filter((record) => record.isValid === false)
    : awardRecords;

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
              <h2 className="text-2xl font-bold">Awards Utility</h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <p className="text-sm text-gray-600">
              Upload a CSV file with the following columns: Name, Award Type,
              Chapter, and Community. The utility will generate award
              certificates for each person and combine them into a PDF.
            </p>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" onClick={downloadTemplate}>
              Download Template
            </Button>
            <div className="grid w-full items-center gap-1.5">
              <Input
                id="csvfile"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                placeholder="Upload CSV"
                className="max-w-lg"
                disabled={isLoading}
              />
            </div>
          </div>

          {awardRecords.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-4" />

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setShowOnlyInvalid(!showOnlyInvalid)}
                      >
                        {showOnlyInvalid
                          ? "Show All Records"
                          : "Show Only Invalid"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {showOnlyInvalid && (
                    <Badge variant="outline" className="bg-red-100">
                      Showing only invalid records
                    </Badge>
                  )}
                </div>

                <Dialog
                  open={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Award Record</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newRecord.Name}
                          onChange={(e) =>
                            setNewRecord({ ...newRecord, Name: e.target.value })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="award-type" className="text-right">
                          Award Type
                        </Label>
                        <Input
                          id="award-type"
                          value={newRecord["Award Type"]}
                          onChange={(e) =>
                            setNewRecord({
                              ...newRecord,
                              "Award Type": e.target.value,
                            })
                          }
                          className="col-span-3"
                          list="award-types"
                        />
                        <datalist id="award-types">
                          {validAwardTypes.map((type) => (
                            <option key={type} value={type} />
                          ))}
                        </datalist>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="chapter" className="text-right">
                          Chapter
                        </Label>
                        <Input
                          id="chapter"
                          value={newRecord.Chapter}
                          onChange={(e) =>
                            setNewRecord({
                              ...newRecord,
                              Chapter: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="community" className="text-right">
                          Community
                        </Label>
                        <Input
                          id="community"
                          value={newRecord.Community}
                          onChange={(e) =>
                            setNewRecord({
                              ...newRecord,
                              Community: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addRecord}>Add Record</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Award Type</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>Community</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-4 text-muted-foreground"
                        >
                          {showOnlyInvalid
                            ? "No invalid records found"
                            : "No records found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {record.isProcessing ? (
                              <Badge variant="outline" className="bg-blue-100">
                                Processing
                              </Badge>
                            ) : record.isProcessed ? (
                              record.isValid ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100"
                                >
                                  Success
                                </Badge>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="outline"
                                        className="bg-red-100"
                                      >
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Error
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {record.errorMessage || "Unknown error"}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            ) : record.isValid === false ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant="outline"
                                      className="bg-red-100"
                                    >
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Invalid
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {record.errorMessage ||
                                      "Invalid award type"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : record.isValid === true ? (
                              <Badge variant="outline" className="bg-green-100">
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>{record.Name}</TableCell>
                          <TableCell>{record["Award Type"]}</TableCell>
                          <TableCell>{record.Chapter}</TableCell>
                          <TableCell>{record.Community}</TableCell>
                          <TableCell className="text-right">
                            {!record.isProcessing && !record.isProcessed && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteRecord(record.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {isLoading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      Processing awards...
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={resetState}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={processCSV}
                  disabled={isLoading || awardRecords.length === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate Awards
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
