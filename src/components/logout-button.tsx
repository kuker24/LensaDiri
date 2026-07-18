"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { postAuthenticatedMutation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setFailed(false);
    setIsPending(true);
    try {
      await postAuthenticatedMutation("/api/auth/logout");
      router.push("/");
      router.refresh();
    } catch {
      setFailed(true);
      setIsPending(false);
    }
  }

  return (
    <div>
      <Button disabled={isPending} onClick={logout} size="sm" type="button" variant="secondary">
        {isPending ? "Keluar…" : "Keluar"}
      </Button>
      {failed ? (
        <p className="text-danger mt-2 text-sm" role="alert">
          Gagal keluar. Coba lagi.
        </p>
      ) : null}
    </div>
  );
}
