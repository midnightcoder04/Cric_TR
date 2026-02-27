import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { playerName, role, format, matchesPlayed, averageScore, strikeRate, recentForm } = await request.json()

    // Validate input
    if (!playerName || !role || !format) {
      return Response.json(
        { error: 'playerName, role, and format are required' },
        { status: 400 }
      )
    }

    // Insert player performance data
    const { data, error } = await supabase
      .from('players_performance')
      .insert([
        {
          player_id: `IND_${Date.now()}`,
          player_name: playerName,
          role: role,
          format: format,
          matches_played: matchesPlayed || 0,
          average_score: averageScore || 0,
          strike_rate: strikeRate || 0,
          recent_form: recentForm || [],
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[v0] Supabase insert error:', error)
      return Response.json(
        { error: 'Failed to insert player data', details: error.message },
        { status: 500 }
      )
    }

    console.log('[v0] Player data inserted successfully:', data)

    return Response.json({
      success: true,
      message: 'Player performance data added successfully',
      data: data,
    })
  } catch (error) {
    console.error('[v0] Error adding player performance:', error)
    return Response.json(
      { error: 'Failed to add player performance', message: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Fetch all player performance data
    const { data, error } = await supabase
      .from('players_performance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return Response.json(
        { error: 'Failed to fetch player data', details: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      data: data,
      count: data?.length || 0,
    })
  } catch (error) {
    console.error('[v0] Error fetching player data:', error)
    return Response.json(
      { error: 'Failed to fetch player data', message: String(error) },
      { status: 500 }
    )
  }
}
