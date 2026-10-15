-- One-off data migration: normalize tags saved before server-side normalization
-- (#37), so "Design", " design" and "DESIGN" collapse into one "design" tag.
--
-- Mirrors normalizeTags() in src/features/saves/schemas.ts: trim, lowercase, drop
-- empty tags, and dedupe keeping the first occurrence's position.
--   - Trimming uses an explicit character class matching JavaScript's String#trim
--     (ASCII whitespace, NBSP, BOM, Unicode space separators and line separators),
--     so the result doesn't depend on the database locale.
--   - lower() follows the database's LC_CTYPE; with a UTF-8 locale it matches
--     JavaScript except for rare special cases (Turkish dotted capital I, Greek
--     word-final sigma), which at worst leave a near-duplicate tag.
--
-- Only rows whose tags actually change are updated, and "updatedAt" is not touched
-- (cleanup, not a user edit). Running it again changes nothing.

WITH normalized AS (
  SELECT
    b.id,
    COALESCE(
      (
        SELECT array_agg(d.tag ORDER BY d.first_pos)
        FROM (
          SELECT n.tag, min(t.pos) AS first_pos
          FROM unnest(b.tags) WITH ORDINALITY AS t(raw, pos)
          CROSS JOIN LATERAL (
            SELECT lower(
              regexp_replace(
                t.raw,
                '^[\t\n\v\f\r    -     　﻿]+|[\t\n\v\f\r    -     　﻿]+$',
                '',
                'g'
              )
            ) AS tag
          ) AS n
          WHERE n.tag <> ''
          GROUP BY n.tag
        ) AS d
      ),
      '{}'::text[]
    ) AS tags
  FROM "bookmarks" AS b
)
UPDATE "bookmarks" AS b
SET "tags" = normalized.tags
FROM normalized
WHERE b.id = normalized.id
  AND b."tags" IS DISTINCT FROM normalized.tags;
