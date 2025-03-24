import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "BBYO Airtable Updater",
  description: "Summer CRM Tool",
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
