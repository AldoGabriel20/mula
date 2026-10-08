import { Suspense } from "react";
import { VerifyNotice } from "@/components/auth";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyNotice />
    </Suspense>
  );
}
