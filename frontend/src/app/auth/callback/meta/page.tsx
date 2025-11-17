import { Suspense } from "react";
import MetaCallback from "./content";

export default function MetaCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MetaCallback />
    </Suspense>
  );
}
