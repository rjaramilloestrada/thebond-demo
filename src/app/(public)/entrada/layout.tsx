import type { Metadata } from "next";

/** "Mi entrada" lleva un token personal en la URL: no se indexa. */
export const metadata: Metadata = {
  title: "Mi entrada",
  robots: { index: false, follow: false },
};

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
