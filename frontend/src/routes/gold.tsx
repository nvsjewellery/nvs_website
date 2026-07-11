import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";
export const Route = createFileRoute("/gold")({
  component: () => <CategoryPage metal="Gold" description="Handcrafted gold jewellery — BIS Hallmark certified, made to last generations." />,
});
