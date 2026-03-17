-- Flatten categories: remove hierarchy (parent/children)

-- 1. First, handle duplicate names that would occur when children become root
--    by appending parent name to child category names
UPDATE categories c
SET name = p.name || ' > ' || c.name
FROM categories p
WHERE c.parent_id = p.id
  AND c.parent_id IS NOT NULL;

-- 2. Drop the unique constraint that includes parent_id
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_tenant_id_name_parent_id_key";

-- 3. Handle any remaining name duplicates within same tenant (after flattening)
--    by appending a suffix
UPDATE categories c1
SET name = c1.name || ' (' || c1.id::text || ')'
WHERE EXISTS (
  SELECT 1 FROM categories c2
  WHERE c2.tenant_id = c1.tenant_id
    AND c2.name = c1.name
    AND c2.id < c1.id
);

-- 4. Drop the foreign key constraint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_parent_id_fkey";

-- 5. Drop the parent_id index
DROP INDEX IF EXISTS "categories_parent_id_idx";

-- 6. Drop the parent_id column
ALTER TABLE "categories" DROP COLUMN IF EXISTS "parent_id";

-- 7. Add new unique constraint (tenant_id, name) without parent_id
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_name_key" UNIQUE ("tenant_id", "name");
