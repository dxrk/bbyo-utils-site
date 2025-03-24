import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "BBYO Utilities",
  description: "A collection of utilities for BBYO.",
};

export default function UtilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}
