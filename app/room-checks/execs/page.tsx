"use client";

import React, { useState, useEffect } from "react";
import Airtable from "airtable";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Airtable configuration
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY || "",
  endpointUrl: "https://api.airtable.com",
});

const base = Airtable.base("appkOXKxriUL4JgII");

const ExecSchema = z.object({
  "Full Name": z.string(),
  Community: z.string(),
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
          "Community",
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

  const groupExecsByRoom = (execs: Record<string, Exec>) => {
    const grouped: Record<string, Record<string, Exec>> = {};
    Object.entries(execs).forEach(([id, exec]) => {
      const room = exec["BBYO Internal Hotel Room"];
      if (!grouped[room]) {
        grouped[room] = {};
      }
      grouped[room][id] = exec;
    });
    return grouped;
  };

  const filterRooms = (rooms: Record<string, Record<string, Exec>>) => {
    if (selectedGroup === "All") return rooms;
    return Object.entries(rooms).reduce((acc, [room, roomExecs]) => {
      if (room.includes(selectedGroup)) {
        acc[room] = roomExecs;
      }
      return acc;
    }, {} as Record<string, Record<string, Exec>>);
  };

  const groupedExecs = filterRooms(groupExecsByRoom(execs));

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

  // Add this helper function at the top of your component or in a separate utils file
  const extractNumber = (str: string) => {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const renderRoomList = () => {
    const sortedRooms = Object.entries(groupedExecs)
      .map(([room, roomExecs]) => {
        const marriottRoomNumbers = Array.from(
          new Set(
            Object.values(roomExecs).map((exec) => exec["Marriott Room Number"])
          )
        );
        return {
          room,
          roomExecs,
          marriottRoomNumbers,
          primaryMarriottRoom: marriottRoomNumbers[0] || "",
        };
      })
      .sort((a, b) => {
        // First, sort by check-in status
        const fullyCheckedInA = isRoomFullyCheckedIn(a.roomExecs);
        const fullyCheckedInB = isRoomFullyCheckedIn(b.roomExecs);
        if (fullyCheckedInA !== fullyCheckedInB) {
          return fullyCheckedInA ? 1 : -1;
        }

        // Then, sort by Marriott room number
        return (
          extractNumber(a.primaryMarriottRoom) -
          extractNumber(b.primaryMarriottRoom)
        );
      });

    return (
      <>
        {sortedRooms.map(({ room, roomExecs, marriottRoomNumbers }) => {
          const isFullyCheckedIn = isRoomFullyCheckedIn(roomExecs);
          const isExpanded = expandedRooms.has(room);

          return (
            <Card
              key={room}
              className={`mt-4 ${
                room.includes("AZA")
                  ? "bg-blue-100"
                  : room.includes("BBG")
                  ? "bg-red-100"
                  : ""
              }`}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleRoomExpansion(room)}
              >
                <CardTitle className="flex items-center justify-between">
                  <span>{`Room: ${marriottRoomNumbers.join(
                    ", "
                  )} (${room})`}</span>
                  <span
                    className={`flex items-center ml-4 ${
                      isFullyCheckedIn ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {isFullyCheckedIn ? "All In" : countCheckIns(roomExecs)}
                    {isExpanded ? (
                      <ChevronDown className="ml-2" />
                    ) : (
                      <ChevronRight className="ml-2" />
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  {Object.entries(roomExecs).map(([id, exec]) => (
                    <div
                      key={id}
                      className="flex justify-between items-center mb-2"
                    >
                      <span className="mr-4">
                        <strong>{exec["Full Name"]}</strong> - {exec.Community}{" "}
                        - #{exec["Marriott Room Number"]}
                      </span>
                      <Button
                        onClick={() => toggleCheckIn(id)}
                        variant={
                          exec[`Room Check - ${selectedDay}` as keyof Exec]
                            ? "secondary"
                            : "default"
                        }
                        className={`${
                          exec[`Room Check - ${selectedDay}` as keyof Exec]
                            ? "bg-green-500 text-white hover:opacity-75"
                            : "bg-red-500 text-white"
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
        })}
      </>
    );
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
                BBYO August Execs 2024 Room Checks
              </h2>
            </div>
            <Link href="/room-checks">
              <Button variant="outline">Back to Room Checks</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
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
          </div>

          <div>
            <Progress value={calculateProgress()} className="w-full" />
            <p className="text-center mt-2">
              {calculateProgress().toFixed(1)}% Checked In
            </p>
          </div>

          <div className="space-y-4">{renderRoomList()}</div>
        </CardContent>
      </Card>
    </main>
  );
};

export default CheckInScreen;
