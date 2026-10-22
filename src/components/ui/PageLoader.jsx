import { CircleNotch } from "@phosphor-icons/react";

export default function PageLoader() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <CircleNotch size={28} className="animate-spin text-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
