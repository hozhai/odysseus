package main

import (
	"context"
	"fmt"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/json"
	"log/slog"
	"strings"
	"time"
)

func onReady(e *events.Ready) {
	slog.Info(
		fmt.Sprintf(
			"Logged in as %s#%s (%s)\n",
			e.User.Username,
			e.User.Discriminator,
			e.Client().ApplicationID(),
		),
	)

	err := e.Client().SetPresence(context.TODO(), gateway.WithPlayingActivity("Arcane Odyssey"))
	if err != nil {
		slog.Error("Error setting playing activity", slog.Any("err", err))
	}
}

func onAutocompleteInteractionCreate(e *events.AutocompleteInteractionCreate) {
	if e.Data.CommandName == "item" {
		for _, option := range e.AutocompleteInteraction.Data.Options {
			if option.Focused {
				var value string

				if err := json.Unmarshal(option.Value, &value); err != nil {
					slog.Error("Error unmarshaling option value", slog.Any("err", err))
					return
				}

				results := make([]discord.AutocompleteChoice, 0, 25)
				for _, item := range APIData {

					if len(results) >= 25 {
						break
					}

					if strings.Contains(strings.ToLower(item.Name), strings.ToLower(value)) && item.Name != "None" {
						results = append(results, discord.AutocompleteChoiceString{
							Name:  item.Name,
							Value: item.ID,
						})
					}
				}

				err := e.AutocompleteResult(results)
				if err != nil {
					return
				}
			}
		}
	}
}

func onApplicationCommandInteractionCreate(e *events.ApplicationCommandInteractionCreate) {
	if e.Data.CommandName() == "ping" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitlef("Pong! %v", e.Client().Gateway().Latency()).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}

		return
	}

	if e.Data.CommandName() == "about" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("About Odysseus v0.1.0").
					SetDescription(`
						Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.

						This is a side project by <@360235359746916352> and an excuse to learn Go. Here's the [source code](https://github.com/hozhai/odysseus) of the project.
						`).
					SetImage("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp").
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}

	if e.Data.CommandName() == "help" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("Help").
					SetFields(
						discord.EmbedField{Name: "/help", Value: "Displays this message. :)"},
						discord.EmbedField{Name: "/about", Value: "About Odysseus."},
						discord.EmbedField{Name: "/ping", Value: "Returns the API latency."},
						discord.EmbedField{Name: "/item", Value: "Shows an item from Arcane Odyssey."},
					).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}

	if e.Data.CommandName() == "item" {
		id := e.SlashCommandInteractionData().String("name")
		var item Item

		for _, i := range APIData {
			if i.ID == id {
				item = i
				break
			}
		}

		ptrTrue := BoolToPtr(true)

		var fields []discord.EmbedField

		var color int

		var statsString string

		lastStats := item.StatsPerLevel[len(item.StatsPerLevel)-1]

		if lastStats.Power != 0 {
			statsString = statsString + fmt.Sprintf("<:power:1392363667059904632> %d\n", lastStats.Power)
		}

		if lastStats.Defense != 0 {
			statsString = statsString + fmt.Sprintf("<:defense:1392364201262977054> %d\n", lastStats.Defense)
		}

		if lastStats.Agility != 0 {
			statsString = statsString + fmt.Sprintf("<:agility:1392364894573297746> %d\n", lastStats.Agility)
		}

		if lastStats.AttackSpeed != 0 {
			statsString = statsString + fmt.Sprintf("<:attackspeed:1392364933722804274> %d\n", lastStats.AttackSpeed)
		}

		if lastStats.AttackSize != 0 {
			statsString = statsString + fmt.Sprintf("<:attacksize:1392364917616807956> %d\n", lastStats.AttackSize)
		}

		if lastStats.Intensity != 0 {
			statsString = statsString + fmt.Sprintf("<:intensity:1392365008049934377> %d\n", lastStats.Intensity)
		}

		if lastStats.Drawback != 0 {
			statsString = statsString + fmt.Sprintf("<:drawback:1392364965905563698> %d\n", lastStats.Drawback)
		}

		if lastStats.Warding != 0 {
			statsString = statsString + fmt.Sprintf("<:warding:1392366478560596039> %d\n", lastStats.Warding)
		}

		fields = append(fields, discord.EmbedField{
			Name:  "Description",
			Value: item.Legend,
		}, discord.EmbedField{
			Name:  "Stats",
			Value: statsString,
		}, discord.EmbedField{
			Name:   "ID",
			Value:  item.ID,
			Inline: ptrTrue,
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

			switch item.Rarity {
			case "Common":
				color = 0xffffff
			case "Uncommon":
				color = 0x7f734c
			case "Rare":
				color = 0x6765e4
			case "Exotic":
				color = 0xea3323
			}
		}

		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle(item.Name).
					SetThumbnail(item.ImageID).
					SetFields(
						fields...,
					).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(color).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}
}
