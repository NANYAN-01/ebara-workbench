import { createFileRoute } from "@tanstack/react-router";
import { StoreProvider } from "@/lib/store";
import { LayoutShell } from "@/components/LayoutShell";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  return (
    <StoreProvider>
      <LayoutShell />
    </StoreProvider>
  );
}
