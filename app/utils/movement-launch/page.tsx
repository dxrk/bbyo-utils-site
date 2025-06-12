"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getSheetData } from "./gs-action";

interface LaunchItemProps {
  header?: string;
  value: number;
  color: string;
  footer?: string;
}

interface SheetsData {
  delegates: number;
  awards: number;
  iln: number;
  isf: number;
  cltc: number;
  iltc: number;
  kallah: number;
  ilsi: number;
  broadcast: string;
}

type FeedMessage =
  | string
  | {
      pre: string;
      value: string;
      valueHighlight: boolean;
      post: string;
      program: string;
      programHighlight: boolean;
      end: string;
    };

const programColorMap: Record<string, string> = {
  IC: "text-cyan-300",
  CLTC: "text-yellow-300",
  ILTC: "text-yellow-300",
  KALLAH: "text-yellow-300",
  ILSI: "text-yellow-300",
  ISF: "text-red-400",
  ILN: "text-green-400",
  Awards: "text-green-400",
};

function formatNumber(num: number): string {
  return num.toLocaleString();
}

const LaunchItem: React.FC<LaunchItemProps> = ({ value, color, footer }) => {
  const formattedValue =
    footer === "Total" ? `$${formatNumber(value)}` : formatNumber(value);

  return (
    <div>
      <motion.div
        className={`${color} text-black p-4 rounded`}
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="text-4xl font-bold mb-1 text-center"
          >
            {formattedValue}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      {footer && (
        <div className="text-center text-xl font-semibold mt-2">{footer}</div>
      )}
    </div>
  );
};

export default function MovementLaunch() {
  const [data, setData] = useState<SheetsData>({
    delegates: 0,
    awards: 0,
    iln: 0,
    isf: 0,
    cltc: 0,
    iltc: 0,
    kallah: 0,
    ilsi: 0,
    broadcast: "",
  });
  const [feed, setFeed] = useState<
    { type: string; title: string; message: FeedMessage; timestamp: string }[]
  >([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastManualClose, setBroadcastManualClose] = useState(false);
  const lastBroadcastRef = useRef("");
  const prevSheetDataRef = useRef<string[][]>([]);
  const headerRowRef = useRef<string[]>([]);
  const hasInitialized = useRef(false);
  const initialBroadcastRef = useRef<string | null>(null);
  const debouncedFeedUpdate = useRef<NodeJS.Timeout | null>(null);

  const updateFeed = useCallback(
    (newItem: {
      type: string;
      title: string;
      message: FeedMessage;
      timestamp: string;
    }) => {
      if (debouncedFeedUpdate.current) {
        clearTimeout(debouncedFeedUpdate.current);
      }

      debouncedFeedUpdate.current = setTimeout(() => {
        setFeed((prev) => [newItem, ...prev]);
      }, 100) as unknown as NodeJS.Timeout;
    },
    []
  );

  useEffect(() => {
    async function getLaunchData() {
      try {
        const result = await getSheetData();
        const sheetRows: string[][] = result.data ?? [];

        // Store header row for column names
        if (sheetRows && sheetRows.length > 0) {
          headerRowRef.current = sheetRows[0];
        }

        if (!hasInitialized.current) {
          prevSheetDataRef.current = sheetRows;
          if (sheetRows && sheetRows[2]) {
            initialBroadcastRef.current = sheetRows[2][9] || "";
          }
          hasInitialized.current = true;
        } else if (
          prevSheetDataRef.current.length > 0 &&
          sheetRows &&
          sheetRows.length > 1
        ) {
          for (let i = 3; i < sheetRows.length; i++) {
            const prevRow = prevSheetDataRef.current[i] || [];
            const currRow = sheetRows[i] || [];
            const communityName = currRow[0];

            // Batch updates for smoother UI
            const updates: { col: number; value: string }[] = [];

            for (let col = 1; col < headerRowRef.current.length - 1; col++) {
              let currValue = currRow[col];
              let prevValue = prevRow[col];

              // Robust ISF detection and normalization
              const isISF = headerRowRef.current[col]
                ?.trim()
                .toUpperCase()
                .startsWith("ISF");
              if (isISF) {
                currValue = currValue?.replace(/[$,\\s]/g, "");
                prevValue = prevValue?.replace(/[$,\\s]/g, "");
              }

              if (
                currValue !== prevValue &&
                currValue &&
                !isNaN(Number(currValue))
              ) {
                updates.push({ col, value: currValue });
              }
            }

            // Process updates with slight delays to create a smoother feed effect
            updates.forEach((update, index) => {
              let message: FeedMessage = "";
              switch (headerRowRef.current[update.col]) {
                case "IC":
                case "CLTC":
                case "ILTC":
                case "KALLAH":
                case "ILSI":
                  message = {
                    pre: "pledged ",
                    value: update.value,
                    valueHighlight: true,
                    post: (update.value === "1" ? " teen" : " teens") + " to ",
                    program: headerRowRef.current[update.col],
                    programHighlight: true,
                    end: "!",
                  };
                  break;
                case "ISF":
                  message = {
                    pre: "pledged to raise",
                    value: ` $${update.value}`,
                    valueHighlight: true,
                    post: " for the ",
                    program: "ISF",
                    programHighlight: true,
                    end: "!",
                  };
                  break;
                case "ILN":
                  message = {
                    pre: "pledged ",
                    value: update.value,
                    valueHighlight: true,
                    post:
                      (update.value === "1" ? " teen" : " teens") + " for the ",
                    program: "ILN",
                    programHighlight: true,
                    end: "!",
                  };
                  break;
                case "AWARDS":
                  message = {
                    pre: "pledged ",
                    value: update.value,
                    valueHighlight: true,
                    post:
                      (update.value === "1" ? " teen" : " teens") +
                      " to apply for ",
                    program: "Awards",
                    programHighlight: true,
                    end: "!",
                  };
                  break;
                default:
                  message = "";
              }

              setTimeout(() => {
                updateFeed({
                  type: "update",
                  title: communityName,
                  message: message as FeedMessage,
                  timestamp: new Date().toISOString(),
                });
              }, index * 300); // Stagger updates by 150ms
            });
          }
        }
        prevSheetDataRef.current = sheetRows;

        if (sheetRows && sheetRows[2]) {
          setData({
            delegates: parseInt(sheetRows[2][1]),
            awards: parseInt(sheetRows[2][6]),
            iln: parseInt(sheetRows[2][7]),
            isf: parseInt(sheetRows[2][8].replace("$", "")),
            cltc: parseInt(sheetRows[2][2]),
            iltc: parseInt(sheetRows[2][3]),
            kallah: parseInt(sheetRows[2][4]),
            ilsi: parseInt(sheetRows[2][5]),
            broadcast: sheetRows[2][9] || "",
          });
        } else {
          setData({
            delegates: 0,
            awards: 0,
            iln: 0,
            isf: 0,
            cltc: 0,
            iltc: 0,
            kallah: 0,
            ilsi: 0,
            broadcast: "",
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    // Initial fetch
    getLaunchData();

    // Fetch data every 10 seconds
    const intervalId = setInterval(getLaunchData, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for broadcast message changes
  useEffect(() => {
    if (
      hasInitialized.current &&
      data.broadcast &&
      data.broadcast !== lastBroadcastRef.current &&
      data.broadcast !== initialBroadcastRef.current // Prevent initial broadcast
    ) {
      setBroadcastMsg(data.broadcast);
      setShowBroadcast(true);
      setBroadcastManualClose(false);
      lastBroadcastRef.current = data.broadcast;

      // Use Framer Motion's AnimatePresence for smoother transitions
      const timer = setTimeout(() => {
        setShowBroadcast(false);
        setFeed((prev) => [
          {
            type: "broadcast",
            title: "Broadcast",
            message: data.broadcast,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);
      }, 10000);

      return () => clearTimeout(timer); // Clean up timer
    }
  }, [data.broadcast]);

  return (
    <div className="bg-blue-700 text-white p-8 font-sans min-h-screen relative">
      {/* Full-screen broadcast overlay */}
      <AnimatePresence>
        {showBroadcast && !broadcastManualClose && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              backdropFilter: "blur(16px)",
              background: "rgba(30, 41, 59, 0.45)",
            }}
          >
            <motion.div
              className="relative flex flex-col items-center justify-center px-10 py-12 rounded-3xl shadow-2xl border border-blue-200/40 bg-white/10 m-2"
              initial={{ scale: 0.92, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: -40 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -30, opacity: 0 }}
                animate={{ scale: 1.2, rotate: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                  delay: 0.1,
                }}
                className="mb-6"
              >
                <span className="text-4xl drop-shadow-lg">📣</span>
              </motion.div>
              {/* Broadcast text */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-4xl md:text-5xl font-extrabold text-center text-white tracking-tight drop-shadow-lg"
                style={{ letterSpacing: "0.01em", lineHeight: 1.2 }}
              >
                {broadcastMsg}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main content and feed side by side, with header included */}
      <div className="flex gap-8 items-start">
        {/* Left column: header + main content */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-4xl font-bold mb-16">MOVEMENT LAUNCH TOTALS</h1>
          <div className="grid grid-cols-4 gap-4 mb-12">
            <div>
              <h2 className="text-3xl text-cyan-300 font-bold mb-4">IC</h2>
              <LaunchItem
                footer="Delegates"
                value={data.delegates}
                color="bg-cyan-300"
              />
            </div>
            <div>
              <h2 className="text-3xl text-green-400 font-bold mb-4">
                LEADERSHIP
              </h2>
              <LaunchItem
                footer="Awards"
                value={data.awards}
                color="bg-green-400"
              />
            </div>
            <div>
              <h2 className="text-3xl text-green-400 font-bold mb-4 invisible">
                Spacer
              </h2>
              <LaunchItem footer="ILN" value={data.iln} color="bg-green-400" />
            </div>
            <div>
              <h2 className="text-3xl text-red-400 font-bold mb-4">ISF</h2>
              <LaunchItem footer="Total" value={data.isf} color="bg-red-500" />
            </div>
          </div>
          <h2 className="text-3xl text-yellow-300 font-bold mb-4">
            SUMMER EXPERIENCES
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <LaunchItem footer="CLTC" value={data.cltc} color="bg-yellow-300" />
            <LaunchItem footer="ILTC" value={data.iltc} color="bg-yellow-300" />
            <LaunchItem
              footer="Kallah"
              value={data.kallah}
              color="bg-yellow-300"
            />
            <LaunchItem footer="ILSI" value={data.ilsi} color="bg-yellow-300" />
          </div>
        </div>
        {/* Feed box at the top right, no margin-top or vertical offset */}
        <div className="w-[350px] min-w-[300px] self-start">
          <div className="bg-blue-800 p-4 rounded-lg overflow-hidden h-[600px]">
            <h2 className="text-2xl font-bold mb-4">Live Feed</h2>
            <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)] pr-2 scrollbar-hide">
              {/* Render feed items with animation */}
              <AnimatePresence initial={false} mode="popLayout">
                {feed.length === 0 && (
                  <motion.div
                    className="text-blue-300 text-center mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    No feed items yet.
                  </motion.div>
                )}
                {feed.map((item, idx) => (
                  <motion.div
                    key={item.timestamp + idx}
                    initial={{ height: 0, opacity: 0, y: -20, marginBottom: 0 }}
                    animate={{
                      height: "auto",
                      opacity: 1,
                      y: 0,
                      marginBottom: "0.5rem",
                    }}
                    exit={{
                      height: 0,
                      opacity: 0,
                      marginBottom: 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 40,
                      mass: 1,
                    }}
                    layout
                    className={`overflow-hidden ${
                      item.type === "broadcast"
                        ? "border-2 border-yellow-400 rounded-lg"
                        : ""
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-blue-700 p-3 rounded-lg shadow-lg"
                    >
                      <div className="font-semibold">
                        {item.type === "broadcast" ? "Broadcast" : item.title}
                      </div>
                      <div className="text-sm text-blue-300">
                        {typeof item.message === "string" ? (
                          item.message
                        ) : (
                          <>
                            {item.message.pre}
                            <span className="font-bold text-yellow-300">
                              {item.message.value}
                            </span>
                            {item.message.post}
                            <span
                              className={`font-bold ${
                                programColorMap[item.message.program] ||
                                "text-cyan-300"
                              }`}
                            >
                              {item.message.program}
                            </span>
                            {item.message.end}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-blue-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* Fixed logo at the bottom left */}
      <div className="fixed bottom-6 left-6 z-50">
        <Image src={"/bbyo-100.png"} width={120} height={120} alt="BBYO Logo" />
      </div>
    </div>
  );
}
