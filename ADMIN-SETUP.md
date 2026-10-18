# WarisFavSongs admin dashboard setup

This adds `/admin.html` to the existing static playlist. It uses Supabase Auth, Database, and Storage; no service-role key belongs in the browser.

## 1. Create Supabase project and admin login
1. Create a project at https://supabase.com/
2. In **Authentication → Users**, create your admin user with your email and a strong password. Confirm the user if your auth settings require it.
3. Open **Project Settings → API** and copy the Project URL and publishable/anon key. Never use the `service_role` key in `config.js`.

## 2. Set up database and storage
1. Open **SQL Editor** in Supabase.
2. In `supabase-setup.sql`, replace both occurrences of `admin@example.com` with your exact admin email.
3. Run the complete SQL script.

## 3. Configure the site
1. Copy `config.js.example` to a new file named `config.js`.
2. Fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_USERNAME`, and `ADMIN_EMAIL`.
3. `config.js` is ignored by Git to avoid accidentally committing configuration. The publishable/anon key is public by design; database/storage RLS policies are the security boundary.
4. Commit and deploy the files to Vercel. Visit `https://YOUR-DOMAIN/admin.html`.

## 4. Upload songs
Sign in with your configured username and the password for the Supabase Auth user. Add title, artist, album, track number, audio, and artwork. Published songs load from Supabase on the main site's next page load.

## Important
- This dashboard is a static frontend using Supabase Auth; the username is a UI alias mapped to the configured admin email. Supabase authentication and row-level/storage policies enforce access.
- Public audio and artwork URLs can be opened by anyone who has them. Do not upload private files.
- Audio uploads are limited to 50 MB by this starter dashboard. Supabase project plan limits and upload configuration may be lower.
- The main site falls back to the bundled tracks if Supabase is not configured or has no published songs yet. Once at least one online song is published, it displays the online playlist.
- Deleting a database row does not delete the underlying media object from Storage; remove unused objects in Supabase Storage to reclaim space.
- Only upload audio you own or have permission to distribute.
