-- Check current state of User sequence
-- Run this in Supabase SQL Editor to see what's wrong

SELECT 
  (SELECT MAX(id) FROM "User") as max_user_id,
  (SELECT last_value FROM "User_id_seq") as sequence_value,
  (SELECT last_value FROM "User_id_seq") - (SELECT MAX(id) FROM "User") as difference;
