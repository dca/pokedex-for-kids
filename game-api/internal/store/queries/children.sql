-- name: CreateChild :one
INSERT INTO children (id, account_id, nickname, avatar, start_stage, unlocked_count)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: ListChildren :many
SELECT * FROM children WHERE account_id = $1 ORDER BY created_at, id;

-- name: CountChildren :one
SELECT count(*) FROM children WHERE account_id = $1;

-- name: GetChild :one
SELECT * FROM children WHERE id = $1 AND account_id = $2;

-- name: LockChild :one
SELECT * FROM children WHERE id = $1 AND account_id = $2 FOR UPDATE;

-- name: UpdateChildProfile :one
UPDATE children
SET nickname = coalesce(sqlc.narg('nickname'), nickname),
    avatar = coalesce(sqlc.narg('avatar'), avatar),
    updated_at = now()
WHERE id = $1 AND account_id = $2
RETURNING *;

-- name: SetPartner :one
UPDATE children SET partner_base_id = $2, updated_at = now()
WHERE id = $1 AND partner_base_id IS NULL
RETURNING *;

-- name: UpdateChildProgress :exec
UPDATE children SET xp = $2, correct_streak = $3, encounter_count = $4, unlocked_count = $5, updated_at = now() WHERE id = $1;

-- name: DeleteChild :execrows
DELETE FROM children WHERE id = $1 AND account_id = $2;

-- name: MoveChildren :exec
UPDATE children SET account_id = $2, updated_at = now() WHERE account_id = $1;

-- name: ListMastery :many
SELECT * FROM mastery WHERE child_id = $1;

-- name: UpsertMastery :exec
INSERT INTO mastery (child_id, item_id, level, due_encounter, due_at, last_seen_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (child_id, item_id) DO UPDATE
SET level = excluded.level, due_encounter = excluded.due_encounter, due_at = excluded.due_at, last_seen_at = excluded.last_seen_at;

-- name: ListCaught :many
SELECT * FROM caught WHERE child_id = $1 ORDER BY pokemon_id;

-- name: UpsertCaught :one
INSERT INTO caught (child_id, pokemon_id, best_stars) VALUES ($1, $2, $3)
ON CONFLICT (child_id, pokemon_id) DO UPDATE SET best_stars = GREATEST(caught.best_stars, excluded.best_stars)
RETURNING (xmax = 0)::boolean AS inserted;

-- name: ListBadges :many
SELECT * FROM badges WHERE child_id = $1 ORDER BY earned_at;

-- name: InsertBadge :execrows
INSERT INTO badges (child_id, zone) VALUES ($1, $2) ON CONFLICT DO NOTHING;
