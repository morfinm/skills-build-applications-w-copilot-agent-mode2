import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      emptyText="teams"
      mapData={(payload) => Array.isArray((payload as { teams?: Team[] }).teams) ? (payload as { teams: Team[] }).teams : []}
      renderItem={(team) => `${team.name ?? 'Unknown team'} (${(team.members ?? []).length} members)`}
    />
  );
}
