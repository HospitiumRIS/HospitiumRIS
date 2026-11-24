import EthicsRecordView from '@/components/Ethics/EthicsRecordView';

/** A researcher's ethics application or uploaded clearance, same layout as the research office's view. */
export default function ResearcherEthicsRecordPage() {
  return <EthicsRecordView audience="researcher" />;
}
