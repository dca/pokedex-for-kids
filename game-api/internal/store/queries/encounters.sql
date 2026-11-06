-- name: CreateEncounter :exec
INSERT INTO encounters (id, child_id, zone, kind, pokemon_id, questions)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: LockEncounter :one
SELECT e.*
FROM encounters e JOIN children c ON c.id = e.child_id
WHERE e.id = $1 AND c.account_id = $2
FOR UPDATE OF e;

-- name: CompleteEncounter :exec
UPDATE encounters SET status = 'completed', stars = $2, result = $3, completed_at = now() WHERE id = $1;

-- name: DeleteStaleEncounters :execrows
DELETE FROM encounters WHERE status = 'open' AND created_at < $1;

-- name: InsertAnswer :execrows
INSERT INTO answers (encounter_id, question_index, item_ids, wrong_count, duration_ms)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT DO NOTHING;

-- name: GetAnswer :one
SELECT * FROM answers WHERE encounter_id = $1 AND question_index = $2;

-- name: ListAnswers :many
SELECT * FROM answers WHERE encounter_id = $1 ORDER BY question_index;
