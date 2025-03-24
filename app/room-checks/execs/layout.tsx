import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "BBYO August Execs 2024",
  description: "Room Checks",
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
