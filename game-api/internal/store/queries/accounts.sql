-- name: CreateGuest :one
INSERT INTO accounts (id, is_guest) VALUES ($1, true)
RETURNING *;

-- name: CreateAccount :one
INSERT INTO accounts (id, is_guest, username, username_lower, password_hash, rescue_code_hash)
VALUES ($1, false, $2, $3, $4, $5)
RETURNING *;

-- name: UpgradeGuest :one
UPDATE accounts
SET is_guest = false, username = $2, username_lower = $3, password_hash = $4, rescue_code_hash = $5, updated_at = now()
WHERE id = $1 AND is_guest
RETURNING *;

-- name: GetAccount :one
SELECT * FROM accounts WHERE id = $1;

-- name: GetAccountByUsernameForUpdate :one
SELECT * FROM accounts WHERE username_lower = $1 FOR UPDATE;

-- name: UsernameTaken :one
SELECT EXISTS (SELECT 1 FROM accounts WHERE username_lower = $1);

-- name: SetLoginFailures :exec
UPDATE accounts SET failed_logins = $2, locked_until = $3, updated_at = now() WHERE id = $1;

-- name: UpdateCredentials :exec
UPDATE accounts
SET password_hash = $2, rescue_code_hash = $3, failed_logins = 0, locked_until = NULL, updated_at = now()
WHERE id = $1;

-- name: UpdatePassword :exec
UPDATE accounts SET password_hash = $2, failed_logins = 0, locked_until = NULL, updated_at = now() WHERE id = $1;

-- name: TouchAccount :exec
UPDATE accounts SET last_seen_at = now() WHERE id = $1;

-- name: DeleteAccount :exec
DELETE FROM accounts WHERE id = $1;

-- name: DeleteStaleGuests :execrows
DELETE FROM accounts WHERE is_guest AND last_seen_at < $1;

-- name: CreateSession :exec
INSERT INTO sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3);

-- name: GetSession :one
SELECT s.token_hash, s.expires_at, a.*
FROM sessions s JOIN accounts a ON a.id = s.account_id
WHERE s.token_hash = $1 AND s.expires_at > now();

-- name: ExtendSession :exec
UPDATE sessions SET expires_at = $2 WHERE token_hash = $1;

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token_hash = $1;

-- name: DeleteAccountSessions :exec
DELETE FROM sessions WHERE account_id = $1;

-- name: DeleteExpiredSessions :execrows
DELETE FROM sessions WHERE expires_at < now();
