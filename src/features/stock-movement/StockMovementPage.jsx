import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { STOCK_MOVEMENT_LABELS } from "@/constants/inventory";

const types = new Intl.ListFormat("en").format(
  Object.values(STOCK_MOVEMENT_LABELS).map((label) => label.toLowerCase()),
);

export default function StockMovementPage() {
  return <PlaceholderPage title="Stock Movement" description={`Log ${types}.`} />;
}
