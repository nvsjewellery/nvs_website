import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

// Define search param schema
type GoldSearch = {
  cat?: string;
};

export const Route = createFileRoute("/gold")({
  validateSearch: (search: Record<string, unknown>): GoldSearch => {
    return {
      cat: (search.cat as string) || undefined,
    };
  },
  component: GoldRoute,
});

function GoldRoute() {
  return (
    <CategoryPage
      metal="Gold"
      description="Handcrafted gold jewellery — BIS Hallmark certified, made to last generations."
    />
  );
}