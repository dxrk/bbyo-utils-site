"use client";

import React, { useState, useEffect } from "react";
import Airtable from "airtable";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle2,
  Users,
  Building,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Airtable configuration
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY || "",
  endpointUrl: "https://api.airtable.com",
});

const base = Airtable.base("appUBzqI0l5uHXrBB");

const ExecSchema = z.object({
  "Full Name": z.string(),
  Region: z.string(),
  "BBYO Internal Hotel Room": z.string(),
  "Marriott Room Number": z.string(),
  "Room Check - Wednesday": z.boolean().optional(),
  "Room Check - Thursday": z.boolean().optional(),
  "Room Check - Friday": z.boolean().optional(),
  "Room Check - Saturday": z.boolean().optional(),
});

type Exec = z.infer<typeof ExecSchema>;

const CheckInScreen: React.FC = () => {
  const [execs, setExecs] = useState<Record<string, Exec>>({});
  const [selectedDay, setSelectedDay] = useState<string>("Wednesday");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showStats, setShowStats] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const days = ["Wednesday", "Thursday", "Friday", "Saturday"];
  const groups = ["All", "AZA", "BBG"];

  useEffect(() => {
    fetchExecs();
    const intervalId = setInterval(fetchExecs, 5000); // Fetch every 5 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const fetchExecs = async () => {
    const execsData: Record<string, Exec> = {};
    await base("People")
      .select({
        view: "Rooming | Room Checks",
        fields: [
          "Full Name",
          "Region",
          "BBYO Internal Hotel Room",
          "Marriott Room Number",
          "Room Check - Wednesday",
          "Room Check - Thursday",
          "Room Check - Friday",
          "Room Check - Saturday",
        ],
      })
      .eachPage((records, fetchNextPage) => {
        records.forEach((record) => {
          try {
            execsData[record.id] = ExecSchema.parse(record.fields);
          } catch (error) {
            console.error(`Validation error for record ${record.id}:`, error);
          }
        });
        fetchNextPage();
      });
    setExecs(execsData);
  };

  const toggleCheckIn = async (execId: string) => {
    const fieldName = `Room Check - ${selectedDay}`;
    const currentStatus = execs[execId][fieldName as keyof Exec];
    const newStatus = !currentStatus;
    try {
      await base("People").update(execId, {
        [fieldName]: newStatus,
      });
      setExecs((prevExecs) => ({
        ...prevExecs,
        [execId]: { ...prevExecs[execId], [fieldName]: newStatus },
      }));
    } catch (error) {
      console.error("Error updating Airtable:", error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const groupExecsByRoom = (execs: Record<string, Exec>) => {
    const grouped: Record<string, Record<string, Exec>> = {};
    Object.entries(execs).forEach(([id, exec]) => {
      const room = exec["BBYO Internal Hotel Room"];
      if (!grouped[room]) {
        grouped[room] = {};
      }
      grouped[room][id] = exec;
    });

    // Sort the rooms by room name
    const sortedGrouped = Object.keys(grouped)
      .sort((a, b) => {
        if (sortOrder === "asc") {
          return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        } else {
          return b.localeCompare(a, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        }
      })
      .reduce((acc, room) => {
        acc[room] = grouped[room];
        return acc;
      }, {} as Record<string, Record<string, Exec>>);

    return sortedGrouped;
  };

  const filterRooms = (rooms: Record<string, Record<string, Exec>>) => {
    return Object.entries(rooms).reduce((acc, [room, roomExecs]) => {
      // Apply group filter
      if (selectedGroup !== "All" && !room.includes(selectedGroup)) {
        return acc;
      }

      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchingExecs = Object.entries(roomExecs).filter(([, exec]) => {
          return (
            exec["Full Name"].toLowerCase().includes(searchLower) ||
            exec.Region.toLowerCase().includes(searchLower) ||
            exec["BBYO Internal Hotel Room"]
              .toLowerCase()
              .includes(searchLower) ||
            exec["Marriott Room Number"].toLowerCase().includes(searchLower)
          );
        });

        if (matchingExecs.length > 0) {
          acc[room] = Object.fromEntries(matchingExecs);
        }
        return acc;
      }

      acc[room] = roomExecs;
      return acc;
    }, {} as Record<string, Record<string, Exec>>);
  };

  const calculateProgress = () => {
    const filteredExecs = Object.values(execs).filter(
      (exec) =>
        selectedGroup === "All" ||
        exec["BBYO Internal Hotel Room"].includes(selectedGroup)
    );
    const total = filteredExecs.length;
    const checkedIn = filteredExecs.filter(
      (exec) => exec[`Room Check - ${selectedDay}` as keyof Exec] === true
    ).length;
    return total > 0 ? (checkedIn / total) * 100 : 0;
  };

  const isRoomFullyCheckedIn = (roomExecs: Record<string, Exec>) => {
    return Object.values(roomExecs).every(
      (exec) => exec[`Room Check - ${selectedDay}` as keyof Exec] === true
    );
  };

  const toggleRoomExpansion = (room: string) => {
    setExpandedRooms((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(room)) {
        newExpanded.delete(room);
      } else {
        newExpanded.add(room);
      }
      return newExpanded;
    });
  };

  const countCheckIns = (roomExecs: Record<string, Exec>) => {
    const total = Object.keys(roomExecs).length;
    const checkedIn = Object.values(roomExecs).filter(
      (exec) => exec[`Room Check - ${selectedDay}` as keyof Exec] === true
    ).length;
    return `${checkedIn}/${total} In`;
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
                BBYO August Execs 2025 Room Checks
              </h2>
            </div>
            <Link href="/room-checks">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, region, or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                className="h-10 w-10"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showStats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Execs: {Object.keys(execs).length}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Rooms: {Object.keys(groupExecsByRoom(execs)).length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Progress value={calculateProgress()} className="w-full" />
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-muted-foreground">
                    {calculateProgress().toFixed(1)}% Checked In
                  </p>
                  <Badge variant="outline" className="ml-2">
                    {
                      Object.values(execs).filter(
                        (exec) =>
                          exec[`Room Check - ${selectedDay}` as keyof Exec] ===
                          true
                      ).length
                    }{" "}
                    / {Object.keys(execs).length}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(true)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <ChevronDown className="h-4 w-4" />
              <span>Show Stats</span>
            </Button>
          )}

          <div className="space-y-4">
            {Object.entries(filterRooms(groupExecsByRoom(execs))).map(
              ([room, roomExecs]) => {
                const isFullyCheckedIn = isRoomFullyCheckedIn(roomExecs);
                const isExpanded = expandedRooms.has(room);

                return (
                  <Card
                    key={room}
                    className={`select-none ${
                      room.includes("AZA")
                        ? "bg-blue-50 border-blue-200"
                        : room.includes("BBG")
                        ? "bg-red-50 border-red-200"
                        : ""
                    }`}
                  >
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => toggleRoomExpansion(room)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-lg">
                            Room #
                            {(() => {
                              const roomNumbers = Object.values(roomExecs).map(
                                (exec) => exec["Marriott Room Number"]
                              );
                              return roomNumbers.every(
                                (num) => num === roomNumbers[0]
                              )
                                ? roomNumbers[0]
                                : roomNumbers.join(", ");
                            })()}
                          </span>
                          <Badge
                            variant="outline"
                            className={`inline-flex items-center px-3 py-1 ${
                              room.includes("AZA")
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : room.includes("BBG")
                                ? "bg-red-100 text-red-700 border-red-200"
                                : ""
                            }`}
                          >
                            {room}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={isFullyCheckedIn ? "default" : "secondary"}
                            className={isFullyCheckedIn ? "bg-green-500" : ""}
                          >
                            {isFullyCheckedIn ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : null}
                            {isFullyCheckedIn
                              ? "All In"
                              : countCheckIns(roomExecs)}
                          </Badge>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        {Object.entries(roomExecs).map(([id, exec]) => (
                          <div
                            key={id}
                            className="flex justify-between items-center mb-2 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {exec["Full Name"]}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {exec.Region} - #{exec["Marriott Room Number"]}
                              </span>
                            </div>
                            <Button
                              onClick={() => toggleCheckIn(id)}
                              variant={
                                exec[
                                  `Room Check - ${selectedDay}` as keyof Exec
                                ]
                                  ? "secondary"
                                  : "default"
                              }
                              className={`cursor-pointer m-2 ${
                                exec[
                                  `Room Check - ${selectedDay}` as keyof Exec
                                ]
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-red-500 text-white hover:bg-red-600"
                              }`}
                            >
                              {exec[`Room Check - ${selectedDay}` as keyof Exec]
                                ? "Checked In"
                                : "Check In"}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default CheckInScreen;
