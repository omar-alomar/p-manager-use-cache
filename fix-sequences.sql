-- Fix sequences for all tables that use SERIAL
-- This ensures that sequences are set to the maximum ID value in each table
-- This is necessary after migrating from SQLite to PostgreSQL
-- Run this directly on your PostgreSQL database

-- Fix Comment sequence (creates sequence if it doesn't exist)
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
END $$;

-- Fix Task sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Task"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Task_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Task".id', seq_name);
        EXECUTE format('ALTER TABLE "Task" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Task";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix User sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"User"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"User_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "User".id', seq_name);
        EXECUTE format('ALTER TABLE "User" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "User";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix Project sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Project"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Project_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Project".id', seq_name);
        EXECUTE format('ALTER TABLE "Project" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Project";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix Milestone sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Milestone"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Milestone_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Milestone".id', seq_name);
        EXECUTE format('ALTER TABLE "Milestone" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Milestone";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix Mention sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Mention"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Mention_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Mention".id', seq_name);
        EXECUTE format('ALTER TABLE "Mention" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Mention";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix Notification sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Notification"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Notification_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Notification".id', seq_name);
        EXECUTE format('ALTER TABLE "Notification" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Notification";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;

-- Fix Client sequence
DO $$
DECLARE
    seq_name TEXT;
    max_id INTEGER;
BEGIN
    seq_name := pg_get_serial_sequence('"Client"', 'id');
    IF seq_name IS NULL THEN
        seq_name := '"Client_id_seq"';
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %s OWNED BY "Client".id', seq_name);
        EXECUTE format('ALTER TABLE "Client" ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
    END IF;
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM "Client";
    IF max_id = 0 THEN
        EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
    ELSE
        EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
    END IF;
END $$;
