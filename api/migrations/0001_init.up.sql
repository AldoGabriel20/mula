-- 0001 init: enable extensions the schema relies on. Tables arrive in BE tasks.
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() for UUID primary keys
