import type { Metadata } from "next";
import { TrainerApp } from "@/components/trainer-app";

export const metadata: Metadata = {
  title: "Practice library — LessonQuest",
  robots: { index: false },
};

export default function PracticePage() {
  return <TrainerApp />;
}
