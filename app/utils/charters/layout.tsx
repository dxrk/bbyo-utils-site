import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "BBYO Charters",
  description: "Automated Chapter Charters",
};

export default function ChartersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
