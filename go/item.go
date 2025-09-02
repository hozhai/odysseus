package main

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/json"
)

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

func handleItemButtonInteraction(e *events.ComponentInteractionCreate) {
	customID := e.ButtonInteractionData().CustomID()
	slot := EmbedToSlot(e.Message.Embeds[0])
	item := FindByIDCached(slot.Item)

	var update *discord.MessageUpdateBuilder

	switch customID {
	case "item_add_enchant", "item_add_modifier", "item_add_gem":
		update = discord.NewMessageUpdateBuilder().
			AddEmbeds(e.Message.Embeds[0]).
			ClearContainerComponents()

		switch customID {
		case "item_add_enchant":
			var options []discord.StringSelectMenuOption
			for _, id := range ListOfEnchants {
				enchant := FindByIDCached(id)
				options = append(options, discord.StringSelectMenuOption{Label: enchant.Name, Value: id})
			}
			update.AddActionRow(discord.NewStringSelectMenu("item_set_enchant", "Select an enchant", options...))

		case "item_add_modifier":
			var options []discord.StringSelectMenuOption
			for _, name := range item.ValidModifiers {
				mod := FindByNameCached(name) // assuming FindByName is implemented
				if mod != nil {
					options = append(options, discord.StringSelectMenuOption{Label: mod.Name, Value: mod.ID})
				}
			}
			update.AddActionRow(discord.NewStringSelectMenu("item_set_modifier", "Select a modifier", options...))

		case "item_add_gem":
			var options []discord.StringSelectMenuOption
			for _, id := range ListOfGems {
				gem := FindByIDCached(id)
				options = append(options, discord.StringSelectMenuOption{Label: gem.Name, Value: id})
			}
			for i := 0; i < item.GemNo; i++ {
				placeholder := fmt.Sprintf("Select a gem for slot %d", i+1)
				if i < len(slot.Gems) && slot.Gems[i] != "" {
					placeholder = FindByIDCached(slot.Gems[i]).Name
				}
				update.AddActionRow(discord.NewStringSelectMenu(fmt.Sprintf("item_set_gem_%d", i), placeholder, options...))
			}
		}
		update.AddActionRow(discord.NewSuccessButton("Done", "item_done"))
		e.UpdateMessage(update.Build())

	case "item_done":
		e.UpdateMessage(BuildItemEditorResponse(slot, e.User()))
	}
}

func handleItemSelectInteraction(e *events.ComponentInteractionCreate) {
	slot := EmbedToSlot(e.Message.Embeds[0])
	customID := e.StringSelectMenuInteractionData().CustomID()
	selectedValue := e.StringSelectMenuInteractionData().Values[0]

	switch {
	case customID == "item_set_enchant":
		slot.Enchant = selectedValue
	case customID == "item_set_modifier":
		slot.Modifier = selectedValue
	case strings.HasPrefix(customID, "item_set_gem_"):
		item := FindByIDCached(slot.Item)
		slotIndex, _ := strconv.Atoi(strings.TrimPrefix(customID, "item_set_gem_"))

		if len(slot.Gems) < item.GemNo {
			newGems := make([]string, item.GemNo)
			copy(newGems, slot.Gems)
			slot.Gems = newGems
		}
		if slotIndex < len(slot.Gems) {
			slot.Gems[slotIndex] = selectedValue
		}
	}

	err := e.UpdateMessage(BuildItemEditorResponse(slot, e.User()))
	if err != nil {
		slog.Error("failed to update message after select", "err", err, "customID", customID)
	}
}

func handleItemAutocomplete(e *events.AutocompleteInteractionCreate) {
	for _, option := range e.AutocompleteInteraction.Data.Options {
		if option.Focused {
			var value string

			if err := json.Unmarshal(option.Value, &value); err != nil {
				slog.Error("error unmarshaling option value", slog.Any("err", err))
				return
			}

			results := make([]discord.AutocompleteChoice, 0, 25)
			for _, item := range ItemsData {

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
		for _, option := range e.AutocompleteInteraction.Data.Options {
			if option.Focused {
				var value string

				if err := json.Unmarshal(option.Value, &value); err != nil {
					slog.Error("error unmarshaling option value", slog.Any("err", err))
					return
				}

				results := make([]discord.AutocompleteChoice, 0, 25)
				for _, item := range ItemsData {

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
