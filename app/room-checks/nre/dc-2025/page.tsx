"use client";

import React, { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
// import Link from "next/link";

const TeenSchema = z.object({
  _id: z.string(),
  "First Name": z.string(),
  "Last Name": z.string(),
  Chapter: z.string().optional(),
  Room: z.string(),
  "AZA/BBG": z.string(),
  Email: z.string().optional(),
  "Grad Year": z.number().optional(),
  checkInFridayNight: z.boolean(),
  checkInSaturdayNight: z.boolean(),
  checkInSaturdayMorning: z.boolean(),
  checkInSundayMorning: z.boolean(),
});

type Teen = z.infer<typeof TeenSchema>;

const CheckInScreen: React.FC = () => {
  const [teens, setTeens] = useState<Record<string, Teen>>({});
  const [selectedDay, setSelectedDay] = useState<string>("Friday Night");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showStats, setShowStats] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const days = [
    "Friday Night",
    "Saturday Morning",
    "Saturday Night",
    "Sunday Morning",
  ];
  const groups = ["All", "AZA", "BBG"];

  useEffect(() => {
    fetchTeens();
    const fetchInterval = setInterval(fetchTeens, 7000);

    return () => {
      clearInterval(fetchInterval);
    };
  }, []);

  useEffect(() => {
    const now = new Date();

    // Convert to Eastern Time
    const estNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const day = estNow.getDay(); // 0 = Sunday, ..., 6 = Saturday
    const hour = estNow.getHours();

    let selected: string;

    const isMorning = hour >= 4 && hour < 16; // 4am to 4pm

    if (day === 6 && isMorning) {
      // Saturday Morning
      selected = "Saturday Morning";
    } else if (day === 6) {
      // Saturday Night
      selected = "Saturday Night";
    } else if (day === 0 && isMorning) {
      // Sunday Morning
      selected = "Sunday Morning";
    } else if (day === 0 || day === 1 || day === 2) {
      // Sunday after 4pm, or Monday/Tuesday = Saturday Night
      selected = "Saturday Night";
    } else if (day === 5 && hour >= 4) {
      // Friday after 4am = Friday Night
      selected = "Friday Night";
    } else if (day === 5 || day === 4 || day === 3) {
      // Friday before 4am, Thursday, or Wednesday = Friday Night
      selected = "Friday Night";
    } else {
      // Default catch-all (shouldn't hit this)
      selected = "Friday Night";
    }

    setSelectedDay(selected);
  }, []);

  const fetchTeens = async () => {
    try {
      const response = await fetch("/api/room-checks/nre/dc-2025");
      if (!response.ok) throw new Error("Failed to fetch");
      const teensData = await response.json();

      const teens: Record<string, Teen> = {};
      teensData.forEach((teen: z.infer<typeof TeenSchema>) => {
        teens[teen._id] = TeenSchema.parse(teen);
      });

      setTeens(teens);
    } catch (error) {
      console.error("Error fetching teens:", error);
    }
  };

  const toggleCheckIn = async (teenId: string) => {
    // Update the check-in status for the selected day. Replace spaces in the day name with empty string
    const fieldName = `checkIn${selectedDay.replace(/ /g, "")}`;
    const currentStatus = teens[teenId][fieldName as keyof Teen];
    const newStatus = !currentStatus;

    try {
      const response = await fetch("/api/room-checks/nre/dc-2025", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teenId,
          fieldName,
          newStatus,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setTeens((prevTeens) => ({
        ...prevTeens,
        [teenId]: { ...prevTeens[teenId], [fieldName]: newStatus },
      }));
    } catch (error) {
      console.error("Error updating check-in status:", error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const groupTeensByRoom = (teens: Record<string, Teen>) => {
    const grouped: Record<string, Record<string, Teen>> = {};
    Object.entries(teens).forEach(([id, teen]) => {
      const room = teen.Room;
      if (!grouped[room]) {
        grouped[room] = {};
      }
      grouped[room][id] = teen;
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
      }, {} as Record<string, Record<string, Teen>>);

    return sortedGrouped;
  };

  const filterRooms = (rooms: Record<string, Record<string, Teen>>) => {
    return Object.entries(rooms).reduce((acc, [room, roomTeens]) => {
      // Apply group filter
      if (
        selectedGroup !== "All" &&
        !Object.values(roomTeens).some(
          (teen) => teen["AZA/BBG"] === selectedGroup
        )
      ) {
        return acc;
      }

      // Apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchingTeens = Object.entries(roomTeens).filter(([, teen]) => {
          return (
            (
              teen["First Name"].toLowerCase() +
              " " +
              teen["Last Name"].toLowerCase()
            ).includes(searchLower) ||
            teen.Chapter?.toLowerCase().includes(searchLower) ||
            teen.Room.toLowerCase().includes(searchLower)
          );
        });

        if (matchingTeens.length > 0) {
          acc[room] = Object.fromEntries(matchingTeens);
        }
        return acc;
      }

      acc[room] = roomTeens;
      return acc;
    }, {} as Record<string, Record<string, Teen>>);
  };

  const calculateProgress = () => {
    const filteredTeens = Object.values(teens).filter(
      (teen) => selectedGroup === "All" || teen["AZA/BBG"] === selectedGroup
    );
    const total = filteredTeens.length;
    const checkedIn = filteredTeens.filter(
      (teen) =>
        teen[`checkIn${selectedDay.replace(/ /g, "")}` as keyof Teen] === true
    ).length;
    return total > 0 ? (checkedIn / total) * 100 : 0;
  };

  const isRoomFullyCheckedIn = (roomTeens: Record<string, Teen>) => {
    return Object.values(roomTeens).every(
      (teen) =>
        teen[`checkIn${selectedDay.replace(/ /g, "")}` as keyof Teen] === true
    );
  };

  const countCheckIns = (roomTeens: Record<string, Teen>) => {
    const total = Object.keys(roomTeens).length;
    const checkedIn = Object.values(roomTeens).filter(
      (teen) =>
        teen[`checkIn${selectedDay.replace(/ /g, "")}` as keyof Teen] === true
    ).length;
    return `${checkedIn}/${total}`;
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

  const groupedTeens = filterRooms(groupTeensByRoom(teens));

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
                NRE: DC Council Convention 2025 Room Checks
              </h2>
            </div>
            {/* <Link href="/room-checks">
              <Button variant="outline">Back to Room Checks</Button>
            </Link> */}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm">
              {showStats ? "Hide Stats" : "Show Stats"}
            </span>
            {showStats ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Check-ins</p>
                      <h3 className="text-2xl font-bold">
                        {calculateProgress().toFixed(1)}%
                      </h3>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress value={calculateProgress()} className="mt-4" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">
                        Total Participants
                      </p>
                      <h3 className="text-2xl font-bold">
                        {Object.keys(teens).length}
                      </h3>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Rooms</p>
                      <h3 className="text-2xl font-bold">
                        {Object.keys(groupedTeens).length}
                      </h3>
                    </div>
                    <Building className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-full md:w-48">
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
                  <SelectTrigger className="w-full md:w-48">
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

                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, chapter, or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={toggleSortOrder}
                  className="flex items-center space-x-2"
                >
                  <span>Sort {sortOrder === "asc" ? "A→Z" : "Z→A"}</span>
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {Object.entries(groupedTeens).length === 0 ? (
              <Alert>
                <AlertDescription>
                  No rooms found matching your search criteria
                </AlertDescription>
              </Alert>
            ) : (
              Object.entries(groupedTeens).map(([room, roomTeens]) => {
                const isFullyCheckedIn = isRoomFullyCheckedIn(roomTeens);
                const isExpanded = expandedRooms.has(room);
                const firstTeen = Object.values(roomTeens)[0];

                return (
                  <Card
                    key={room}
                    className={`transition-shadow hover:shadow-md ${
                      firstTeen["AZA/BBG"] === "AZA"
                        ? "bg-blue-50"
                        : "bg-red-50"
                    }`}
                  >
                    <CardHeader
                      className="cursor-pointer hover:bg-opacity-80 transition-colors p-6"
                      onClick={() => toggleRoomExpansion(room)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-semibold">{room}</span>
                          <Badge
                            variant={isFullyCheckedIn ? "default" : "secondary"}
                            className={isFullyCheckedIn ? "bg-green-500" : ""}
                          >
                            {countCheckIns(roomTeens)}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-6 space-y-3">
                        {Object.entries(roomTeens).map(([id, teen]) => (
                          <div
                            key={id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {teen["First Name"]} {teen["Last Name"]}
                              </span>
                              <span className="text-sm text-gray-500">
                                {teen["Chapter"]}
                              </span>
                            </div>
                            <Button
                              onClick={() => toggleCheckIn(id)}
                              variant={
                                teen[
                                  `checkIn${selectedDay.replace(
                                    / /g,
                                    ""
                                  )}` as keyof Teen
                                ]
                                  ? "secondary"
                                  : "default"
                              }
                              className={`min-w-[120px] ${
                                teen[
                                  `checkIn${selectedDay.replace(
                                    / /g,
                                    ""
                                  )}` as keyof Teen
                                ]
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-red-500 hover:bg-red-600"
                              } text-white`}
                            >
                              {teen[
                                `checkIn${selectedDay.replace(
                                  / /g,
                                  ""
                                )}` as keyof Teen
                              ]
                                ? "Checked In"
                                : "Check In"}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default CheckInScreen;
