import mongoose, { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input is required'), { status: 400 });
  }

  const candidate = input as Record<string, unknown>;
  const userId = typeof candidate.userId === 'string' ? candidate.userId : undefined;
  const teamId = typeof candidate.teamId === 'string' ? candidate.teamId : undefined;
  const type = typeof candidate.type === 'string' ? candidate.type.trim() : '';
  const minutes = typeof candidate.minutes === 'number'
    ? candidate.minutes
    : candidate.minutes !== undefined && candidate.minutes !== null
      ? Number(candidate.minutes)
      : Number.NaN;

  if (!userId || !teamId || !type || !Number.isFinite(minutes) || minutes <= 0 || !isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and minutes'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);

  if (!user || !team) {
    throw Object.assign(new Error('Referenced user or team does not exist'), { status: 400 });
  }

  return Activity.create({
    user: new mongoose.Types.ObjectId(userId),
    team: new mongoose.Types.ObjectId(teamId),
    type,
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team input is required'), { status: 400 });
  }

  const candidate = input as Record<string, unknown>;
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const mascot = typeof candidate.mascot === 'string' ? candidate.mascot.trim() : '';
  const rawMembers = Array.isArray(candidate.members) ? candidate.members : [];

  if (!name || !mascot) {
    throw Object.assign(new Error('Team requires name and mascot'), { status: 400 });
  }

  const memberIds = rawMembers
    .filter((member): member is string => typeof member === 'string')
    .filter((memberId) => isValidObjectId(memberId));

  if (rawMembers.some((member) => typeof member !== 'string' || !isValidObjectId(member))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const team = await Team.create({
    name,
    mascot,
    members: memberIds,
  });

  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }

  return team;
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
  ]);

  return rows.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type ? String(recentActivities[0].type).toLowerCase() : '';
  const goal = String(user.fitnessGoal ?? '').trim().toLowerCase();

  const workouts = await Workout.find().lean();

  const scored = workouts
    .map((workout) => {
      const workoutFocus = String(workout.focus ?? '').toLowerCase();
      const workoutTitle = String(workout.title ?? '').toLowerCase();
      const relevantGoal = goal && (workoutFocus.includes(goal) || workoutTitle.includes(goal));
      const relevantActivity = recentType && (workoutFocus.includes(recentType) || workoutTitle.includes(recentType));
      const score = Number(relevantGoal) * 2 + Number(relevantActivity) * 2 + Number(workoutFocus === goal) + Number(workoutFocus === recentType);

      const reason = recentType
        ? `Based on your recent ${recentType} activity and ${goal || 'fitness'} goal, this workout reinforces the same pattern.`
        : `Based on your ${goal || 'fitness'} goal, this workout matches your current training pattern.`;

      return { ...workout, score, reason };
    })
    .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)))
    .map(({ score, reason, ...workout }) => ({
      ...workout,
      reason,
    }));

  return scored;
}

export { User };
