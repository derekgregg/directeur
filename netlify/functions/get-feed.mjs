import { getSupabase } from './lib/supabase.mjs';
import { getUserIdFromRequest } from './lib/auth.mjs';

// Personal activity feed — shows the logged-in user's own activities
// Includes completed activities and pending uploads
export default async (req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') || 'start_date';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  const allowedSorts = ['start_date', 'distance', 'average_speed', 'moving_time', 'elevation_gain'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'start_date';

  const db = getSupabase();

  // Get completed activities
  const { data: activities } = await db
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order(sortCol, { ascending: false })
    .limit(limit);

  // Get pending/processing uploads
  const { data: uploads } = await db
    .from('uploads')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(10);

  return new Response(JSON.stringify({
    activities: activities || [],
    pending_uploads: uploads || [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
