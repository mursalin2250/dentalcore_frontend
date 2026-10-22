import { useEffect } from "react";
import { BRAND_NAME } from "@/constants/ui";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | ${BRAND_NAME}`;
  }, [title]);
}
