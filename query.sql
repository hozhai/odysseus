-- name: GetGuild :one
SELECT * FROM guilds WHERE id = ?;

-- name: CreateGuild :execresult
INSERT INTO guilds (id, epicenter_role_id, luck_role_id, pvp_na_role_id, pvp_eu_role_id, pvp_as_role_id)
VALUES (?, ?, ?, ?, ?, ?);

-- name: UpdatePermissionRole :execresult
UPDATE guilds 
SET permission_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpdateEpicenterRole :execresult
UPDATE guilds 
SET epicenter_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpdateLuckRole :execresult
UPDATE guilds 
SET luck_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpdatePvpNaRole :execresult
UPDATE guilds 
SET pvp_na_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpdatePvpEuRole :execresult
UPDATE guilds 
SET pvp_eu_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpdatePvpAsRole :execresult
UPDATE guilds 
SET pvp_as_role_id = ?, updated_at = NOW()
WHERE id = ?;

-- name: UpsertGuild :execresult
INSERT INTO guilds (id, epicenter_role_id, luck_role_id, pvp_na_role_id, pvp_eu_role_id, pvp_as_role_id)
VALUES (?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE 
    epicenter_role_id = COALESCE(VALUES(epicenter_role_id), epicenter_role_id),
    luck_role_id = COALESCE(VALUES(luck_role_id), luck_role_id),
    pvp_na_role_id = COALESCE(VALUES(pvp_na_role_id), pvp_na_role_id),
    pvp_eu_role_id = COALESCE(VALUES(pvp_eu_role_id), pvp_eu_role_id),
    pvp_as_role_id = COALESCE(VALUES(pvp_as_role_id), pvp_as_role_id),
    updated_at = NOW();

-- name: RemoveEpicenterRole :execresult
UPDATE guilds 
SET epicenter_role_id = NULL, updated_at = NOW()
WHERE id = ?;

-- name: RemoveLuckRole :execresult
UPDATE guilds 
SET luck_role_id = NULL, updated_at = NOW()
WHERE id = ?;

-- name: RemovePvpNaRole :execresult
UPDATE guilds 
SET pvp_na_role_id = NULL, updated_at = NOW()
WHERE id = ?;

-- name: RemovePvpEuRole :execresult
UPDATE guilds 
SET pvp_eu_role_id = NULL, updated_at = NOW()
WHERE id = ?;

-- name: RemovePvpAsRole :execresult
UPDATE guilds 
SET pvp_as_role_id = NULL, updated_at = NOW()
WHERE id = ?;