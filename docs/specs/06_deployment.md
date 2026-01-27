# Deployment

## Frontend
- Vercel
- PWA enabled
- Microphone + camera permissions

## Backend
- Supabase
- Edge Functions for SKILLs
- RLS enforced for household isolation

## AI
- LLM via API
- Tool-calling enforced
- Creative vs deterministic separation

## Security
- Auth required
- No public access
- Private household scope only

## Needs
- `APP_MODE` (demo | test | real)
- Seeding rules per mode
- Supabase test vs prod separation
