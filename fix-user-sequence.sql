-- Fix User sequence in Supabase
-- This will set the sequence to be higher than the max existing ID

-- First, check what the current state is:
SELECT 
  (SELECT MAX(id) FROM "User") as max_user_id,
  (SELECT last_value FROM "User_id_seq") as current_sequence_value;

-- Then fix it (run this):
SELECT setval('"User_id_seq"', GREATEST((SELECT MAX(id) FROM "User"), 0) + 1, false);

-- Verify it worked:
SELECT 
  (SELECT MAX(id) FROM "User") as max_user_id,
  (SELECT last_value FROM "User_id_seq") as new_sequence_value,
  (SELECT last_value FROM "User_id_seq") as next_id_will_be;
