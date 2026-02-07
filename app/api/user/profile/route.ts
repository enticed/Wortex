/**
 * API Route: User Profile Management
 * GET /api/user/profile - Get user profile
 * PUT /api/user/profile - Update user profile
 *
 * Handles user profile data (tier, display name, admin status)
 * Does NOT expose sensitive data (email, password_hash)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/client-server';
import { checkCsrfProtection } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('wortex-session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client (server-side only, bypasses RLS)
    const supabase = createClient();

    // Fetch user profile (only safe fields, NOT email or password_hash)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, display_name, user_tier, is_admin, is_anonymous, created_at')
      .eq('id', session.userId)
      .single();

    if (error) {
      console.error('[API /user/profile] Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return sanitized profile data
    return NextResponse.json({
      id: user.id,
      displayName: user.display_name,
      userTier: user.user_tier || 'free',
      isAdmin: user.is_admin || false,
      isAnonymous: user.is_anonymous || false,
      createdAt: user.created_at,
    });

  } catch (error: any) {
    console.error('[API /user/profile] GET unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check CSRF protection
    const csrfResponse = await checkCsrfProtection(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Get session token from cookie
    const sessionToken = request.cookies.get('wortex-session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session
    const session = await verifySession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { displayName } = body;

    // Validate display name
    if (displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return NextResponse.json(
          { error: 'Display name must be a string' },
          { status: 400 }
        );
      }

      const trimmed = displayName.trim();
      if (trimmed.length > 0 && trimmed.length < 2) {
        return NextResponse.json(
          { error: 'Display name must be at least 2 characters' },
          { status: 400 }
        );
      }

      if (trimmed.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be 50 characters or less' },
          { status: 400 }
        );
      }
    }

    // Use service role client (server-side only, bypasses RLS)
    const supabase = createClient();

    // Update user profile
    const updateData: any = {};
    if (displayName !== undefined) {
      updateData.display_name = displayName.trim() || null;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', session.userId);

    if (error) {
      console.error('[API /user/profile] Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      );
    }

    // Fetch updated profile
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('id, display_name, user_tier, is_admin, is_anonymous, created_at')
      .eq('id', session.userId)
      .single();

    if (fetchError || !updatedUser) {
      console.error('[API /user/profile] Error fetching updated profile:', fetchError);
      return NextResponse.json(
        { error: 'Profile updated but failed to fetch new data' },
        { status: 500 }
      );
    }

    // Return updated profile
    return NextResponse.json({
      id: updatedUser.id,
      displayName: updatedUser.display_name,
      userTier: updatedUser.user_tier || 'free',
      isAdmin: updatedUser.is_admin || false,
      isAnonymous: updatedUser.is_anonymous || false,
      createdAt: updatedUser.created_at,
      message: 'Profile updated successfully',
    });

  } catch (error: any) {
    console.error('[API /user/profile] PUT unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
