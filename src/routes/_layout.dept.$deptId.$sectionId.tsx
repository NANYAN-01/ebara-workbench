import { createFileRoute } from "@tanstack/react-router";
import { GroupView } from "@/components/GroupView";

export const Route = createFileRoute("/_layout/dept/$deptId/$sectionId")({ component: SectionPage });

function SectionPage() {
  return <GroupView />;
}
