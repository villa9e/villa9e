// Shared constants for the Data Locker — keys match data_sharing_preferences columns

export const EARNINGS_RATES: Record<string, number> = {
  share_gps_goals: 2.40, share_content_engagement: 1.80, share_location: 0.80,
  share_wellness_metrics: 8.50, share_financial_behavior: 3.20, share_commerce_behavior: 1.60,
  share_social_graph: 1.40, share_goal_content_interests: 0.80, share_entertainment: 0.70,
  share_behavioral_patterns: 0.60, share_vlg_patterns: 0.90, share_communication_patterns: 0.50,
};

export const CATEGORY_LABELS: Record<string, string> = {
  share_gps_goals: 'GPS Goals',
  share_content_engagement: 'Content Engagement',
  share_location: 'Location',
  share_wellness_metrics: 'Wellness Metrics',
  share_financial_behavior: 'Financial Behavior',
  share_commerce_behavior: 'Commerce Behavior',
  share_social_graph: 'Social Graph',
  share_goal_content_interests: 'Goal Content Interests',
  share_entertainment: 'Entertainment',
  share_behavioral_patterns: 'Behavioral Patterns',
  share_vlg_patterns: 'VLG Patterns',
  share_communication_patterns: 'Communication Patterns',
};

// Permissions/Delete page category ids -> data_sharing_preferences columns
export const PERMISSION_ID_TO_SHARE_KEY: Record<string, string> = {
  gps: 'share_gps_goals',
  content: 'share_content_engagement',
  location: 'share_location',
  wellness: 'share_wellness_metrics',
  finance: 'share_financial_behavior',
  commerce: 'share_commerce_behavior',
  social: 'share_social_graph',
  goalcont: 'share_goal_content_interests',
  entertain: 'share_entertainment',
  behavior: 'share_behavioral_patterns',
  vlg: 'share_vlg_patterns',
  comms: 'share_communication_patterns',
};

export const SHARE_KEYS = Object.keys(EARNINGS_RATES);

export function dataCategoryToShareKey(dataCategory: string): string {
  return 'share_' + dataCategory.replace(/ /g, '_');
}
