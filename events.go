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
