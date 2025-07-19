CREATE TABLE guilds (
    id BIGINT PRIMARY KEY,
    permission_role_id BIGINT,
    epicenter_role_id BIGINT,
    luck_role_id BIGINT,
    pvp_na_role_id BIGINT,
    pvp_eu_role_id BIGINT,
    pvp_as_role_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )