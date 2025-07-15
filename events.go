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
		case "item_add_gem":
			var items []discord.StringSelectMenuOption

			for _, v := range ListOfGems {
				item := FindByIDCached(v)

				items = append(items,
					discord.StringSelectMenuOption{
						Label: item.Name,
						Value: v,
						Emoji: &discord.ComponentEmoji{
							Name: item.Name,
						},
					},
				)

				slog.Info(fmt.Sprint(StringToEmoji(GemIntoEmoji(item))))
			}

			err := e.UpdateMessage(
				discord.NewMessageUpdateBuilder().
					AddEmbeds(e.Message.Embeds[0]).
					AddActionRow(discord.NewStringSelectMenu("item_set_gem", "Select a gem...", items...)).
					Build(),
			)
			if err != nil {
				slog.Error("failed to update message", slog.Any("err", err))
			}
		}

	case discord.ComponentTypeStringSelectMenu:
		switch e.StringSelectMenuInteractionData().CustomID() {
		case "item_set_gem":
			// TODO: implement logic to add gem to item build
			err := e.UpdateMessage(
				discord.NewMessageUpdateBuilder().
					SetContent("Gem selection not implemented yet.").
					AddActionRow().
					Build(),
			)
			if err != nil {
				slog.Error("failed to update message", slog.Any("err", err))
			}
		}
	}
}
