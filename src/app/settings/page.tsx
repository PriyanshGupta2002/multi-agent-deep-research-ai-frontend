import { Settings2 } from "lucide-react";
import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      description="Workspace preferences and research defaults will be available here."
      icon={Settings2}
      title="Settings"
    />
  );
}
