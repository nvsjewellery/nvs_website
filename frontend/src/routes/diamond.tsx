import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
export const Route = createFileRoute("/diamond")({
  component: () => <CategoryPage metal="Diamond" description="GIA and IGI certified diamonds set into heirloom pieces you will treasure forever." />,
});
