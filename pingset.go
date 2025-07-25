package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/hozhai/odysseus/db"
	"log/slog"
)

func CommandPingSet(e *events.ApplicationCommandInteractionCreate) {
	// Check if user has Manage Roles permission
	if !e.Member().Permissions.Has(discord.PermissionManageRoles) && !e.Member().Permissions.Has(discord.PermissionAdministrator) {
		err := e.CreateMessage(discord.NewMessageCreateBuilder().
			SetContent("You need the 'Manage Roles' permission to use this command!").
			SetEphemeral(true).
			Build())
		if err != nil {
			slog.Error("error sending permission error", slog.Any("err", err))
		}
		return
	}

	subcommand := e.SlashCommandInteractionData().SubCommandName
	guildID := int64(*e.GuildID())
	queries := db.New(dbConn)

	switch *subcommand {
	case "add":
		name := e.SlashCommandInteractionData().String("name")
		targetRole := e.SlashCommandInteractionData().Snowflake("target")
		requiredRole, requiredRoleOk := e.SlashCommandInteractionData().OptSnowflake("required")
		description, descriptionOk := e.SlashCommandInteractionData().OptString("description")

		// ensure guild exists in database
		_, err := queries.GetGuild(context.Background(), guildID)
		if err != nil {
			// create guild if it doesn't exist
			_, err = queries.CreateGuild(context.Background(), guildID)
			if err != nil {
				slog.Error("error creating guild", slog.Any("err", err))
				err := e.CreateMessage(discord.NewMessageCreateBuilder().
					SetContent("Database error occurred.").
					SetEphemeral(true).
					Build())
				if err != nil {
					slog.Error("error sending error message", slog.Any("err", err))
				}
				return
			}
		}

		params := db.CreatePingConfigParams{
			GuildID:      guildID,
			Name:         name,
			TargetRoleID: int64(targetRole),
		}

		if requiredRoleOk {
			params.RequiredRoleID = sql.NullInt64{Int64: int64(requiredRole), Valid: true}
		}

		if descriptionOk {
			params.Description = sql.NullString{String: description, Valid: true}
		}

		_, err = queries.CreatePingConfig(context.Background(), params)
		if err != nil {
			if strings.Contains(err.Error(), "Duplicate entry") {
				err := e.CreateMessage(discord.NewMessageCreateBuilder().
					SetContent(fmt.Sprintf("A ping configuration named '%s' already exists!", name)).
					SetEphemeral(true).
					Build())
				if err != nil {
					slog.Error("error sending duplicate error", slog.Any("err", err))
				}
				return
			}

			slog.Error("error creating ping config", slog.Any("err", err))
			err := e.CreateMessage(discord.NewMessageCreateBuilder().
				SetContent("Failed to create ping configuration.").
				SetEphemeral(true).
				Build())
			if err != nil {
				slog.Error("error sending error message", slog.Any("err", err))
			}
			return
		}

		err = e.CreateMessage(discord.NewMessageCreateBuilder().
			SetContent(fmt.Sprintf("Successfully created ping configuration '%s'!", name)).
			SetEphemeral(true).
			Build())
		if err != nil {
			slog.Error("error sending success message", slog.Any("err", err))
		}

	case "remove":
		name := e.SlashCommandInteractionData().String("name")

		_, err := queries.DeletePingConfig(context.Background(), db.DeletePingConfigParams{
			GuildID: guildID,
			Name:    name,
		})
		if err != nil {
			err := e.CreateMessage(discord.NewMessageCreateBuilder().
				SetContent(fmt.Sprintf("Ping configuration '%s' not found!", name)).
				SetEphemeral(true).
				Build())
			if err != nil {
				slog.Error("error sending not found error", slog.Any("err", err))
			}
			return
		}

		err = e.CreateMessage(discord.NewMessageCreateBuilder().
			SetContent(fmt.Sprintf("Successfully removed ping configuration '%s'!", name)).
			SetEphemeral(true).
			Build())
		if err != nil {
			slog.Error("error sending success message", slog.Any("err", err))
		}

	case "list":
		configs, err := queries.GetPingConfigs(context.Background(), guildID)
		if err != nil || len(configs) == 0 {
			err := e.CreateMessage(discord.NewMessageCreateBuilder().
				SetContent("No ping configurations found for this server.").
				SetEphemeral(true).
				Build())
			if err != nil {
				slog.Error("error sending no configs message", slog.Any("err", err))
			}
			return
		}

		fields := make([]discord.EmbedField, 0, len(configs))
		for _, config := range configs {
			value := fmt.Sprintf("Target: <@&%d>", config.TargetRoleID)
			if config.RequiredRoleID.Valid {
				value += fmt.Sprintf("\nRequired: <@&%d>", config.RequiredRoleID.Int64)
			}
			if config.Description.Valid {
				value += fmt.Sprintf("\nDescription: %s", config.Description.String)
			}

			fields = append(fields, discord.EmbedField{
				Name:   config.Name,
				Value:  value,
				Inline: BoolToPtr(true),
			})
		}

		embed := discord.NewEmbedBuilder().
			SetTitle("Ping Configurations").
			SetFields(fields...).
			SetColor(DefaultColor).
			SetFooter(EmbedFooter, "").
			SetTimestamp(time.Now()).
			Build()

		err = e.CreateMessage(discord.NewMessageCreateBuilder().
			AddEmbeds(embed).
			SetEphemeral(true).
			Build())
		if err != nil {
			slog.Error("error sending list message", slog.Any("err", err))
		}
	}
}
