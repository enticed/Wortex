/**
 * API endpoint for individual user management
 * GET /api/admin/users/[id] - Get user details
 * PATCH /api/admin/users/[id] - Update user
 * DELETE /api/admin/users/[id] - Delete user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/client-server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin authorization
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = createClient();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user stats
    const { data: stats } = await supabase
      .from('stats')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    // Get recent scores (last 10)
    const { data: recentScores } = await supabase
      .from('scores')
      .select('*, puzzles(date)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      user,
      stats,
      recentScores,
    });
  } catch (error) {
    console.error('[API] Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin authorization
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = createClient();

    // Validate update fields (only allow certain fields to be updated)
    const allowedFields = ['user_tier', 'display_name', 'username', 'email'];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Don't allow empty updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Sync is_admin with user_tier if user_tier is being changed
    if (updates.user_tier) {
      updates.is_admin = updates.user_tier === 'admin';
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Error updating user:', error);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: adminUser.id,
      p_action: 'update_user',
      p_target_user_id: id,
      p_details: { updates },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[API] Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check admin authorization
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = createClient();

    // Prevent admin from deleting their own account
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get user info before deletion (for logging)
    const { data: user } = await supabase
      .from('users')
      .select('display_name, email, username')
      .eq('id', id)
      .single();

    // Delete user (cascade will handle related data)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Error deleting user:', error);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_admin_user_id: adminUser.id,
      p_action: 'delete_user',
      p_target_user_id: id,
      p_details: { deleted_user: user },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
