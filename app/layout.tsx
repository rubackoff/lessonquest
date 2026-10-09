import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/onest/wght.css";
import "./globals.css";
import "./lab.css";
import "./design-system.css";

export const metadata: Metadata = {
  title: "LessonQuest — Interactive Learning",
  description:
    "Interactive learning games, practice labs, and short adventures for students and tutors.",
  icons: {
    icon: "/corgi-logo-concept.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
