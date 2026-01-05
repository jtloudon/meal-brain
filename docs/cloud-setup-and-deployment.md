# Cloud Setup and Deployment

## Overview

This guide walks through deploying MealBrain from local development to production, enabling mobile access for your household.

**Current State**: Local Supabase + Local Next.js dev server
**Target State**: Supabase Cloud + Vercel (accessible from any device)

---

## Deployment Roadmap to Production

### **Phase 1: Supabase Cloud Setup** (Database + Auth)

1. **Create Supabase account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up (free tier supports 2 users easily)
   - Create new project (choose region closest to you)

2. **Push your database schema**
   ```bash
   # Link local project to cloud
   supabase link --project-ref <your-project-id>

   # Push migrations to cloud
   supabase db push
   ```

3. **Get your production credentials**
   - Project Settings → API
   - Copy: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Copy `SERVICE_ROLE_KEY` (for Tools, never expose to client)

4. **Configure auth providers**
   - Authentication → Providers
   - Enable Email (magic link)
   - Set Site URL to your future Vercel domain (update after Vercel setup)

---

### **Phase 2: GitHub Preparation**

1. **Push code to GitHub**
   ```bash
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Create `.env.production` file** (don't commit this)
   ```
   NEXT_PUBLIC_SUPABASE_URL=<from-step-3>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-step-3>
   SUPABASE_SERVICE_ROLE_KEY=<from-step-3>
   ANTHROPIC_API_KEY=<your-claude-key>
   ```

---

### **Phase 3: Vercel Deployment** (Frontend + API Routes)

1. **Create Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (easiest)

2. **Import your repository**
   - New Project → Import from GitHub
   - Select `meal-brain` repository
   - Framework Preset: Next.js (auto-detected)

3. **Configure environment variables**
   - Add all variables from `.env.production`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `ANTHROPIC_API_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get your production URL (e.g., `https://meal-brain.vercel.app`)

---

### **Phase 4: Wire Up Auth**

1. **Update Supabase auth settings**
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://<your-vercel-url>.vercel.app`
   - Redirect URLs: Add `https://<your-vercel-url>.vercel.app/auth/callback`

2. **Test magic link flow**
   - Open production URL on phone
   - Request magic link
   - Check email (should come from Supabase)
   - Click link → should redirect to `/onboarding` or `/planner`

---

### **Phase 5: Mobile Access**

1. **Add to Home Screen** (PWA-ready)
   - **iPhone**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

2. **Bookmark for quick access**
   - Or just save URL: `https://<your-app>.vercel.app`

---

## Gotchas to Watch For

1. **Service Role Key Security**
   - Never expose `SERVICE_ROLE_KEY` in client-side code
   - Only use in API routes (server-side)
   - Your code already does this correctly (`lib/tools/` uses service key)

2. **Auth Callback URL**
   - Must match exactly in Supabase settings
   - Common issue: `http` vs `https` mismatch

3. **Environment Variables**
   - `NEXT_PUBLIC_*` are exposed to browser (safe for anon key + URL)
   - Non-prefixed vars are server-only (safe for service key)

4. **Database Migrations**
   - Always test `supabase db push` on staging first
   - Consider creating a staging Supabase project for testing

---

## Cost Breakdown (Production)

- **Supabase Free Tier**: Up to 500MB database, 50,000 monthly active users (you have 2)
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth/month
- **Claude API**: ~$2-5/month based on usage
- **Total**: **~$2-5/month**

---

## Optional: Staging Environment

Create a staging deploy for testing before production:

1. Create second Supabase project ("meal-brain-staging")
2. Create Vercel preview branch (auto-deploys from `develop` branch)
3. Test migrations/features on staging first

---

## Progress Tracker

- [ ] Phase 1: Supabase Cloud Setup
- [ ] Phase 2: GitHub Preparation
- [ ] Phase 3: Vercel Deployment
- [ ] Phase 4: Wire Up Auth
- [ ] Phase 5: Mobile Access
- [ ] First successful login from phone

---

## Notes & Troubleshooting

(Add notes here as you work through deployment)
