// Background function to regenerate Claude commentary for activities using
// data already stored in the database. Does NOT re-run ride analysis or fetch
// Strava streams — use reanalyze-activities-background for that.
//
// POST /api/regenerate-commentary-background
// Authorization: Bearer ${ADMIN_SECRET}
// Body (all optional):
//   { since: ISO date, until: ISO date, userId: uuid, limit: number, offset: number, dryRun: bool }

import { getSupabase } from './lib/supabase.mjs';
import { generateRoast } from './lib/claude.mjs';

export default async (req) => {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { since, until, userId, dryRun } = body;
  const limit = body.limit ?? 1000;
  const offset = body.offset ?? 0;

  const db = getSupabase();

  let query = db
    .from('activities')
    .select('*')
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (since) query = query.gte('start_date', since);
  if (until) query = query.lte('start_date', until);
  if (userId) query = query.eq('user_id', userId);

  const { data: activities, error } = await query;
  if (error) {
    console.error('Failed to fetch activities:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`Regenerating commentary for ${activities.length} activities (offset=${offset}, limit=${limit})`);

  const userIds = [...new Set(activities.map(a => a.user_id).filter(Boolean))];
  const { data: users } = await db
    .from('users')
    .select('id, ftp, weight, height, display_name')
    .in('id', userIds);
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));

  const results = { processed: 0, regenerated: 0, skipped: 0, failed: 0, details: [] };

  for (const activity of activities) {
    results.processed++;
    const user = userMap[activity.user_id];

    const activityForRoast = buildActivityForRoast(activity, user);
    const athlete = {
      firstname: user?.display_name?.split(' ')[0] || '?',
      lastname: user?.display_name?.split(' ').slice(1).join(' ') || '',
    };

    if (dryRun) {
      results.skipped++;
      results.details.push({ id: activity.id, status: 'dry_run' });
      continue;
    }

    try {
      const roast = await generateRoast(activityForRoast, athlete);
      await db
        .from('activities')
        .update({ roast, roast_generated_at: new Date().toISOString() })
        .eq('id', activity.id);
      results.regenerated++;
      results.details.push({ id: activity.id, status: 'regenerated' });
    } catch (err) {
      console.error(`Commentary regen failed for ${activity.id}:`, err.message);
      results.failed++;
      results.details.push({ id: activity.id, status: 'failed', error: err.message });
    }
  }

  console.log(`Done: ${results.regenerated} regenerated, ${results.skipped} skipped, ${results.failed} failed (of ${results.processed})`);

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function buildActivityForRoast(activity, user) {
  const e = activity.enrichment_data || {};
  const power_analysis = {
    best_efforts: e.best_efforts,
    variability_index: e.variability_index,
    intensity_factor: e.intensity_factor,
    tss: e.tss,
    intervals: e.intervals,
    normalized_power: e.normalized_power,
  };
  const ride_analysis = {
    power: power_analysis,
    climbs: e.climbs,
    segments: e.segments,
    wprime: e.wprime,
    hr_analysis: e.hr_analysis,
    pacing: e.pacing,
  };

  return {
    ...activity,
    power_analysis,
    ride_analysis,
    athlete_weight: user?.weight,
    athlete_height: user?.height,
    athlete_ftp: user?.ftp,
  };
}
