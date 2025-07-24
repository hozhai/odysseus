package main

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/snowflake/v2"
	"github.com/hozhai/odysseus/db"
)

const (
	EmbedFooter     = "Odysseus - Made with love <3"
	BuildURLPrefix  = "https://tools.arcaneodyssey.net/gearBuilder#"
	InvalidURLMsg   = "Invalid URL! Please provide a valid GearBuilder build URL."
	ItemNotFoundMsg = "Item not found!"
	DefaultColor    = 0x93b1e3
	Version         = "v0.2.1"
)

var cleanDescriptionRegex = regexp.MustCompile(`\s+`)

type WikiSearchResult struct {
	Title       string
	Description string
	URL         string
}

func CommandLatency(e *events.ApplicationCommandInteractionCreate) {
	embed := discord.NewEmbedBuilder().
		SetTitlef("Pong! %v", e.Client().Gateway().Latency()).
		SetFooter(EmbedFooter, "").
		SetTimestamp(time.Now()).
		SetColor(DefaultColor).
		Build()

	if err := e.CreateMessage(discord.NewMessageCreateBuilder().AddEmbeds(embed).Build()); err != nil {
		slog.Error("Error sending message", slog.Any("err", err))
	}
}

func CommandAbout(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle(fmt.Sprintf("About Odysseus %v", Version)).
					SetDescription(`
						Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.

						This is a side project by <@360235359746916352> and an excuse to learn Go. Here's the [source code](https://github.com/hozhai/odysseus) of the project.

						Join our [Discord](https://discord.gg/Z3uKnGHvMN) server for suggestions, bugs, and support!
						`).
					SetImage("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp").
					SetFooter(EmbedFooter, "").
					SetTimestamp(time.Now()).
					SetColor(DefaultColor).
					Build(),
			).Build(),
	)

	if err != nil {
		slog.Error("Error sending message", slog.Any("err", err))
	}

}

func CommandHelp(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().AddEmbeds(
			discord.NewEmbedBuilder().
				SetTitle("Help").
				SetFields(
					discord.EmbedField{Name: "</help:1371529758495608853>", Value: "Displays this message :)"},
					discord.EmbedField{Name: "</about:1366598377147465791>", Value: "Displays an about page where you can also join our Discord!"},
					discord.EmbedField{Name: "</latency:1396224588349706342>", Value: "Returns the API latency."},
					discord.EmbedField{Name: "</item:1371980876799410238>", Value: "Displays an item along with stats and additional info."},
					discord.EmbedField{Name: "</build:1394100657706893453>", Value: "Loads a build from GearBuilder using the URL."},
					discord.EmbedField{Name: "</wiki:1394143370452144129>", Value: "Searches the AO Wiki."},
					discord.EmbedField{Name: "</ping:1366258542704594974>", Value: "Mentions the specified role."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> add", Value: "Adds a role that can be mentioned, requires the `Manage Roles` permission to use."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> list", Value: "Lists the roles that can be mentioned via /ping, requires the `Manage Roles` permission to use."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> remove", Value: "Removes a role that can be mentioned, requires the `Manage Roles` permission to use."},
				).
				SetFooter(EmbedFooter, "").
				SetTimestamp(time.Now()).
				SetColor(DefaultColor).
				Build(),
		).Build(),
	)

	if err != nil {
		slog.Error("error sending message", slog.Any("err", err))
	}

}

func CommandItem(e *events.ApplicationCommandInteractionCreate) {
	id := e.SlashCommandInteractionData().String("name")
	item := FindByIDCached(id)
	if item == nil || item.Name == "Unknown" {
		err := e.CreateMessage(discord.NewMessageCreateBuilder().SetContent(ItemNotFoundMsg).SetEphemeral(true).Build())
		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	initialSlot := Slot{
		Item:  item.ID,
		Level: MaxLevel,
	}

	messageUpdate := BuildItemEditorResponse(initialSlot, e.User())
	messageCreate := discord.MessageCreate{
		Embeds:     *messageUpdate.Embeds,
		Components: *messageUpdate.Components,
	}

	err := e.CreateMessage(messageCreate)

	if err != nil {
		slog.Error("Error sending item message", slog.Any("err", err))
	}
}

func CommandBuild(e *events.ApplicationCommandInteractionCreate) {
	urlOption := e.SlashCommandInteractionData().String("url")

	if !strings.HasPrefix(urlOption, BuildURLPrefix) {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent(InvalidURLMsg).Build(),
		)

		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	hash := strings.TrimPrefix(urlOption, "https://tools.arcaneodyssey.net/gearBuilder#")

	player, err := UnhashBuildCode(hash)

	if err != nil {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent(fmt.Sprintf("error parsing build code: %v", err)).Build(),
		)
		if err != nil {
			slog.Error("error sending error message", slog.Any("err", err))
		}
		return
	}

	fields := make([]discord.EmbedField, 0, 8) // Estimate: 3 base + 3 accessories + chestplate + boots
	ptrTrue := BoolToPtr(true)

	var magicfs string
	var builder strings.Builder
	builder.Grow(len(player.Magics)*20 + len(player.FightingStyles)*20)

	for _, v := range player.Magics {
		builder.WriteString(MagicFsIntoEmoji(v))
		builder.WriteString(" ")
	}

	for _, v := range player.FightingStyles {
		builder.WriteString(MagicFsIntoEmoji(v))
		builder.WriteString(" ")
	}

	if builder.Len() == 0 {
		magicfs = "None"
	} else {
		magicfs = builder.String()
	}

	fields = append(fields,
		discord.EmbedField{
			Name:   "Level",
			Value:  fmt.Sprint(player.Level),
			Inline: ptrTrue,
		},
		discord.EmbedField{
			Name:   "Stat Allocation",
			Value:  fmt.Sprintf("🟩 %v 🟦 %v\n🟥 %v 🟨 %v", player.VitalityPoints, player.MagicPoints, player.StrengthPoints, player.WeaponPoints),
			Inline: ptrTrue,
		},
		discord.EmbedField{
			Name:   "Magics/Fighting Styles",
			Value:  magicfs,
			Inline: ptrTrue,
		},
	)

	for _, v := range player.Accessories {
		fields = append(fields, BuildSlotField("Accessory", v, EmptyAccessoryID))
	}

	fields = append(fields, BuildSlotField("Chestplate", player.Chestplate, EmptyChestplateID))
	fields = append(fields, BuildSlotField("Boots", player.Boots, EmptyBootsID))

	totalStats := CalculateTotalStats(player)
	statsString := FormatTotalStats(totalStats)

	fields = append(fields, discord.EmbedField{
		Name:   "Total Stats",
		Value:  statsString,
		Inline: ptrTrue,
	})

	err = e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetAuthor(e.User().Username, "", *e.User().AvatarURL()).
					SetTitle(fmt.Sprintf("%v's Build", e.User().Username)).
					SetFields(fields...).
					SetFooter(EmbedFooter, "").
					SetTimestamp(time.Now()).
					Build(),
			).Build(),
	)

	if err != nil {
		slog.Error("error", slog.Any("err", err))
		return
	}
}

func CommandWiki(e *events.ApplicationCommandInteractionCreate) {
	query := e.SlashCommandInteractionData().String("query")

	if err := e.DeferCreateMessage(false); err != nil {
		slog.Error("error deferring message", slog.Any("err", err))
		return
	}

	results, err := SearchWiki(query)
	if err != nil {
		if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
			Content: fmt.Sprintf("Error searching wiki: %v", err),
		}); err != nil {
			slog.Error("error updating interaction response", slog.Any("err", err))
		}
		return
	}

	if len(results) == 0 {
		if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
			Content: fmt.Sprintf("No results found for '%s'", query),
		}); err != nil {
			slog.Error("error updating interaction response", slog.Any("err", err))
		}
		return
	}

	// build embed with results
	fields := make([]discord.EmbedField, 0, min(len(results), 5)) // Limit to 5 results
	ptrFalse := BoolToPtr(false)

	for i, result := range results {
		if i >= 5 {
			break
		}

		description := result.Description
		if len(description) > 200 {
			description = description[:200] + "..."
		}

		fields = append(fields, discord.EmbedField{
			Name:   result.Title,
			Value:  fmt.Sprintf("%s\n[Read more](%s)", description, result.URL),
			Inline: ptrFalse,
		})
	}

	embed := discord.NewEmbedBuilder().
		SetTitle(fmt.Sprintf("Wiki Search Results for '%s'", query)).
		SetURL(fmt.Sprintf("https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query=%s", url.QueryEscape(query))).
		SetFields(fields...).
		SetFooter(EmbedFooter, "").
		SetTimestamp(time.Now()).
		SetColor(DefaultColor).
		Build()

	if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
		Embeds: []discord.Embed{embed},
	}); err != nil {
		slog.Error("error updating interaction response", slog.Any("err", err))
	}
}

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

func CommandDamageCalc(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("Damage Calculator").
					SetDescription("Click the buttons below and fill out the fields to start calculating!").
					SetAuthor(e.User().Username, "", *e.User().AvatarURL()).
					SetColor(DefaultColor).
					SetFooter(EmbedFooter, "").
					Build(),
			).
			AddActionRow(discord.NewSecondaryButton("Attacker Raw Stats", "dmgcalc_attacker_raw"), discord.NewSecondaryButton("Defender Raw Stats", "dmgcalc_defender_raw")).
			AddActionRow(discord.NewSecondaryButton("Affinity Multipliers", "dmgcalc_affinity_multipliers"), discord.NewSecondaryButton("Additional Multipliers", "dmgcalc_additional_multipliers")).
			AddActionRow(discord.NewSuccessButton("Calculate", "dmgcalc_calculate")).
			Build(),
	)

	if err != nil {
		slog.Error("error sending damage calculation message", slog.Any("err", err))
	}
}
