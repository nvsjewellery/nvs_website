import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
export const Route = createFileRoute("/silver")({
  component: () => <CategoryPage metal="Silver" description="Sterling silver crafted with heritage techniques — everyday elegance, timeless value." />,
});
