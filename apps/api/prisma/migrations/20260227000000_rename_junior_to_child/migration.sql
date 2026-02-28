-- Rename enum value JUNIOR to CHILD in UserRole
-- PostgreSQL 10+ supports ALTER TYPE ... RENAME VALUE
ALTER TYPE "UserRole" RENAME VALUE 'JUNIOR' TO 'CHILD';
