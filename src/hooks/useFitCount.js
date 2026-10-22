import { useEffect, useState } from "react";

// Returns [ref, count]: how many rows of `rowHeight` px fit in the element. null until measured.
export function useFitCount(rowHeight) {
  const [node, setNode] = useState(null);
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setCount(Math.floor((entry.contentRect.height + 1) / rowHeight)),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rowHeight]);

  return [setNode, count];
}
