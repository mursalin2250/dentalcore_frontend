import { ArrowRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { DASHBOARD_TEXT } from "@/constants/dashboard";

export default function ViewDetailsLink({ to, label }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="group inline-flex h-9 shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3.5 text-sm font-medium text-primary transition-[background-color,color,transform] duration-150 ease-out hover:bg-primary-soft hover:text-primary active:scale-[0.97]"
    >
      {DASHBOARD_TEXT.VIEW_DETAILS}
      <ArrowRight size={16} className="transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  );
}
