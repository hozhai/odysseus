package main

import (
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

func CommandWeapon(e *events.ApplicationCommandInteractionCreate) {
	e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("TODO").
					SetColor(DefaultColor).
					Build(),
			).Build(),
	)
}

func handleWeaponAutocomplete(e *events.AutocompleteInteractionCreate) {

}
