"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import Link from "next/link";
import { JSX, SVGProps, useEffect, useState } from "react";

const AIRTABLE_URL =
  "https://airtable.com/app6PtSPpN3yP3cM5/tblcW7m6RHG1r61rx/viwD23Jdyb03kwNwn";

interface AirtableRecord {
  id: string;
  fields: Record<string, string>;
}

interface Records {
  updatedRecords: AirtableRecord[];
  newRecords: AirtableRecord[];
}

export default function CRMUtil() {
  const { toast } = useToast();

  const [showProccessCSV, setShowProcessCSV] = useState(false);
  const [progress, setProgress] = useState(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [showPushChanges, setShowPushChanges] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [airTableProgress, setAirTableProgress] = useState(0);
  const [downloadUpdatedReport, setDownloadUpdatedReport] =
    useState<File | null>(null);
  const [downloadNewRecordsReport, setDownloadNewRecordsReport] =
    useState<File | null>(null);
  const [records, setRecords] = useState<Records>({
    updatedRecords: [],
    newRecords: [],
  });

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem("records") || "{}");
    if (records.updatedRecords || records.newRecords) {
      toast({
        variant: "default",
        title: "Records Found in Local Storage!",
        description: `From your last vist: Updated Records: ${records.updatedRecords.length} New Records: ${records.newRecords.length}`,
      });
      setRecords(records);
      setShowPushChanges(true);
      setTotalRecords(
        records.updatedRecords.length + records.newRecords.length
      );
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setShowProcessCSV(!!file);

    if (file) {
      setCsvFile(file);
      toast({
        variant: "default",
        title: `File Uploaded`,
        description: `${file.name} was uploaded successfully.`,
      });
    } else {
      return;
    }
  };

  const processCSV = async () => {
    try {
      if (!csvFile) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please upload a CSV file.",
        });
        return;
      }

      toast({
        variant: "default",
        title: "Processing CSV...",
        description: "Starting process, loading CSV file.",
      });

      const formData = new FormData();
      formData.append("csv", csvFile);

      const response = await fetch("/api/summer-crm/process-csv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server error processing CSV");
      }

      const intervalId = setInterval(async () => {
        try {
          const progressResponse = await fetch(
            "/api/summer-crm/check-progress",
            {
              method: "POST",
            }
          );

          if (!progressResponse.ok) {
            clearInterval(intervalId);
            throw new Error("Error checking progress");
          }

          const result = await progressResponse.json();

          setProgress(
            Math.floor((result.totalChecked / result.totalRecords) * 100)
          );

          if (result.finishedChecking) {
            clearInterval(intervalId);
            setShowPushChanges(true);

            localStorage.setItem(
              "records",
              JSON.stringify({
                updatedRecords: result.updatedRecords,
                newRecords: result.newRecords,
              })
            );

            setRecords({
              updatedRecords: result.updatedRecords,
              newRecords: result.newRecords,
            });

            toast({
              variant: "default",
              title: "CSV Processed!",
              description: `Updated Records: ${result.updatedRecords.length}, New Records: ${result.newRecords.length}`,
            });

            const header = "Link To Profile,ID,Updated Fields";

            const updatedRecords = result.updatedRecords.map(
              (record: AirtableRecord) => {
                const updatedFields = Object.keys(record.fields)
                  .filter((key) => key.toLowerCase() !== "updated?")
                  .map((key) => `${key}: ${record.fields[key]}`)
                  .join(", ");
                return `${AIRTABLE_URL}/${record.id},${record.id},${updatedFields}`;
              }
            );

            const updatedRecordsCSV = [header, ...updatedRecords].join("\n");

            setDownloadUpdatedReport(
              new File([updatedRecordsCSV], "updatedRecords.csv")
            );

            const newRecordsHeader =
              "myBBYO ID,First Name,Last Name,Graduation Year,Phone,Email,Community,Chapter,Membership Join Date Import,Order,Leadership History,Total Events Attended,IC Events Attended,Regional Conventions Attended,IC/Summer Registration Launch Night,Summer Experience History,Parent 1 MyBBYO ID,Parent 1 Name,Program Registered For,ZIP,Address Line 1,City,State,Parent 2 MyBBYO ID,Parent 2 Name,Instagram Handle,Do Not Text,Address Line 2";

            const newRecords = result.newRecords.map(
              (record: AirtableRecord) => {
                const fields = [
                  "myBBYO ID",
                  "First Name",
                  "Last Name",
                  "Graduation Year",
                  "Phone",
                  "Email",
                  "Community",
                  "Chapter",
                  "Membership Join Date Import",
                  "Order",
                  "Leadership History",
                  "Total Events Attended",
                  "IC Events Attended",
                  "Regional Conventions Attended",
                  "IC/Summer Registration Launch Night",
                  "Summer Experience History",
                  "Parent 1 MyBBYO ID",
                  "Parent 1 Name",
                  "Program Registered For",
                  "ZIP",
                  "Address Line 1",
                  "City",
                  "State",
                  "Parent 2 MyBBYO ID",
                  "Parent 2 Name",
                  "Instagram Handle",
                  "Do Not Text",
                  "Address Line 2",
                ];

                return fields
                  .map((field) => record.fields[field] || "")
                  .join(",");
              }
            );

            const newRecordsCSV = [newRecordsHeader, ...newRecords].join("\n");

            setDownloadNewRecordsReport(
              new File([newRecordsCSV], "newRecords.csv")
            );
          }
        } catch (error) {
          clearInterval(intervalId);
          console.error("Error checking progress:", error);
        }
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error processing the CSV.",
      });
      console.error("Error processing CSV:", error);
    }
  };

  const pushToAirtable = async () => {
    try {
      setAirTableProgress(0);

      toast({
        variant: "default",
        title: "Pushing to Airtable...",
        description: "Starting process, pushing records (Might take a minute).",
      });

      const records = JSON.parse(localStorage.getItem("records") || "{}");
      const updatedRecords = records.updatedRecords;
      const newRecords = records.newRecords;
      const totalRecords = updatedRecords.length + newRecords.length;
      let totalUpdated = 0;

      if (updatedRecords.length > 0) {
        for (let i = 0; i < updatedRecords.length; i += 10) {
          const recordsToSend = updatedRecords.slice(i, i + 10);

          const body = {
            records: recordsToSend,
            updated: true,
          };

          await fetch("/api/summer-crm/update-airtable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          totalUpdated += recordsToSend.length;

          setAirTableProgress(Math.floor((totalUpdated / totalRecords) * 100));

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        toast({
          variant: "default",
          title: "Updated Records Pushed to Airtable!",
          description: `Updated Records: ${updatedRecords.length}`,
        });
      }

      if (newRecords.length > 0) {
        for (let i = 0; i < newRecords.length; i += 10) {
          const recordsToSend = newRecords.slice(i, i + 10);

          const body = {
            records: recordsToSend,
            new: true,
          };

          await fetch("/api/summer-crm/update-airtable", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          totalUpdated += recordsToSend.length;

          setAirTableProgress(Math.floor((totalUpdated / totalRecords) * 100));

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        toast({
          variant: "default",
          title: "New Records Pushed to Airtable!",
          description: `New Records: ${newRecords.length}`,
        });
      }

      toast({
        variant: "default",
        title: "All Records Pushed to Airtable!",
        description: `Total Records: ${totalRecords}`,
      });

      localStorage.clear();
      setShowPushChanges(false);

      await fetch("/api/summer-crm/clear-storage", {
        method: "POST",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error pushing to Airtable.",
      });

      console.log(e);
    }
  };

  const clearRecords = async () => {
    try {
      toast({
        variant: "default",
        title: "Clearing Records...",
        description: "Starting process, clearing records.",
      });

      await fetch("/api/summer-crm/clear-storage", {
        method: "POST",
      });

      localStorage.clear();

      setRecords({ updatedRecords: [], newRecords: [] });
      setShowPushChanges(false);
      setProgress(0);
      setAirTableProgress(0);

      toast({
        variant: "default",
        title: "Records Cleared!",
        description: "All records have been cleared.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error clearing the records.",
      });
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
              <h2 className="text-2xl font-bold">
                Summer Moves Management Comparison Utility
              </h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <h3 className="text font-bold text-gray-800 py-2">
              Make sure to import parents first, for both creating and updating
              records.
            </h3>
          </div>
          <div className="grid w-full items-center gap-4">
            <Label htmlFor="csvfile">CSV File</Label>
            <Input
              accept=".csv"
              id="csvfile"
              type="file"
              onChange={handleFileChange}
            />
          </div>
          {showProccessCSV && (
            <div className="mt-4">
              <Button
                name="processCSV"
                className="w-full bg-blue-500 text-white"
                variant="default"
                onClick={processCSV}
              >
                Process CSV
                <BarChartIcon className="ml-2 h-4 w-4" />
              </Button>
              <div className="relative pt-1 mt-3">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {showPushChanges && (
            <div className="mt-4">
              <Button
                className="w-full bg-green-500 text-white"
                type="button"
                variant="default"
                onClick={pushToAirtable}
              >
                Push {totalRecords} Changes to Airtable
                <UploadIcon className="ml-2 h-4 w-4" />
              </Button>
              <div className="relative pt-1 mt-3">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                  <div
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    style={{
                      width: `${airTableProgress}%`,
                    }}
                  />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-6 h-96 overflow-auto text-center">
                  <Button className="w-full mb-2" variant="outline">
                    <a
                      href={
                        downloadUpdatedReport
                          ? URL.createObjectURL(downloadUpdatedReport)
                          : `about:blank`
                      }
                      download="report.csv"
                      className="flex items-start"
                    >
                      Updated Records Report ({records.updatedRecords.length})
                    </a>
                  </Button>
                  <Separator className="my-4" />
                  <div className="flex flex-col items-center gap-2">
                    {records.updatedRecords.map((record: AirtableRecord) => (
                      <Card key={record.id} className="w-full overflow-hidden">
                        <CardContent className="p-4">
                          <a
                            href={`${AIRTABLE_URL}/${record.id}`}
                            target="_blank"
                            className="block"
                          >
                            <div className="font-bold">{record.id}</div>
                            <div className="mt-2 text-sm space-y-1">
                              {Object.keys(record.fields).map(
                                (key: string) =>
                                  key.toLowerCase() !== "updated?" && (
                                    <p key={key}>
                                      {key}: {record.fields[key]}
                                    </p>
                                  )
                              )}
                            </div>
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="border rounded-md p-6 h-96 overflow-auto text-center">
                  <Button className="w-full mb-2" variant="outline">
                    <a
                      href={
                        downloadNewRecordsReport
                          ? URL.createObjectURL(downloadNewRecordsReport)
                          : `about:blank`
                      }
                      download="report.csv"
                      className="flex items-start"
                    >
                      New Records Report ({records.newRecords.length})
                    </a>
                  </Button>
                  <Separator className="my-4" />
                  <div className="flex flex-col items-center gap-2">
                    {records.newRecords.map((record: AirtableRecord) => (
                      <Card
                        key={record.fields["myBBYO ID"]}
                        className="w-full overflow-hidden"
                      >
                        <CardContent className="p-4">
                          <div className="font-bold">
                            {`${record.fields["First Name"]} ${record.fields["Last Name"]} (${record.fields.Order})`}
                          </div>
                          <div className="mt-2 text-sm">
                            <p>{record.fields.Community}</p>
                            <p>{record.fields.Chapter}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={clearRecords}
              >
                Clear Records
                <TrashIcon className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function BarChartIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function TrashIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function UploadIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
