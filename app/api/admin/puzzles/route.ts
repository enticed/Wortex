import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminUser } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await getAdminUser();

    const body = await request.json();
    const {
      date,
      target_phrase,
      facsimile_phrase,
      difficulty,
      bonus_question,
      status = 'draft',
      metadata = {},
    } = body;

    // Validate required fields
    if (!date || !target_phrase || !facsimile_phrase || !difficulty || !bonus_question) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'Difficulty must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['draft', 'scheduled', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from Server Component, ignore
            }
          },
        },
      }
    );

    // Check if puzzle already exists for this date
    const { data: existing } = await supabase
      .from('puzzles')
      .select('date')
      .eq('date', date)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `A puzzle already exists for ${date}` },
        { status: 409 }
      );
    }

    // Insert puzzle
    const { data: puzzle, error } = await supabase
      .from('puzzles')
      .insert({
        date,
        target_phrase,
        facsimile_phrase,
        difficulty,
        bonus_question,
        status,
        metadata,
        theme: metadata?.theme || null,
        created_by: adminUser.id,
        created_by_ai: false,
        approved: status === 'published',
        approved_by: status === 'published' ? adminUser.id : null,
        approval_date: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating puzzle:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log admin activity
    await supabase.from('admin_activity_log').insert({
      admin_user_id: adminUser.id,
      action: 'create',
      entity_type: 'puzzle',
      entity_id: date,
      details: {
        status,
        difficulty,
        target_phrase: target_phrase.substring(0, 50),
      },
    });

    return NextResponse.json(puzzle, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/admin/puzzles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized: Admin access required' ? 403 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await getAdminUser();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from Server Component, ignore
            }
          },
        },
      }
    );

    let query = supabase
      .from('puzzles')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: puzzles, error, count } = await query;

    if (error) {
      console.error('Error fetching puzzles:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      puzzles,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/puzzles:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized: Admin access required' ? 403 : 500 }
    );
  }
}
