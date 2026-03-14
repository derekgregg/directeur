import { getSupabase } from './lib/supabase.mjs';
import { getAthleteActivities, getActivity } from './lib/strava.mjs';
import { generateRoast } from './lib/claude.mjs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { athleteId } = await req.json();
  if (!athleteId) {
    return new Response(JSON.stringify({ error: 'athleteId required' }), { status: 400 });
  }

  // Fire and forget
  backfill(athleteId).catch((err) =>
    console.error('Backfill error:', err)
  );

  return new Response(JSON.stringify({ status: 'backfill started' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

async function backfill(athleteId) {
  const db = getSupabase();

  const { data: athlete } = await db
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single();

  if (!athlete) return;

  // Last 30 days
  const after = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const activities = await getAthleteActivities(athleteId, after);
  console.log(`Backfill: found ${activities.length} activities for athlete ${athleteId}`);

  for (const summary of activities) {
    // Check if already stored
    const { data: existing } = await db
      .from('activities')
      .select('id')
      .eq('id', summary.id)
      .single();

    if (existing) continue;

    // Fetch full activity details
    const activity = await getActivity(athleteId, summary.id);

    const activityRow = {
      id: activity.id,
      athlete_id: athleteId,
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      elevation_gain: activity.total_elevation_gain,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_watts: activity.average_watts || null,
      max_watts: activity.max_watts || null,
      suffer_score: activity.suffer_score || null,
      start_date: activity.start_date,
      sport_type: activity.sport_type || activity.type,
    };

    await db.from('activities').upsert(activityRow);

    // Generate roast
    try {
      const roast = await generateRoast(activity, athlete);
      await db
        .from('activities')
        .update({ roast, roast_generated_at: new Date().toISOString() })
        .eq('id', activity.id);
      console.log(`Backfill: roasted activity ${activity.id}`);
    } catch (err) {
      console.error(`Backfill: roast failed for ${activity.id}:`, err);
    }
  }

  console.log(`Backfill complete for athlete ${athleteId}`);
}
