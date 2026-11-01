import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function AnalyticsPage() {
  usePageTitle("Analytics");
  return (
    <PlaceholderPage
      title="Analytics"
      description="This page is not built yet. Module reports will expand here."
    />
  );
}
