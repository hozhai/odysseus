package main

import (
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

const (
	EmbedFooter     = "Odysseus - Made with love <3"
	BuildURLPrefix  = "https://tools.arcaneodyssey.net/gearBuilder#"
	InvalidURLMsg   = "Invalid URL! Please provide a valid GearBuilder build URL."
	ItemNotFoundMsg = "Item not found!"
	DefaultColor    = 0x93b1e3
)

func CommandPing(e *events.ApplicationCommandInteractionCreate) {
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
		discord.NewMessageCreateBuilder().AddEmbeds(
			discord.NewEmbedBuilder().
				SetTitle("About Odysseus v0.1.0").
				SetDescription(`
						Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.

						This is a side project by <@360235359746916352> and an excuse to learn Go. Here's the [source code](https://github.com/hozhai/odysseus) of the project.
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
					discord.EmbedField{Name: "/help", Value: "Displays this message :)"},
					discord.EmbedField{Name: "/about", Value: "About Odysseus"},
					discord.EmbedField{Name: "/ping", Value: "Returns the API latency"},
					discord.EmbedField{Name: "/item", Value: "Displays an item along with stats and additional info"},
					discord.EmbedField{Name: "/build", Value: "Loads a build from GearBuilder using the URL"},
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
	item := *FindByIDCached(id)
	ptrTrue := BoolToPtr(true)

	var fields []discord.EmbedField
	var statsString string
	var builder strings.Builder

	if len(item.StatsPerLevel) > 0 {
		lastStats := item.StatsPerLevel[len(item.StatsPerLevel)-1]

		if lastStats.Power != 0 {
			builder.WriteString(fmt.Sprintf("<:power:1392363667059904632> %d\n", lastStats.Power))
		}

		if lastStats.Defense != 0 {
			builder.WriteString(fmt.Sprintf("<:defense:1392364201262977054> %d\n", lastStats.Defense))
		}

		if lastStats.Agility != 0 {
			builder.WriteString(fmt.Sprintf("<:agility:1392364894573297746> %d\n", lastStats.Agility))
		}

		if lastStats.AttackSpeed != 0 {
			builder.WriteString(fmt.Sprintf("<:attackspeed:1392364933722804274> %d\n", lastStats.AttackSpeed))
		}

		if lastStats.AttackSize != 0 {
			builder.WriteString(fmt.Sprintf("<:attacksize:1392364917616807956> %d\n", lastStats.AttackSize))
		}

		if lastStats.Intensity != 0 {
			builder.WriteString(fmt.Sprintf("<:intensity:1392365008049934377> %d\n", lastStats.Intensity))
		}

		if lastStats.Regeneration != 0 {
			builder.WriteString(fmt.Sprintf("<:regeneration:1392365064010469396> %d\n", lastStats.Regeneration))
		}

		if lastStats.Piercing != 0 {
			builder.WriteString(fmt.Sprintf("<:piercing:1392365031705808986> %d\n", lastStats.Piercing))
		}

		if lastStats.Resistance != 0 {
			builder.WriteString(fmt.Sprintf("<:resistance:1393458741009186907> %d\n", lastStats.Resistance))
		}

		if lastStats.Drawback != 0 {
			builder.WriteString(fmt.Sprintf("<:drawback:1392364965905563698> %d\n", lastStats.Drawback))
		}

		if lastStats.Warding != 0 {
			builder.WriteString(fmt.Sprintf("<:warding:1392366478560596039> %d\n", lastStats.Warding))
		}

		statsString = builder.String()
	}

	fields = append(fields, discord.EmbedField{
		Name:  "Description",
		Value: item.Legend,
	}, discord.EmbedField{
		Name:  "Stats",
		Value: statsString,
	}, discord.EmbedField{
		Name:   "Type",
		Value:  item.MainType,
		Inline: ptrTrue,
	})

	if item.SubType != "" {
		fields = append(fields, discord.EmbedField{
			Name:   "Sub Type",
			Value:  item.SubType,
			Inline: ptrTrue,
		})
	}

	if item.Rarity != "" {
		fields = append(fields, discord.EmbedField{
			Name:   "Rarity",
			Value:  item.Rarity,
			Inline: ptrTrue,
		})
	}

	if item.MinLevel != 0 || item.MaxLevel != 0 {
		fields = append(fields, discord.EmbedField{
			Name:   "Level Range",
			Value:  fmt.Sprintf("%d - %d", item.MinLevel, item.MaxLevel),
			Inline: ptrTrue,
		})
	}

	var imageURL string

	// some data has imageID set to "NO_IMAGE" instead of empty string
	if item.ImageID != "" && item.ImageID != "NO_IMAGE" {
		imageURL = item.ImageID
	}

	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().AddEmbeds(
			discord.NewEmbedBuilder().
				SetTitle(fmt.Sprintf("%v (%v)", item.Name, item.ID)).
				SetThumbnail(imageURL).
				SetFields(
					fields...,
				).
				SetFooter(EmbedFooter, "").
				SetTimestamp(time.Now()).
				SetColor(GetRarityColor(item.Rarity)).
				Build(),
		).Build(),
	)

	if err != nil {
		slog.Error("Error sending message", slog.Any("err", err))
	}
}

func CommandBuild(e *events.ApplicationCommandInteractionCreate) {
	url := e.SlashCommandInteractionData().String("url")

	if !strings.HasPrefix(url, "https://tools.arcaneodyssey.net/gearBuilder#") {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent("Invalid URL! Please provide a valid Arcane Odyssey build URL.").Build(),
		)

		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	hash := strings.TrimPrefix(url, "https://tools.arcaneodyssey.net/gearBuilder#")

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
					SetTitle(fmt.Sprintf("%v's Build", e.User().Username)).
					SetFields(fields...).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					Build(),
			).Build(),
	)

	if err != nil {
		slog.Error("error", slog.Any("err", err))
		return
	}

}
