import { ResearchReportPage } from "@/features/research/research-report-page";

type ReportPageProps = {
  params: Promise<{ researchId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { researchId } = await params;
  return <ResearchReportPage researchId={researchId} />;
}
