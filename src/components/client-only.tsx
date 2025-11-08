"use client";

import { useState, useEffect, type ReactNode } from "react";

type ClientOnlyProps = {
  children: ReactNode;
};

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
