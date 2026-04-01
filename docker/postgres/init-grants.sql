-- PostgreSQL 15+: o papel PUBLIC deixou de ter CREATE em public.
-- Garante que o usuário da aplicação possa rodar migrations.
GRANT USAGE, CREATE ON SCHEMA public TO grubba_user;
GRANT ALL ON SCHEMA public TO grubba_user;
