package main

import (
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"log/slog"
)

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
