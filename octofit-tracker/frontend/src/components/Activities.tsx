import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};
//fixed
export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      emptyText="activities"
      mapData={(payload) => Array.isArray((payload as { activities?: Activity[] }).activities) ? (payload as { activities: Activity[] }).activities : []}
      renderItem={(activity) => `${activity.type ?? 'Activity'} (${activity.minutes ?? 0} minutes, ${activity.points ?? 0} points)`}
    />
  );
}
