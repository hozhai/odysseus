package main

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
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
	case "latency":
		CommandLatency(e)
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
	case "ping":
		CommandPing(e)
	case "pingset":
		CommandPingSet(e)
	}
}

func onComponentInteractionCreate(e *events.ComponentInteractionCreate) {
	authorUsername := strings.Split(e.Message.Embeds[0].Author.Name, " | ")[0]
	if authorUsername != e.User().Username {
		e.CreateMessage(
			discord.NewMessageCreateBuilder().
				SetContent("You cannot modify items displayed by others! Display your own item and change its properties by using </item:1371980876799410238>.").
				SetEphemeral(true).
				Build(),
		)
		return
	}

	switch e.ComponentInteraction.Data.Type() {
	case discord.ComponentTypeButton:
		handleButtonInteraction(e)
	case discord.ComponentTypeStringSelectMenu:
		handleSelectInteraction(e)
	}
}

func handleSelectInteraction(e *events.ComponentInteractionCreate) {
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

func handleButtonInteraction(e *events.ComponentInteractionCreate) {
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
