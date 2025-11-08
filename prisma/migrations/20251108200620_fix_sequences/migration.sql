-- Fix sequences for all tables that use SERIAL
-- This ensures that sequences are set to the maximum ID value in each table
-- This is necessary after migrating from SQLite to PostgreSQL

-- Fix Comment sequence
SELECT setval('"Comment_id_seq"', COALESCE((SELECT MAX(id) FROM "Comment"), 1), true);

-- Fix Task sequence
SELECT setval('"Task_id_seq"', COALESCE((SELECT MAX(id) FROM "Task"), 1), true);

-- Fix User sequence
SELECT setval('"User_id_seq"', COALESCE((SELECT MAX(id) FROM "User"), 1), true);

-- Fix Project sequence
SELECT setval('"Project_id_seq"', COALESCE((SELECT MAX(id) FROM "Project"), 1), true);

-- Fix Milestone sequence
SELECT setval('"Milestone_id_seq"', COALESCE((SELECT MAX(id) FROM "Milestone"), 1), true);

-- Fix Mention sequence
SELECT setval('"Mention_id_seq"', COALESCE((SELECT MAX(id) FROM "Mention"), 1), true);

-- Fix Notification sequence
SELECT setval('"Notification_id_seq"', COALESCE((SELECT MAX(id) FROM "Notification"), 1), true);

-- Fix Client sequence
SELECT setval('"Client_id_seq"', COALESCE((SELECT MAX(id) FROM "Client"), 1), true);

