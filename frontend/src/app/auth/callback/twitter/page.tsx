import { Suspense } from "react";
import TwitterCallbackContent from "./content";

export default function TwitterCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TwitterCallbackContent />
    </Suspense>
  );
}
