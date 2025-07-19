CREATE TABLE guilds (
    id BIGINT PRIMARY KEY,
    permission_role_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ping_configs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guild_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    required_role_id BIGINT,
    target_role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE KEY unique_guild_name (guild_id, name),
    FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE
);