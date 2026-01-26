/**
 * API endpoint for admin user management
 * GET /api/admin/users - List all users with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client-server';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || 'all'; // all, free, premium, admin

    const offset = (page - 1) * limit;

    // Create Supabase client with service role for admin access
    const supabase = createClient();

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // Apply tier filter
    if (tier && tier !== 'all') {
      query = query.eq('user_tier', tier);
    }

    // Apply search filter (search by display_name, email, or username)
    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('[API] Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
