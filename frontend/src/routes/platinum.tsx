import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
export const Route = createFileRoute("/platinum")({
  component: () => <CategoryPage metal="Platinum" description="Pure PT950 platinum — hypoallergenic, enduring, precious." />,
});
