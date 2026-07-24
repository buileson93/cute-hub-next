-- Bật extensions TRƯỚC khi nạp schema dump.
-- Chạy với role postgres/service_role trên project mới.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
-- supabase_vault: Supabase project mới đã có sẵn.

-- Nâng statement_timeout để tránh timeout DDL kiểu backend cũ.
ALTER ROLE postgres SET statement_timeout = '300s';
ALTER ROLE service_role SET statement_timeout = '120s';
ALTER ROLE authenticated SET statement_timeout = '30s';
ALTER ROLE anon SET statement_timeout = '10s';
