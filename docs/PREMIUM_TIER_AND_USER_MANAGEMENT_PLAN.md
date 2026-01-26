# Premium Subscription Tier & Admin User Management Plan

**Date:** 2026-01-25
**Status:** Planning Phase
**Priority:** High

---

## Executive Summary

This document outlines the plan to add:
1. **Premium subscription tiers** for users (Free, Premium, Admin)
2. **Admin user management interface** at `/admin/users`
3. Enhanced user tracking (username, joined date, last active)

---

## Current State Analysis

### Database Schema (users table)
Currently has:
- `id` (UUID) - Primary key
- `created_at` (TIMESTAMPTZ) - User creation timestamp
- `display_name` (TEXT) - User's display name
- `email` (TEXT) - User's email (nullable for anonymous)
- `timezone` (TEXT) - User's timezone
- `is_anonymous` (BOOLEAN) - Whether user is anonymous
- `password_changed_at` (TIMESTAMPTZ) - Password change tracking
- `last_login` (TIMESTAMPTZ) - Last login timestamp
- `subscription_status` ('none' | 'active' | 'expired') - **Already exists!**
- `subscription_expires_at` (TIMESTAMPTZ) - **Already exists!**
- `is_admin` (BOOLEAN) - Admin flag **Already exists via migration!**

### Admin System
- Admin authentication system is **already in place**
- Admin pages at `/admin/*` with access control
- Uses `requireAdmin()` function for authorization
- Admin layout with navigation

---

## Phase 1: Database Schema Updates

### 1.1 Add User Tier System

**Create new migration:** `lib/supabase/migrations/add_user_tiers.sql`

```sql
-- Add user_tier column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'free'
CHECK (user_tier IN ('free', 'premium', 'admin'));

-- Add index for faster tier-based queries
CREATE INDEX IF NOT EXISTS users_user_tier_idx ON users(user_tier);

-- Add stripe_customer_id for payment integration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add username column for better identification
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for username (excluding NULL)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username)
WHERE username IS NOT NULL;

-- Add last_active tracking for activity monitoring
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Update last_active on score submission
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_user_last_active
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_last_active();
```

### 1.2 Update Type Definitions

**Update:** `types/database.ts`

```typescript
users: {
  Row: {
    id: string;
    created_at: string;
    display_name: string | null;
    username: string | null;  // NEW
    email: string | null;
    timezone: string;
    is_anonymous: boolean;
    password_changed_at: string | null;
    last_login: string | null;
    last_active: string | null;  // NEW
    subscription_status: 'none' | 'active' | 'expired';
    subscription_expires_at: string | null;
    is_admin: boolean;  // NEW
    user_tier: 'free' | 'premium' | 'admin';  // NEW
    stripe_customer_id: string | null;  // NEW
    stripe_subscription_id: string | null;  // NEW
  };
  // ... Insert and Update types
}
```

---

## Phase 2: Premium Tier Features & Pricing

### 2.1 Tier Comparison

| Feature | Free | Premium ($1/month) | Admin |
|---------|------|----------------------|-------|
| Daily Puzzle Access | ✅ | ✅ | ✅ |
| Leaderboards | ✅ | ✅ | ✅ |
| Stats Tracking | ✅ | ✅ | ✅ |
| Archive Access | ❌ | ✅ Unlimited | ✅ Unlimited |
| Ad-Free Experience | ❌ | ✅ | ✅ |
| Custom Themes | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Streak Freeze (2/month) | ❌ | ✅ | ✅ |
| Advanced Stats | ❌ | ✅ | ✅ |
| Exclusive Badge | ❌ | 👑 Premium | 🛡️ Admin |
| User Management | ❌ | ❌ | ✅ |
| Puzzle Management | ❌ | ❌ | ✅ |

### 2.2 Subscription Pricing Strategy

**Pricing:**
- **Monthly:** $1.00/month
- **Annual:** $10.00/year (save 17% - 2 months free)

**Payment Processing:**
- Use **Stripe** for payment processing
- Implement webhook handlers for subscription events
- Auto-renewal (no free trial, no refunds - keep it simple)
- Email reminders 7 days before expiry

### 2.3 Premium Feature Implementation Priority

**Phase 2A - MVP Premium Features (Priority):**
1. ✅ Archive access (all past puzzles) - **HIGH PRIORITY**
2. ✅ Ad-free experience - **HIGH PRIORITY**
3. ✅ Premium badge on leaderboards - **HIGH PRIORITY**

**Phase 2B - Enhanced Premium Features (Future):**
1. Custom color themes
2. Streak freeze functionality
3. Advanced analytics dashboard
4. Export game history
5. Basic stats enhancements

---

## Phase 3: Admin User Management Interface

### 3.1 User Management Page Structure

**Route:** `/admin/users`

**Create:** `app/admin/users/page.tsx`

```
┌─────────────────────────────────────────────────────────┐
│  Admin > Users                                     🔍   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Total Users: 1,234  |  👑 Premium: 56  |  🛡️ Admin: 3 │
│                                                         │
│  Filters: [All Users ▼] [Free/Premium/Admin ▼]         │
│  Search: [____________]  🔍 Search                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Username  │ Email        │ Tier │ Joined │ Last  │  │
│  │           │              │      │        │ Active│  │
│  ├──────────────────────────────────────────────────┤  │
│  │ gjavier   │ gj@gmail.com │ 👤   │ 1/15   │ 2h ago│ Actions ▼│
│  │ player123 │ (anonymous)  │ 👤   │ 1/20   │ 5m ago│ Actions ▼│
│  │ vipuser   │ vip@test.com │ 👑   │ 1/10   │ 1d ago│ Actions ▼│
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ← Previous | 1 2 3 ... 25 | Next →                   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 User Actions Dropdown

Each user row has an "Actions" dropdown with:
- **View Details** - Show full user profile
- **Edit Tier** - Change between Free/Premium/Admin
- **Reset Password** - Send password reset email
- **View Activity** - Show login history and game stats
- **Suspend Account** - Temporary suspension
- **Delete User** - Permanent deletion (with confirmation)

### 3.3 User Details Modal

When clicking "View Details":

```
┌───────────────────────────────────────────┐
│  User Details: gjavier          [× Close] │
├───────────────────────────────────────────┤
│                                           │
│  🆔 ID: 7a3c8f9b-...                      │
│  👤 Username: gjavier                     │
│  📧 Email: gj@gmail.com                   │
│  🏷️ Tier: Free                            │
│  📅 Joined: Jan 15, 2026                  │
│  🕐 Last Login: Jan 25, 2026 2:30 PM      │
│  ⚡ Last Active: 2 hours ago              │
│  🎮 Total Games: 42                       │
│  🏆 Average Score: 23.5                   │
│  🔥 Current Streak: 7 days                │
│  💎 Best Streak: 15 days                  │
│  📊 Subscription: None                    │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ Change Tier:                        │ │
│  │ [Free ▼] [Premium ▼] [Admin ▼]     │ │
│  │                                     │ │
│  │ [Update Tier]                       │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  Danger Zone:                             │
│  [Reset Password] [Suspend] [Delete]      │
└───────────────────────────────────────────┘
```

### 3.4 Tier Management

**Tier Change Modal:**

```
┌─────────────────────────────────────────┐
│  Change User Tier                       │
├─────────────────────────────────────────┤
│                                         │
│  User: gjavier (gj@gmail.com)          │
│  Current Tier: Free                    │
│                                         │
│  Select New Tier:                      │
│  ○ Free                                │
│  ○ Premium                             │
│  ○ Admin                               │
│                                         │
│  ⚠️ Warning: Changing to Admin gives   │
│     full access to all admin features  │
│                                         │
│  Reason for change (optional):         │
│  [_____________________________]        │
│                                         │
│  [Cancel]  [Confirm Change]            │
└─────────────────────────────────────────┘
```

### 3.5 Delete User Confirmation

**Multi-step confirmation to prevent accidents:**

```
┌─────────────────────────────────────────┐
│  🚨 Delete User Account                 │
├─────────────────────────────────────────┤
│                                         │
│  You are about to DELETE:              │
│                                         │
│  Username: gjavier                     │
│  Email: gj@gmail.com                   │
│  Total Games: 42                       │
│  Created: Jan 15, 2026                 │
│                                         │
│  ⚠️ THIS ACTION CANNOT BE UNDONE!      │
│                                         │
│  This will permanently delete:         │
│  ✓ User account                        │
│  ✓ All scores and game history        │
│  ✓ All stats and achievements          │
│  ✓ Subscription data                   │
│                                         │
│  Type "DELETE" to confirm:             │
│  [_____________________________]        │
│                                         │
│  [Cancel]  [Delete Forever]            │
└─────────────────────────────────────────┘
```

---

## Phase 4: Implementation Roadmap

### Sprint 1: Database & Backend (Week 1)

**Tasks:**
1. ✅ Create database migration for user tiers
2. ✅ Update TypeScript types
3. ✅ Add tier-checking utility functions
4. ✅ Create API endpoints for user management:
   - `GET /api/admin/users` - List all users (paginated)
   - `GET /api/admin/users/[id]` - Get user details
   - `PATCH /api/admin/users/[id]/tier` - Update user tier
   - `DELETE /api/admin/users/[id]` - Delete user
   - `POST /api/admin/users/[id]/suspend` - Suspend user
5. ✅ Add admin authorization middleware
6. ✅ Create audit logging for admin actions

**Deliverables:**
- Database migration script
- API endpoints tested and working
- Admin action audit log table

### Sprint 2: Admin UI (Week 2)

**Tasks:**
1. ✅ Create `/admin/users` page with user list
2. ✅ Implement pagination (50 users per page)
3. ✅ Add search functionality (by username, email)
4. ✅ Add tier filter dropdown
5. ✅ Create user details modal
6. ✅ Implement tier change functionality
7. ✅ Add user deletion with confirmation
8. ✅ Display user stats (joined date, last active, games played)
9. ✅ Add "Users" link to admin navigation

**Deliverables:**
- Fully functional admin user management interface
- User actions (view, edit tier, delete)
- Activity tracking display

### Sprint 3: Premium Features Foundation (Week 3)

**Tasks:**
1. ✅ Update UserContext to include tier information
2. ✅ Create `useUserTier()` hook
3. ✅ Implement tier-based feature gating
4. ✅ Add premium badge to leaderboards
5. ✅ Enable archive access for premium users
6. ✅ Create "Upgrade to Premium" modal/page
7. ✅ Add tier indicator to user profile

**Deliverables:**
- Tier-aware UI components
- Premium badge display
- Upgrade prompt for free users

### Sprint 4: Payment Integration (Week 4)

**Tasks:**
1. ✅ Set up Stripe account and keys
2. ✅ Create Stripe customer on user signup
3. ✅ Implement checkout flow for subscriptions
4. ✅ Create webhook handlers for Stripe events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. ✅ Add subscription management page (`/account/subscription`)
6. ✅ Implement subscription cancellation
7. ✅ Add grace period for failed payments (7 days)

**Deliverables:**
- Working Stripe integration
- Subscription purchase flow
- Subscription management UI

### Sprint 5: Premium Features Enhancement (Week 5)

**Tasks:**
1. ✅ Ad removal for premium users
2. ✅ Custom theme selector
3. ✅ Streak freeze feature (2 per month)
4. ✅ Advanced stats dashboard
5. ✅ Export game history (CSV/JSON)
6. ✅ Premium-only hints in gameplay

**Deliverables:**
- Full premium feature set
- Enhanced user experience for paying customers

---

## Phase 5: File Structure

```
app/
  admin/
    users/
      page.tsx                 # User management list
      [id]/
        page.tsx              # User detail page
    layout.tsx                # Admin layout (already exists)
    page.tsx                  # Admin dashboard (already exists)

components/
  admin/
    UserList.tsx             # User list table
    UserDetailsModal.tsx     # User details modal
    TierBadge.tsx            # Tier badge component
    DeleteUserModal.tsx      # Delete confirmation modal
    TierChangeModal.tsx      # Tier change modal

lib/
  supabase/
    migrations/
      add_user_tiers.sql     # Database migration
    users.ts                 # User management functions
  hooks/
    useUserTier.ts           # Tier-checking hook
  utils/
    tiers.ts                 # Tier utility functions

app/api/
  admin/
    users/
      route.ts               # GET /api/admin/users (list)
      [id]/
        route.ts             # GET, PATCH, DELETE user
        tier/
          route.ts           # PATCH /api/admin/users/[id]/tier
  stripe/
    webhook/
      route.ts               # Stripe webhook handler
    create-checkout/
      route.ts               # Create Stripe checkout session

types/
  database.ts                # Updated with new user fields
  tiers.ts                   # Tier type definitions
```

---

## Phase 6: Security Considerations

### 6.1 Authorization Checks

**All admin endpoints must:**
1. Verify user is authenticated
2. Check `is_admin` flag in database
3. Log all admin actions to `admin_activity_log` table
4. Return 403 Forbidden for non-admin users

### 6.2 Data Protection

**User deletion:**
- Cascade delete all related data (scores, stats)
- Cannot delete own admin account
- Require confirmation with typing "DELETE"
- Log deletion with timestamp and admin user ID

### 6.3 Audit Logging

**Create `admin_activity_log` table:**

```sql
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_log_admin ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_log_target ON admin_activity_log(target_user_id);
CREATE INDEX idx_admin_log_date ON admin_activity_log(created_at);
```

**Log these actions:**
- User tier changes
- User deletions
- Account suspensions
- Password resets
- Subscription modifications

---

## Phase 7: Testing Plan

### 7.1 Unit Tests
- Tier checking functions
- User management API endpoints
- Authorization middleware
- Stripe webhook handlers

### 7.2 Integration Tests
- Complete user CRUD operations
- Tier change workflow
- Subscription purchase flow
- User deletion with cascade

### 7.3 Manual Testing Checklist

**Admin User Management:**
- [ ] Can view list of all users
- [ ] Search works by username and email
- [ ] Filter by tier works correctly
- [ ] Pagination works (next/prev)
- [ ] Can view user details
- [ ] Can change user tier (Free → Premium → Admin)
- [ ] Tier change is reflected immediately
- [ ] Can delete user with confirmation
- [ ] Deleted user data is removed from all tables
- [ ] Cannot delete own admin account
- [ ] All actions are logged

**Premium Features:**
- [ ] Free users see upgrade prompts
- [ ] Premium users can access archive
- [ ] Premium badge shows on leaderboards
- [ ] Ad-free experience for premium users
- [ ] Subscription page shows correct status
- [ ] Can cancel subscription
- [ ] Grace period works for failed payments

---

## Phase 8: Migration Strategy

### 8.1 Existing Users

**All existing users will:**
1. Default to `user_tier: 'free'`
2. Keep their `is_admin` status if already set
3. Auto-sync tier with admin status:
   - If `is_admin = true`, set `user_tier = 'admin'`
4. Existing subscription status preserved

### 8.2 Migration Script

```sql
-- Sync admin status with user tier
UPDATE users
SET user_tier = 'admin'
WHERE is_admin = true;

-- Set default tier for non-admin users
UPDATE users
SET user_tier = 'free'
WHERE user_tier IS NULL AND is_admin = false;

-- Sync premium tier with active subscriptions
UPDATE users
SET user_tier = 'premium'
WHERE subscription_status = 'active'
  AND user_tier = 'free';
```

---

## Phase 9: Future Enhancements

### Potential Premium Features (Post-MVP)
1. **Team/Family Plans** - Share premium with family members
2. **Custom Difficulty Levels** - Create personal puzzle difficulty
3. **Puzzle Creator** - Premium users can create custom puzzles
4. **Social Features** - Challenge friends, private leaderboards
5. **Achievement Badges** - Unlock special badges for milestones
6. **Dark Mode Themes** - Multiple theme options
7. **Puzzle Hints** - Premium users get extra hints
8. **Historical Stats** - Advanced analytics and trends
9. **Priority Puzzle Testing** - Test new puzzles before release
10. **Exclusive Puzzle Packs** - Monthly premium-only puzzle sets

---

## Phase 10: Success Metrics

### Key Performance Indicators (KPIs)

**User Metrics:**
- Total users (target: 10,000 in 6 months)
- Premium conversion rate (target: 3-5%)
- Monthly recurring revenue (MRR)
- Churn rate (target: <5% per month)
- Average customer lifetime value (LTV)

**Engagement Metrics:**
- Daily active users (DAU)
- Premium user retention (target: >90%)
- Average session duration for premium vs free
- Archive access frequency (premium users)

**Admin Metrics:**
- Average time to resolve user issues
- Number of tier changes per week
- User deletions per month
- Support ticket resolution time

---

## Budget Estimate

### Development Costs (Time)
- Sprint 1: 20-30 hours
- Sprint 2: 25-35 hours
- Sprint 3: 15-20 hours
- Sprint 4: 30-40 hours (Stripe integration)
- Sprint 5: 20-30 hours
- **Total: 110-155 hours**

### Operating Costs (Monthly)
- Stripe fees: 2.9% + $0.30 per transaction
- Supabase Pro: ~$25/month (with growth)
- Domain/hosting: Included in Vercel
- Email service (for notifications): ~$10/month
- **Estimated: $35-50/month base + Stripe fees**

### Break-Even Analysis
- At $4.99/month per premium user
- Need ~10 premium users to cover base costs
- Target: 100 premium users = ~$500/month revenue

---

## Next Steps

### Immediate Actions (Week 1)

1. **Review and approve this plan** ✅
2. **Run database migration** to add user_tier columns
3. **Update TypeScript types** with new fields
4. **Create admin user management page** skeleton
5. **Set up Stripe account** (if not already done)

### Decisions Made ✅

1. **Pricing:** $1/month or $10/year ✅
2. **Feature priority:** Archive access, Ad-free, Premium badge ✅
3. **Payment provider:** Stripe ✅
4. **Refund policy:** None (keep it simple) ✅
5. **Free trial:** None (keep it simple) ✅

---

## Appendix

### A. API Endpoint Reference

**User Management:**
```
GET    /api/admin/users?page=1&limit=50&search=&tier=
GET    /api/admin/users/[id]
PATCH  /api/admin/users/[id]/tier
DELETE /api/admin/users/[id]
POST   /api/admin/users/[id]/suspend
GET    /api/admin/users/[id]/activity
```

**Subscription Management:**
```
POST   /api/stripe/create-checkout
POST   /api/stripe/webhook
GET    /api/stripe/subscription
POST   /api/stripe/cancel-subscription
POST   /api/stripe/update-subscription
```

### B. Database Indexes

```sql
-- Performance indexes for user management
CREATE INDEX idx_users_tier ON users(user_tier);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_last_active ON users(last_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
```

### C. Webhook Events to Handle

**Stripe Webhooks:**
1. `customer.subscription.created` - New subscription started
2. `customer.subscription.updated` - Subscription plan changed
3. `customer.subscription.deleted` - Subscription cancelled
4. `invoice.payment_succeeded` - Payment successful, renew access
5. `invoice.payment_failed` - Payment failed, send reminder
6. `customer.updated` - Customer details changed
7. `checkout.session.completed` - Checkout completed successfully

---

**End of Document**

*This plan is a living document and should be updated as development progresses.*
