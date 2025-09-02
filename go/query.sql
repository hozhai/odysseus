-- name: GetGuild :one
SELECT * FROM guilds WHERE id = ?;

-- name: CreateGuild :execresult
INSERT INTO guilds (id) VALUES (?);

-- name: GetPingConfigs :many
SELECT * FROM ping_configs WHERE guild_id = ? ORDER BY name;

-- name: GetPingConfig :one
SELECT * FROM ping_configs WHERE guild_id = ? AND name = ?;

-- name: CreatePingConfig :execresult
INSERT INTO ping_configs (guild_id, name, description, required_role_id, target_role_id)
VALUES (?, ?, ?, ?, ?);

-- name: UpdatePingConfig :execresult
UPDATE ping_configs
SET description = ?, required_role_id = ?, target_role_id = ?, updated_at = NOW()
WHERE guild_id = ? AND name = ?;

-- name: DeletePingConfig :execresult
DELETE FROM ping_configs WHERE guild_id = ? AND name = ?;