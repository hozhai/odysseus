use anyhow::Result;
use sqlx::{MySql, Pool, Row};

#[derive(Clone)]
pub struct Database {
    pool: Pool<MySql>,
}

impl Database {
    pub fn new(pool: Pool<MySql>) -> Self {
        Self { pool }
    }

    pub async fn get_ping_config(
        &self,
        guild_id: i64,
        name: &str,
    ) -> Result<Option<PingConfig>> {
        let row = sqlx::query(
            "SELECT id, guild_id, name, description, required_role_id, target_role_id, created_at, updated_at FROM ping_configs WHERE guild_id = ? AND name = ?"
        )
        .bind(guild_id)
        .bind(name)
        .fetch_optional(&self.pool)
        .await?;

        if let Some(row) = row {
            Ok(Some(PingConfig {
                id: row.get("id"),
                guild_id: row.get("guild_id"),
                name: row.get("name"),
                description: row.get("description"),
                required_role_id: row.get("required_role_id"),
                target_role_id: row.get("target_role_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn get_ping_configs(&self, guild_id: i64) -> Result<Vec<PingConfig>> {
        let rows = sqlx::query(
            "SELECT id, guild_id, name, description, required_role_id, target_role_id, created_at, updated_at FROM ping_configs WHERE guild_id = ? ORDER BY name"
        )
        .bind(guild_id)
        .fetch_all(&self.pool)
        .await?;

        let mut configs = Vec::new();
        for row in rows {
            configs.push(PingConfig {
                id: row.get("id"),
                guild_id: row.get("guild_id"),
                name: row.get("name"),
                description: row.get("description"),
                required_role_id: row.get("required_role_id"),
                target_role_id: row.get("target_role_id"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            });
        }

        Ok(configs)
    }

    pub async fn add_ping_config(
        &self,
        guild_id: i64,
        name: &str,
        description: Option<&str>,
        required_role_id: Option<i64>,
        target_role_id: i64,
    ) -> Result<()> {
        sqlx::query(
            "INSERT INTO ping_configs (guild_id, name, description, required_role_id, target_role_id) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(guild_id)
        .bind(name)
        .bind(description)
        .bind(required_role_id)
        .bind(target_role_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn remove_ping_config(&self, guild_id: i64, name: &str) -> Result<bool> {
        let result = sqlx::query(
            "DELETE FROM ping_configs WHERE guild_id = ? AND name = ?"
        )
        .bind(guild_id)
        .bind(name)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn ensure_guild_exists(&self, guild_id: i64) -> Result<()> {
        sqlx::query("INSERT IGNORE INTO guilds (id) VALUES (?)")
            .bind(guild_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct PingConfig {
    pub id: i64,
    pub guild_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub required_role_id: Option<i64>,
    pub target_role_id: i64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}
