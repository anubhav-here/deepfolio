# Deepfolio private workspace

Supabase project: lpreyagvoigdxomfymfn. Route: /private/.

Implemented: magic-link entry, Today/Week/Horizon tasks, daily habit check-ins,
reflections, weekly reviews, finance notes, edit/delete, and owner-only RLS.
The public pages are unchanged. Supabase JS 2.57.4 is vendored in site/private/vendor.
Only the publishable key is shipped. No private records are bundled in the site.

Activation pending:
Owner email confirmed and allowlisted in Supabase on 2026-09-07.
The owner email is kept in the database, not in public source.
3. Configure Supabase Auth Site URL and redirect allowlist for the actual /private/ URL.
4. Verify the owner sign-in flow before calling the system live.

The first email-link request creates an Auth account; RLS denies all private data
until the verified email matches the server-controlled owner allowlist. Other
accounts cannot read or change the allowlist or private entries.

Due dates are in-app only. Telegram, background reminders, financial-data sync,
and automated briefing ingestion are not implemented. Finance is a notes view.
Use America/New_York for day boundaries. Habit history retains checked dates.
