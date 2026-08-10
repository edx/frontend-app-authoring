import type { PipelineStatus } from '../types/courseReport';

export const PIPELINE_STATUS_LABEL: Record<PipelineStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  PARTIAL: 'Partial',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
};
