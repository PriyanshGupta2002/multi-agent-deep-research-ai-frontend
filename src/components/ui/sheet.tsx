"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root modal onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex justify-end">
          <Dialog.Popup className="flex h-dvh w-full max-w-[520px] flex-col overflow-y-auto border-l bg-background text-foreground shadow-xl outline-none transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full max-sm:max-w-none">
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {description}
            </Dialog.Description>
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
