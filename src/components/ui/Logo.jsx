import { Link } from "react-router-dom";
import { Tooth } from "@phosphor-icons/react";
import { ROUTES } from "@/constants/routes";

export default function Logo({ onClick }) {
  return (
    <Link
      to={ROUTES.DASHBOARD}
      onClick={onClick}
      aria-label="DentalCore dashboard"
      className="flex items-center gap-2.5 rounded-lg"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Tooth weight="fill" size={22} />
      </span>
      <span className="text-xl font-semibold tracking-tight">
        Dental<span className="text-primary">Core</span>
      </span>
    </Link>
  );
}
