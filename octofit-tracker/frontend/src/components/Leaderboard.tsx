import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      emptyText="leaderboard"
      mapData={(payload) => Array.isArray((payload as { leaderboard?: LeaderboardEntry[] }).leaderboard) ? (payload as { leaderboard: LeaderboardEntry[] }).leaderboard : []}
      renderItem={(entry) => `${entry.teamName ?? 'Team'}: ${entry.totalPoints ?? 0} pts (rank ${entry.rank ?? 0})`}
    />
  );
}
