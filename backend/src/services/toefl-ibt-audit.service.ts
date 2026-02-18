type ToeflIbtAuditEvent =
  | 'mst_route_decision'
  | 'mst_section_scored'
  | 'toefl_ibt_report_generated'
  | 'toefl_ibt_scores_hydrated'
  | 'toefl_ibt_scoring_pipeline_start'
  | 'toefl_ibt_scoring_pipeline_end';

export function logToeflIbtAuditEvent(event: ToeflIbtAuditEvent, payload: Record<string, unknown>) {
  const entry = {
    domain: 'toefl_ibt_2026',
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  console.log(JSON.stringify(entry));
}
