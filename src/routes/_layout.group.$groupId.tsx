import { createFileRoute } from "@tanstack/react-router";
import { GroupView } from "@/components/GroupView";

export const Route = createFileRoute("/_layout/group/$groupId")({ component: GroupPage });

function GroupPage() {
  return <GroupView />;
}
