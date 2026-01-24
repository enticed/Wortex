/**
 * API Route: Sign out current user
 * POST /api/auth/signout
 */

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    // Clear session cookie
    await clearSession();

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

  } catch (error: any) {
    console.error('Error in signout route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
