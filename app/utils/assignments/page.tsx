"use client";

import { CardHeader, CardContent, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { JSX, SVGProps, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import * as FileSaver from "file-saver";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "./data-table";
import { Assignment, columns } from "./columns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AssignmentsUtil() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  interface Override {
    [name: string]: number;
  }

  const [showProccessCSV, setShowProcessCSV] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [overrideTotalSpots, setOverrideTotalSpots] = useState<Override>({});
  const [excludeChars, setExcludeChars] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [numSessions, setNumSessions] = useState(1);
  const [programList, setProgramList] = useState<string[] | null>(null);
  const [setAll, setSetAll] = useState(0);
  const [data, setData] = useState<Assignment[]>([]);
  const [simulations, setSimulations] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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

  const resetState = () => {
    setCsvFile(null);
    setShowProcessCSV(false);

    const fileInput = document.getElementById("csvfile") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    setAssignments([]);
    setOverrideTotalSpots({});
    setExcludeChars(0);
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/assignments-template.csv");
      const blob = await res.blob();
      FileSaver.saveAs(blob, "assignments-template.csv");
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

      setAssignments([]);
      setIsLoading(true);

      const button = document.getElementsByName(
        "processCSV"
      )[0] as HTMLButtonElement;
      button.disabled = true;

      const formData = new FormData();
      formData.append("csv", csvFile as Blob);
      formData.append("excludeChars", excludeChars.toString());
      formData.append("overrideTotalSpots", JSON.stringify(overrideTotalSpots));
      formData.append("numSessions", numSessions.toString());
      formData.append("simulations", simulations.toString());

      const res = await fetch("/api/assignments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.status === 400) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error + ` Minimum Override: ${data.totalSpots} `,
        });

        button.disabled = false;
        setIsLoading(false);
        return;
      }

      if (res.status !== 200) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message,
        });
        setIsLoading(false);
        return;
      }

      const processedAssignments: Assignment[] = [];
      const processedData: Assignment[] = [];
      for (const [session, sessionAssignments] of Object.entries(
        data.response
      )) {
        for (const assignment of sessionAssignments as Array<{
          name: string;
          program: string;
          preference?: string;
        }>) {
          const existingAssignment = processedAssignments.find(
            (a) => a.name === assignment.name
          );

          const keyName = `session${session}`;

          if (!existingAssignment) {
            processedAssignments.push({
              name: assignment.name,
              [keyName]: `${assignment.program} ${
                assignment.preference ? `(${assignment.preference})` : ""
              }`,
            });

            processedData.push({
              name: assignment.name,
              [keyName]: assignment.program,
            });
          }

          if (existingAssignment) {
            existingAssignment[keyName] = `${assignment.program} ${
              assignment.preference ? `(${assignment.preference})` : ""
            }`;

            const existingData = processedData.find(
              (a) => a.name === assignment.name
            );

            if (existingData) {
              existingData[keyName] = assignment.program;
            }
          }
        }
      }

      setAssignments(processedAssignments);

      setProgramList(data.programsList);

      setData(processedData);

      toast({
        variant: "default",
        title: "Success",
        description: "Your assignments have been generated.",
      });

      button.disabled = false;
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was an error processing the CSV.",
      });
      setIsLoading(false);
    }
  };

  const downloadCsv = async () => {
    let csv = "Name,";
    for (let i = 1; i <= numSessions; i++) {
      csv += `Session ${i},`;
    }
    csv += "\n";

    // use data instead of assignments to keep the order
    for (const assignment of data) {
      csv += `${assignment.name},`;
      for (let i = 1; i <= numSessions; i++) {
        csv += `"${assignment[`session${i}`] || ""}",`;
      }
      csv += "\n";
    }

    const utf8Bom = "\uFEFF";
    const csvContent = utf8Bom + csv;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    FileSaver.saveAs(blob, "assignments.csv");

    toast({
      variant: "default",
      title: "CSV Downloaded",
      description: "CSV file was downloaded successfully.",
    });
  };

  if (status === "loading") {
    return null; // Or a loading spinner
  }

  if (!session) {
    router.push("/");
    return null;
  }

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
              <h2 className="text-2xl font-bold">Assignments Utility</h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div>
            <p className="text-sm text-gray-600">
              The CSV file should begin with the{" "}
              <strong>Name/Indentifer</strong> first, followed by the{" "}
              <strong>Preferences</strong> in order from highest to lowest. This
              utility can only handle one program at a time. <br />{" "}
              <strong>
                <u>
                  Make sure the file is a CSV file (not XLXS) before uploading.
                </u>
              </strong>
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
          {showProccessCSV && (
            <div className="mt-4">
              <Separator className="mb-4" />
              <div className="flex items-center justify-center">
                <div className="flex flex-row gap-4 text-xs text-center items-center">
                  <HoverCard>
                    <HoverCardTrigger>
                      <label htmlFor="numSessions"># of Sessions</label>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-sm text-gray-600">
                        The number of sessions to distribute the spots over.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                  <Input
                    className="w-16"
                    id="numSessions"
                    type="number"
                    defaultValue={1}
                    min={1}
                    onChange={(e) => setNumSessions(+e.target.value)}
                  />
                  <HoverCard>
                    <HoverCardTrigger>
                      <label htmlFor="exclude">Exclude Characters</label>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-sm text-gray-600">
                        Exclude the first <i>n</i> characters from program
                        names. For example, if the programs are formatted with
                        their preference number, for example,{" "}
                        <i>
                          &quot;<u>3:</u> How to Represent Your
                          Community/Chapter&quot;
                        </i>
                        , you can exclude the first 3 characters to remove the
                        preference number, leaving it as{" "}
                        <i>
                          &quot;How to Represent Your Community/Chapter&quot;
                        </i>
                        .
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                  <Input
                    className="w-16"
                    id="exclude"
                    type="number"
                    defaultValue={0}
                    min={0}
                    onChange={(e) => setExcludeChars(+e.target.value)}
                  />
                  <HoverCard>
                    <HoverCardTrigger>
                      <label htmlFor="simulations"># of Simulations</label>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <p className="text-sm text-gray-600">
                        The number of simulations to run. The best result will
                        be returned.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                  <Input
                    className="w-24"
                    id="simulations"
                    type="number"
                    defaultValue={1}
                    min={1}
                    onChange={(e) => setSimulations(+e.target.value)}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <div>
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Button className="w-28" variant="outline">
                              Override
                            </Button>
                          </HoverCardTrigger>
                          <HoverCardContent>
                            <p className="text-sm text-gray-600">
                              Override the total number of spots per program.
                              The sum of the number of spots must be greater
                              than the total number of participants.
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="flex items-center gap-2 p-1">
                        <Input
                          className="w-24 justify-center text-center"
                          id="setAll"
                          type="number"
                          min={0}
                          onChange={(e) => setSetAll(+e.target.value)}
                        />
                        <Button
                          className="w-full bg-blue-500 text-white"
                          variant="default"
                          onClick={() => {
                            const newOverrideTotalSpots: Override = {};
                            if (programList) {
                              programList.forEach((program) => {
                                newOverrideTotalSpots[program] = setAll;
                              });
                              setOverrideTotalSpots(newOverrideTotalSpots);
                            }
                          }}
                        >
                          Set All
                        </Button>
                      </div>
                      <Separator className="my-4" />
                      {programList &&
                        programList.map((program) => (
                          <div
                            key={program}
                            className="flex items-center gap-2 p-1"
                          >
                            <Input
                              className="w-24 justify-center text-center"
                              id={program}
                              type="number"
                              value={overrideTotalSpots[program]}
                              min={0}
                              onChange={(e) =>
                                setOverrideTotalSpots({
                                  ...overrideTotalSpots,
                                  [program]: +e.target.value,
                                })
                              }
                            />
                            <p className="text-sm text-gray-600">{program}</p>
                          </div>
                        ))}
                      <Separator className="my-4" />
                      <Button
                        className="w-full bg-red-500 text-white"
                        variant="default"
                        onClick={() => {
                          setOverrideTotalSpots({});
                        }}
                      >
                        Clear All
                      </Button>
                    </PopoverContent>
                  </Popover>
                  <Button
                    onClick={processCSV}
                    variant="default"
                    className="space-x-2 px-6"
                    name="processCSV"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <BarChartIcon className="h-5 w-5" />
                        <span>Process CSV</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {assignments.length > 0 && (
            <div className="mt-4">
              <Separator className="mb-4" />
              <div className="container mx-auto max-h-[36rem] overflow-y-auto">
                <DataTable columns={columns(numSessions)} data={assignments} />
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-gray-600 text-center">
                <i>
                  The number in parenthesis is the priority. If there is no
                  number, no priority was given.
                </i>
              </p>
              <Button
                className="w-full bg-blue-500 text-white mt-4"
                onClick={downloadCsv}
              >
                Download
              </Button>
              <Button
                className="w-full bg-red-500 text-white mt-2"
                onClick={resetState}
              >
                Reset
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
