"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ResearchAwareChat } from "@/features/research/components/research-aware-chat";

export function ResearchChatLink({
  researchId,
  available = true,
  label = "Chat with Research",
}: {
  researchId: string;
  available?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!available) {
    return (
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="w-full shrink-0 sm:w-auto"
        disabled
        title="Research Chat is available when the report is ready"
        variant="outline"
      >
        <MessageCircle className="size-4" />
        {label}
      </Button>
    );
  }

  return (
    <>
      <Button
        className="w-full shrink-0 sm:w-auto"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <MessageCircle className="size-4" />
        {label}
      </Button>
      <Sheet
        description="Ask questions about this completed research report."
        onOpenChange={setOpen}
        open={open}
        title="Ask AI"
      >
        <ResearchAwareChat
          presentation="drawer"
          researchId={researchId}
          scope="research"
        />
      </Sheet>
    </>
  );
}
