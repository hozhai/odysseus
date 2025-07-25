package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/snowflake/v2"
	"github.com/hozhai/odysseus/db"
	"log/slog"
)

func CommandPing(e *events.ApplicationCommandInteractionCreate) {
	guildID := int64(*e.GuildID())
	pingType := e.SlashCommandInteractionData().String("type")
	message := e.SlashCommandInteractionData().String("message")

	queries := db.New(dbConn)

	// get the ping configuration
	config, err := queries.GetPingConfig(context.Background(), db.GetPingConfigParams{
		GuildID: guildID,
		Name:    pingType,
	})
	if err != nil {
		err := e.CreateMessage(discord.NewMessageCreateBuilder().
			SetContent("Ping configuration not found!").
			SetEphemeral(true).
			Build())
		if err != nil {
			slog.Error("error sending ping not found message", slog.Any("err", err))
		}
		return
	}

	// check if user has required role (if set)
	if config.RequiredRoleID.Valid {
		member := e.Member()
		if member == nil {
			err := e.CreateMessage(discord.NewMessageCreateBuilder().
				SetContent("Could not verify your permissions.").
				SetEphemeral(true).
				Build())
			if err != nil {
				slog.Error("error sending permission error", slog.Any("err", err))
			}
			return
		}

		hasRole := false
		requiredRoleID := snowflake.ID(config.RequiredRoleID.Int64)
		for _, roleID := range member.RoleIDs {
			if roleID == requiredRoleID {
				hasRole = true
				break
			}
		}

		if !hasRole {
			err := e.CreateMessage(discord.NewMessageCreateBuilder().
				SetContent("You don't have permission to use this ping!").
				SetEphemeral(true).
				Build())
			if err != nil {
				slog.Error("error sending no permission message", slog.Any("err", err))
			}
			return
		}
	}

	// Build the ping message
	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("<@%d> has pinged <@&%d>!", e.User().ID, config.TargetRoleID))

	if message != "" {
		builder.WriteString(fmt.Sprintf(" - %s", message))
	}
	err = e.CreateMessage(discord.NewMessageCreateBuilder().
		SetContent(builder.String()).
		Build())
	if err != nil {
		slog.Error("error sending ping message", slog.Any("err", err))
	}
}
