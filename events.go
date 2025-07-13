package main

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/json"
)

func onReady(e *events.Ready) {
	slog.Info(
		fmt.Sprintf(
			"logged in as %s#%s (%s)\n",
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
			slog.Error("error sending message", slog.Any("err", err))
		}
	}

	if e.Data.CommandName() == "item" {
		id := e.SlashCommandInteractionData().String("name")

		item := *FindByIDCached(id)

		ptrTrue := BoolToPtr(true)

		var fields []discord.EmbedField

		var color int

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

	if e.Data.CommandName() == "loadbuild" {
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
			if v.Item == EmptyAccessoryID {
				fields = append(fields, discord.EmbedField{
					Name:   "Accessory",
					Value:  "None",
					Inline: ptrTrue,
				})
				continue
			}

			enchantmentItem := FindByIDCached(v.Enchantment)
			modifierItem := FindByIDCached(v.Modifier)

			var gems string
			for _, v := range v.Gems {
				gems = gems + GemIntoEmoji(FindByIDCached(v))
			}

			fields = append(fields, discord.EmbedField{
				Name: "Accessory",
				Value: fmt.Sprintf(
					"%v\n%v%v\n%v",
					FindByID(v.Item).Name,
					EnchantmentIntoEmoji(enchantmentItem),
					ModifierIntoEmoji(modifierItem),
					gems,
				),
				Inline: ptrTrue,
			})
		}

		if player.Chestplate.Item == "AAB" {
			fields = append(fields, discord.EmbedField{
				Name:   "Chestplate",
				Value:  "None",
				Inline: ptrTrue,
			})
		} else {
			var gems string
			for _, v := range player.Chestplate.Gems {
				gems = gems + GemIntoEmoji(FindByIDCached(v))
			}

			enchantmentItem := FindByIDCached(player.Chestplate.Enchantment)
			modifierItem := FindByIDCached(player.Chestplate.Modifier)

			fields = append(fields, discord.EmbedField{
				Name: "Chestplate",
				Value: fmt.Sprintf(
					"%v\n%v%v\n%v",
					FindByIDCached(player.Chestplate.Item).Name,
					EnchantmentIntoEmoji(enchantmentItem),
					ModifierIntoEmoji(modifierItem),
					gems,
				),
				Inline: ptrTrue,
			})
		}

		if player.Boots.Item == "AAC" {
			fields = append(fields, discord.EmbedField{
				Name:   "Boots",
				Value:  "None",
				Inline: ptrTrue,
			})
		} else {
			var gems string
			for _, v := range player.Boots.Gems {
				gems = gems + GemIntoEmoji(FindByIDCached(v))
			}

			enchantmentItem := FindByIDCached(player.Boots.Enchantment)
			modifierItem := FindByIDCached(player.Boots.Modifier)

			fields = append(fields, discord.EmbedField{
				Name: "Boots",
				Value: fmt.Sprintf(
					"%v\n%v%v\n%v",
					FindByIDCached(player.Boots.Item).Name,
					EnchantmentIntoEmoji(enchantmentItem),
					ModifierIntoEmoji(modifierItem),
					gems,
				),
				Inline: ptrTrue,
			})
		}

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
}
