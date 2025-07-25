package main

import (
	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
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

func handleDamageCalcButtons(e *events.ComponentInteractionCreate) {
	customID := e.Data.CustomID()

	switch customID {
	case "dmgcalc_attacker_raw":
		modal := discord.NewModalCreateBuilder().
			SetTitle("Attacker Raw Stats").
			SetContainerComponents(
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_level", discord.TextInputStyleShort, "Level"),
					discord.NewTextInput("dmgcalc_modal_power", discord.TextInputStyleShort, "Power"),
					discord.NewTextInput("dmgcalc_modal_vitality", discord.TextInputStyleShort, "Vitality"),
					// TODO
				),
			).
			Build()

		e.Modal(modal)
	case "dmgcalc_defender_raw":
	case "dmgcalc_affinity_multipliers":
	case "dmgcalc_additional_multipliers":
	case "dmgcalc_calculate":
	}
}
