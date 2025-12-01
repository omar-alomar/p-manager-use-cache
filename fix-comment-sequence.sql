-- Quick fix for Comment sequence only
-- Run this directly in PostgreSQL

DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    -- Try to find the sequence
    seq_name := pg_get_serial_sequence('"Comment"', 'id');
    
    -- If sequence doesn't exist, create it
    IF seq_name IS NULL THEN
        seq_name := '"Comment_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Comment".id', seq_name);
        EXECUTE format('ALTER TABLE "Comment" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    
    -- Get max ID and set sequence
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Comment";
    IF max_id = 0 THEN
        -- Empty table: set sequence to 1, next value will be 1
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        -- Has data: set sequence to max_id, next value will be max_id + 1
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
    
    RAISE NOTICE 'Comment sequence fixed. Max ID: %, Sequence: %', max_id, seq_name;
END $$;

