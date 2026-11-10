import { ResearchAwareChat } from "@/features/research/components/research-aware-chat";
import type { ConversationScope } from "@/features/research/api/conversations-api";

type ChatPageProps = {
  searchParams: Promise<{ scope?: string; research_id?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { scope, research_id: researchId } = await searchParams;
  const chatScope: ConversationScope =
    scope === "research" && researchId ? "research" : "workspace";

  return (
    <ResearchAwareChat
      researchId={chatScope === "research" ? researchId : undefined}
      scope={chatScope}
    />
  );
}
