"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export function DialogTestFixture({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open1, setOpen1] = useState(initiallyOpen);
  const [open2, setOpen2] = useState(false);

  return (
    <section className="container-shell py-12">
      <h1 className="font-display text-3xl font-semibold">Test Dialog Primitive</h1>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          autoFocus={initiallyOpen}
          id="initial-dialog-trigger"
          className="focus-ring border-line min-h-11 rounded-sm border px-4 py-2 font-semibold"
          onClick={() => setOpen1(true)}
        >
          Pemicu Initial Dialog
        </button>
        <button
          id="trigger-dialog-1"
          className="focus-ring bg-lens text-canvas min-h-11 rounded-sm px-4 py-2 font-semibold"
          onClick={() => setOpen1(true)}
        >
          Buka Dialog 1
        </button>
        <button
          id="trigger-dialog-2"
          className="focus-ring bg-lens text-canvas min-h-11 rounded-sm px-4 py-2 font-semibold"
          onClick={() => setOpen2(true)}
        >
          Buka Dialog 2
        </button>
      </div>

      <Dialog open={open1} onClose={() => setOpen1(false)} title="Judul Dialog Kesatu">
        <p className="text-ink-muted">Konten dialog kesatu.</p>
        <button
          id="dialog-button-1"
          className="focus-ring bg-lens text-canvas mt-4 min-h-12 rounded-sm px-4 py-2.5"
          onClick={() => setOpen1(false)}
        >
          Aksi Dialog 1
        </button>
      </Dialog>

      <Dialog open={open2} onClose={() => setOpen2(false)} title="Judul Dialog Kedua">
        <p className="text-ink-muted">Konten dialog kedua.</p>
        <button
          id="dialog-button-2"
          className="focus-ring bg-lens text-canvas mt-4 min-h-12 rounded-sm px-4 py-2.5"
          onClick={() => setOpen2(false)}
        >
          Aksi Dialog 2
        </button>
      </Dialog>
    </section>
  );
}
