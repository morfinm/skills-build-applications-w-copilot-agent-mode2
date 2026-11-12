import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint="/api/workouts/suggestions/mona@example.com"
      emptyText="workout suggestions"
      mapData={(payload) => Array.isArray((payload as { suggestions?: WorkoutSuggestion[] }).suggestions) ? (payload as { suggestions: WorkoutSuggestion[] }).suggestions : []}
      renderItem={(suggestion) => `${suggestion.title ?? 'Workout'}: ${suggestion.reason ?? 'Build strength and endurance'}`}
    />
  );
}
