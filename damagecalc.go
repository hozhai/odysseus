package main

import (
	"log/slog"
	"strconv"
	"strings"

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
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_power", discord.TextInputStyleShort, "Power"),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_vitality", discord.TextInputStyleShort, "Vitality"),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_ap", discord.TextInputStyleShort, "Armor Piercing"),
				),
			).
			Build()

		err := e.Modal(modal)

		if err != nil {
			slog.Error("error showing modal", "error", err)
		}
	case "dmgcalc_defender_raw":
	case "dmgcalc_affinity_multipliers":
	case "dmgcalc_additional_multipliers":
	case "dmgcalc_calculate":
	}
}

func handleDamageCalcModal(e *events.ModalSubmitInteractionCreate) {
	customID := e.Data.CustomID

	switch customID {
	case "dmgcalc_attacker_raw":
		// Parse and validate the numeric values
		var level, power, vitality, armorPiercing int
		var errors []string

		// Extract and validate level
		if levelComponent, exists := e.Data.Components["dmgcalc_modal_level"]; exists {
			if textInput, ok := levelComponent.(discord.TextInputComponent); ok {
				levelStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(levelStr); err != nil || val < 1 || val > 200 {
					errors = append(errors, "Level must be a number between 1 and 200")
				} else {
					level = val
				}
			}
		}

		// Extract and validate power
		if powerComponent, exists := e.Data.Components["dmgcalc_modal_power"]; exists {
			if textInput, ok := powerComponent.(discord.TextInputComponent); ok {
				powerStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(powerStr); err != nil || val < 0 {
					errors = append(errors, "Power must be a non-negative number")
				} else {
					power = val
				}
			}
		}

		// Extract and validate vitality
		if vitalityComponent, exists := e.Data.Components["dmgcalc_modal_vitality"]; exists {
			if textInput, ok := vitalityComponent.(discord.TextInputComponent); ok {
				vitalityStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(vitalityStr); err != nil || val < 0 {
					errors = append(errors, "Vitality must be a non-negative number")
				} else {
					vitality = val
				}
			}
		}

		// Extract and validate armor piercing
		if apComponent, exists := e.Data.Components["dmgcalc_modal_ap"]; exists {
			if textInput, ok := apComponent.(discord.TextInputComponent); ok {
				apStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(apStr); err != nil || val < 0 {
					errors = append(errors, "Armor Piercing must be a non-negative number")
				} else {
					armorPiercing = val
				}
			}
		}

		// If there are validation errors, show them to the user
		if len(errors) > 0 {
			err := e.CreateMessage(
				discord.NewMessageCreateBuilder().
					SetContent("❌ **Validation Errors:**\n• " + strings.Join(errors, "\n• ")).
					SetEphemeral(true).
					Build(),
			)
			if err != nil {
				slog.Error("error sending validation error message", slog.Any("err", err))
			}
			return
		}

		// If all validations pass, confirm the values
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().
				SetContent("✅ **Attacker Raw Stats Saved:**\n" +
					"• Level: " + strconv.Itoa(level) + "\n" +
					"• Power: " + strconv.Itoa(power) + "\n" +
					"• Vitality: " + strconv.Itoa(vitality) + "\n" +
					"• Armor Piercing: " + strconv.Itoa(armorPiercing)).
				SetEphemeral(true).
				Build(),
		)
		if err != nil {
			slog.Error("error sending confirmation message", slog.Any("err", err))
		}

		// TODO: Store these values for damage calculation
	}
}
