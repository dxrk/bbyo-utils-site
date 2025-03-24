"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getSheetData } from "./gs-action";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
}

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
  });

  useEffect(() => {
    async function getLaunchData() {
      try {
        const data = await getSheetData();

        if (data && data.data && data.data[0]) {
          setData({
            delegates: parseInt(data.data[0][0]),
            awards: parseInt(data.data[0][5]),
            iln: parseInt(data.data[0][6]),
            isf: parseInt(data.data[0][7]),
            cltc: parseInt(data.data[0][1]),
            iltc: parseInt(data.data[0][2]),
            kallah: parseInt(data.data[0][3]),
            ilsi: parseInt(data.data[0][4]),
          });
        } else {
          // Handle the case where data is undefined or invalid
          setData({
            delegates: 0,
            awards: 0,
            iln: 0,
            isf: 0,
            cltc: 0,
            iltc: 0,
            kallah: 0,
            ilsi: 0,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    // Initial fetch
    getLaunchData();

    // Fetch data every 15 seconds
    const intervalId = setInterval(getLaunchData, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

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
              <h2 className="text-2xl font-bold">Movement Launch Totals</h2>
            </div>
            <Link href="/utils">
              <Button variant="outline">Back to Utilities</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-cyan-300">IC</h3>
              <LaunchItem
                footer="Delegates"
                value={data.delegates}
                color="bg-cyan-300"
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-400">
                LEADERSHIP
              </h3>
              <LaunchItem
                footer="Awards"
                value={data.awards}
                color="bg-green-400"
              />
            </div>
            <div className="mt-[52px]">
              <LaunchItem footer="ILN" value={data.iln} color="bg-green-400" />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 text-red-400">ISF</h3>
              <LaunchItem footer="Total" value={data.isf} color="bg-red-500" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-yellow-300">
              SUMMER EXPERIENCES
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <LaunchItem
                footer="CLTC"
                value={data.cltc}
                color="bg-yellow-300"
              />
              <LaunchItem
                footer="ILTC"
                value={data.iltc}
                color="bg-yellow-300"
              />
              <LaunchItem
                footer="Kallah"
                value={data.kallah}
                color="bg-yellow-300"
              />
              <LaunchItem
                footer="ILSI"
                value={data.ilsi}
                color="bg-yellow-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
