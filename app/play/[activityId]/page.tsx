import { StudentPlayScreen } from "@/components/student-play-screen";
import { getPublishedActivity } from "@/lib/server/activity-repository";

export const dynamic = "force-dynamic";

type PlayPageProps = {
  params: Promise<{
    activityId: string;
  }>;
};

export default async function PlayPage({ params }: PlayPageProps) {
  const { activityId } = await params;

  return <StudentPlayScreen activity={await getPublishedActivity(activityId)} />;
}
