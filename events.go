package main

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

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
		slog.Error("error setting playing activity", slog.Any("err", err))
	}
}

func onAutocompleteInteractionCreate(e *events.AutocompleteInteractionCreate) {
	if e.Data.CommandName == "item" {
		for _, option := range e.AutocompleteInteraction.Data.Options {
			if option.Focused {
				var value string

				if err := json.Unmarshal(option.Value, &value); err != nil {
					slog.Error("error unmarshaling option value", slog.Any("err", err))
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
	switch e.Data.CommandName() {
	case "ping":
		CommandPing(e)
	case "about":
		CommandAbout(e)
	case "help":
		CommandHelp(e)
	case "item":
		CommandItem(e)
	case "build":
		CommandBuild(e)
	case "wiki":
		CommandWiki(e)
	}
}

func onComponentInteractionCreate(e *events.ComponentInteractionCreate) {
	switch e.ComponentInteraction.Data.Type() {
	case discord.ComponentTypeButton:
		switch e.ButtonInteractionData().CustomID() {
		case "item_add_enchant":
			var items []discord.StringSelectMenuOption

			for _, v := range ListOfEnchants {
				enchantItem := FindByIDCached(v)

				items = append(items,
					discord.StringSelectMenuOption{
						Label: enchantItem.Name,
						Value: v,
					},
				)
			}

			err := e.UpdateMessage(
				discord.NewMessageUpdateBuilder().
					AddEmbeds(e.Message.Embeds[0]).
					AddActionRow(discord.NewStringSelectMenu("item_set_enchant", "Select an enchant", items...)).
					AddActionRow(discord.NewSuccessButton("Done", "item_done")).
					Build(),
			)

			if err != nil {
				slog.Error("error updating message", slog.Any("err", err))
			}
		case "item_add_modifier":
			var items []discord.StringSelectMenuOption
			item := FindByIDCached(e.Message.Embeds[0].Author.Name)

			for _, name := range item.ValidModifiers {
				var modifierItem Item
				for _, id := range ListOfModifiers {
					itemTarget := FindByIDCached(id)
					if itemTarget.Name == name {
						modifierItem = *itemTarget
					}
				}

				items = append(items, discord.StringSelectMenuOption{
					Label: modifierItem.Name,
					Value: modifierItem.ID,
				})
			}

			err := e.UpdateMessage(
				discord.NewMessageUpdateBuilder().
					AddEmbeds(e.Message.Embeds[0]).
					AddActionRow(discord.NewStringSelectMenu("item_set_modifier", "Select a modifier", items...)).
					AddActionRow(discord.NewSuccessButton("Done", "item_done")).
					Build(),
			)

			if err != nil {
				slog.Error("failed to update message", slog.Any("err", err))
			}
		case "item_add_gem":
			var items []discord.StringSelectMenuOption

			for _, v := range ListOfGems {
				gemItem := FindByIDCached(v)

				items = append(items,
					discord.StringSelectMenuOption{
						Label: gemItem.Name,
						Value: v,
					},
				)
			}

			err := e.UpdateMessage(
				discord.NewMessageUpdateBuilder().
					AddEmbeds(e.Message.Embeds[0]).
					AddActionRow(discord.NewStringSelectMenu("item_set_gem", "Select a gem", items...)).
					AddActionRow(discord.NewSuccessButton("Done", "item_done")).
					Build(),
			)
			if err != nil {
				slog.Error("failed to update message", slog.Any("err", err))
			}
		case "item_done":
			slot := EmbedToSlot(e.Message.Embeds[0])

			var buttons []discord.InteractiveComponent

			if slot.Enchant == EmptyEnchantmentID || slot.Enchant == "" {
				buttons = append(buttons, discord.NewSecondaryButton("Add Enchant", "item_add_enchant"))
			}
			if slot.Modifier == EmptyModifierID || slot.Modifier == "" {
				buttons = append(buttons, discord.NewSecondaryButton("Add Modifier", "item_add_modifier"))
			}
			if len(slot.Gems) == 0 {
				buttons = append(buttons, discord.NewSecondaryButton("Add Gems", "item_add_gem"))
			}

			update := discord.NewMessageUpdateBuilder().
				AddEmbeds(e.Message.Embeds[0])

			if len(buttons) > 0 {
				update.AddActionRow(buttons...)
			} else {
				update.ClearContainerComponents()
			}

			err := e.UpdateMessage(update.Build())

			if err != nil {
				slog.Error("error updating done message", slog.Any("err", err))
			}
		}

	case discord.ComponentTypeStringSelectMenu:
		switch e.StringSelectMenuInteractionData().CustomID() {
		case "item_set_gem":
			slot := EmbedToSlot(e.Message.Embeds[0])
			item := FindByIDCached(slot.Item)

			slot.Gems = append(slot.Gems, e.StringSelectMenuInteractionData().Values[0])

			var total TotalStats
			oldEmbed := e.Message.Embeds[0]

			AddItemStats(slot, &total)

			var fields []discord.EmbedField

			ptrTrue := BoolToPtr(true)

			fields = append(fields, discord.EmbedField{
				Name:  "Description",
				Value: item.Legend,
			}, discord.EmbedField{
				Name:  "Stats",
				Value: FormatTotalStats(total),
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

			if slot.Enchant != EmptyEnchantmentID && slot.Enchant != "" {
				enchantItem := FindByIDCached(slot.Enchant)

				fields = append(fields, discord.EmbedField{
					Name:   "Enchant",
					Value:  EnchantIntoEmoji(enchantItem),
					Inline: ptrTrue,
				})
			}

			if slot.Modifier != EmptyModifierID && slot.Modifier != "" {
				modifierItem := FindByIDCached(slot.Modifier)

				fields = append(fields, discord.EmbedField{
					Name:   "Modifier",
					Value:  ModifierIntoEmoji(modifierItem),
					Inline: ptrTrue,
				})
			}

			var gems strings.Builder

			for _, v := range slot.Gems {
				gems.WriteString(GemIntoEmoji(FindByIDCached(v)))
				gems.WriteString(" ")
			}

			fields = append(fields, discord.EmbedField{
				Name:   "Gems",
				Value:  gems.String(),
				Inline: ptrTrue,
			})

			message := discord.NewMessageUpdateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetAuthor(oldEmbed.Author.Name, "", "").
					SetThumbnail(oldEmbed.Thumbnail.URL).
					SetFields(
						fields...,
					).
					SetTimestamp(*oldEmbed.Timestamp).
					SetFooter(EmbedFooter, "").
					SetColor(oldEmbed.Color).
					Build(),
			)

			if len(slot.Gems) == item.GemNo {
				message.AddActionRow(discord.NewSuccessButton("Done", "item_done"))
			}

			err := e.UpdateMessage(message.Build())

			if err != nil {
				slog.Error("error updating gems message", slog.Any("err", err))
			}

		case "item_set_enchant":
			slot := EmbedToSlot(e.Message.Embeds[0])
			item := FindByIDCached(slot.Item)

			slot.Enchant = e.StringSelectMenuInteractionData().Values[0]

			var total TotalStats

			oldEmbed := e.Message.Embeds[0]

			AddItemStats(slot, &total)

			var fields []discord.EmbedField

			ptrTrue := BoolToPtr(true)

			fields = append(fields, discord.EmbedField{
				Name:  "Description",
				Value: item.Legend,
			}, discord.EmbedField{
				Name:  "Stats",
				Value: FormatTotalStats(total),
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

			enchantItem := FindByIDCached(slot.Enchant)

			fields = append(fields, discord.EmbedField{
				Name:   "Enchant",
				Value:  EnchantIntoEmoji(enchantItem),
				Inline: ptrTrue,
			})

			if slot.Modifier != "" && slot.Modifier != EmptyModifierID {
				modifierItem := FindByIDCached(slot.Modifier)

				fields = append(fields, discord.EmbedField{
					Name:   "Modifier",
					Value:  ModifierIntoEmoji(modifierItem),
					Inline: ptrTrue,
				})
			}

			if len(slot.Gems) > 0 {
				var gems strings.Builder

				for _, v := range slot.Gems {
					gems.WriteString(GemIntoEmoji(FindByIDCached(v)))
					gems.WriteString(" ")
				}

				fields = append(fields, discord.EmbedField{
					Name:   "Gems",
					Value:  gems.String(),
					Inline: ptrTrue,
				})
			}

			message := discord.NewMessageUpdateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetAuthor(oldEmbed.Author.Name, "", "").
					SetThumbnail(oldEmbed.Thumbnail.URL).
					SetFields(
						fields...,
					).
					SetTimestamp(*oldEmbed.Timestamp).
					SetFooter(EmbedFooter, "").
					SetColor(oldEmbed.Color).
					Build(),
			)

			if slot.Enchant != EmptyEnchantmentID {
				message.AddActionRow(discord.NewSuccessButton("Done", "item_done"))
			}

			err := e.UpdateMessage(message.Build())

			if err != nil {
				slog.Error("error updating enchants message", slog.Any("err", err))
			}
		case "item_set_modifier":
			// TODO!!!
		}
	}
}
