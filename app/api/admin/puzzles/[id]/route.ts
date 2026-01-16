import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const cookieStore = await cookies();

    // Create admin client
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

    // Map status to approved field
    // 'published' or 'scheduled' = approved: true, 'draft' = approved: false
    const approved = body.status === 'published' || body.status === 'scheduled';

    // Update the puzzle
    const { error } = await supabase
      .from('puzzles')
      .update({
        target_phrase: body.target_phrase,
        facsimile_phrase: body.facsimile_phrase,
        difficulty: body.difficulty,
        bonus_question: body.bonus_question,
        approved: approved,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating puzzle:', error);
      return NextResponse.json(
        { error: 'Failed to update puzzle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/puzzles/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
