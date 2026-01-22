-- Simple fix: Just run this one line in Supabase SQL Editor
SELECT setval('User_id_seq', (SELECT MAX(id) FROM "User") + 1);
