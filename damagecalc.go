package main

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

// Helper function to validate and parse integer fields
func validateIntField(components map[string]discord.InteractiveComponent, fieldID, fieldName string) (int, string) {
	if component, exists := components[fieldID]; exists {
		if textInput, ok := component.(discord.TextInputComponent); ok {
			valueStr := strings.TrimSpace(textInput.Value)
			if val, err := strconv.Atoi(valueStr); err != nil || val < 0 {
				return 0, fmt.Sprintf("%s must be a non-negative number", fieldName)
			} else {
				return val, ""
			}
		}
	}
	return 0, fmt.Sprintf("%s field not found", fieldName)
}

// Helper function to validate and parse float fields
func validateFloatField(components map[string]discord.InteractiveComponent, fieldID, fieldName string) (float64, string) {
	if component, exists := components[fieldID]; exists {
		if textInput, ok := component.(discord.TextInputComponent); ok {
			valueStr := strings.TrimSpace(textInput.Value)
			if val, err := strconv.ParseFloat(valueStr, 64); err != nil || val < 0 {
				return 0, fmt.Sprintf("%s must be a non-negative decimal number", fieldName)
			} else {
				return val, ""
			}
		}
	}
	return 0, fmt.Sprintf("%s field not found", fieldName)
}

// Helper function to send validation error message
func sendValidationErrors(e *events.ModalSubmitInteractionCreate, errors []string) {
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
	}
}

// Helper function to update embed with new field
func updateEmbedWithField(e *events.ModalSubmitInteractionCreate, fieldName, fieldValue string) error {
	oldEmbed := e.Message.Embeds[0]
	ptrTrue := BoolToPtr(true)

	return e.UpdateMessage(
		discord.NewMessageUpdateBuilder().
			AddEmbeds(discord.NewEmbedBuilder().
				SetTitle(oldEmbed.Title).
				SetColor(oldEmbed.Color).
				SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
				SetFields(append(oldEmbed.Fields, discord.EmbedField{
					Name:   fieldName,
					Value:  fieldValue,
					Inline: ptrTrue,
				})...).
				Build(),
			).
			Build(),
	)
}

func CommandDamageCalc(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("Damage Calculator").
					SetDescription("Click the button below and fill out the fields to start calculating!").
					SetAuthor(e.User().Username, "", *e.User().AvatarURL()).
					SetColor(DefaultColor).
					SetFooter(EmbedFooter, "").
					Build(),
			).
			AddActionRow(discord.NewSecondaryButton("Attacker Raw Stats", "dmgcalc_attacker_raw")).
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
					discord.NewTextInput("dmgcalc_modal_level", discord.TextInputStyleShort, "Level").WithPlaceholder("140").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_power", discord.TextInputStyleShort, "Power").WithPlaceholder("100").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_vitality", discord.TextInputStyleShort, "Vitality").WithPlaceholder("0").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_ap", discord.TextInputStyleShort, "Armor Piercing").WithPlaceholder("0").WithRequired(true),
				),
			).
			SetCustomID("dmgcalc_modal_attacker_submit").
			Build()

		err := e.Modal(modal)

		if err != nil {
			slog.Error("error showing modal", "error", err)
		}
	case "dmgcalc_defender_raw":
		modal := discord.NewModalCreateBuilder().
			SetTitle("Defender Raw Stats").
			SetContainerComponents(
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_level", discord.TextInputStyleShort, "Level").WithPlaceholder("140").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_defense", discord.TextInputStyleShort, "Defense").WithPlaceholder("800").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_vitality", discord.TextInputStyleShort, "Vitality").WithPlaceholder("0").WithRequired(true),
				),
			).
			SetCustomID("dmgcalc_modal_defender_submit").
			Build()

		err := e.Modal(modal)

		if err != nil {
			slog.Error("error showing modal", "error", err)
		}
	case "dmgcalc_affinity_multipliers":
		modal := discord.NewModalCreateBuilder().
			SetTitle("Affinity Multipliers").
			SetContainerComponents(
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_base_affinity", discord.TextInputStyleShort, "Base Affinity").WithPlaceholder("1.0").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_power_affinity", discord.TextInputStyleShort, "Power Affinity").WithPlaceholder("1.0").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_damage_affinity", discord.TextInputStyleShort, "Damage Affinity").WithPlaceholder("1.0").WithRequired(true),
				),
			).
			SetCustomID("dmgcalc_modal_affinity_submit").
			Build()

		err := e.Modal(modal)

		if err != nil {
			slog.Error("error showing modal", "error", err)
		}
	case "dmgcalc_additional_multipliers":
		modal := discord.NewModalCreateBuilder().
			SetTitle("Additional Multipliers").
			SetContainerComponents(
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_customization", discord.TextInputStyleShort, "[Magic/FS Only] Customization").WithPlaceholder("1.0").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_synergy", discord.TextInputStyleShort, "Synergy").WithPlaceholder("1.0").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_shape", discord.TextInputStyleShort, "[Magic/FS Only] Shape/Embodiment").WithPlaceholder("1.1-0.9").WithRequired(true),
				),
				discord.NewActionRow(
					discord.NewTextInput("dmgcalc_modal_charging", discord.TextInputStyleShort, "Charging").WithPlaceholder("1.0-1.33").WithRequired(true),
				),
			).
			SetCustomID("dmgcalc_modal_additional_submit").
			Build()

		err := e.Modal(modal)

		if err != nil {
			slog.Error("error showing modal", "error", err)
		}
	case "dmgcalc_calculate":
	}
}

func handleDamageCalcModal(e *events.ModalSubmitInteractionCreate) {
	customID := e.Data.CustomID

	switch customID {
	case "dmgcalc_modal_attacker_submit":
		// Parse and validate all fields
		level, levelErr := validateIntField(e.Data.Components, "dmgcalc_modal_level", "Level")
		power, powerErr := validateIntField(e.Data.Components, "dmgcalc_modal_power", "Power")
		vitality, vitalityErr := validateIntField(e.Data.Components, "dmgcalc_modal_vitality", "Vitality")
		armorPiercing, apErr := validateIntField(e.Data.Components, "dmgcalc_modal_ap", "Armor Piercing")

		// Collect all errors
		var errors []string
		for _, err := range []string{levelErr, powerErr, vitalityErr, apErr} {
			if err != "" {
				errors = append(errors, err)
			}
		}

		if len(errors) > 0 {
			sendValidationErrors(e, errors)
			return
		}

		// Update the embed with attacker stats
		oldEmbed := e.Message.Embeds[0]
		ptrTrue := BoolToPtr(true)

		err := e.UpdateMessage(
			discord.NewMessageUpdateBuilder().
				AddEmbeds(discord.NewEmbedBuilder().
					SetTitle(oldEmbed.Title).
					SetColor(oldEmbed.Color).
					SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
					SetFields(discord.EmbedField{
						Name:   "Attacker Raw Stats",
						Value:  fmt.Sprintf("Level: %d\nPower: %d\nVitality: %d\nArmor Piercing: %d", level, power, vitality, armorPiercing),
						Inline: ptrTrue,
					}).
					Build(),
				).
				AddActionRow(discord.NewSecondaryButton("Defender Raw Stats", "dmgcalc_defender_raw")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}

	case "dmgcalc_modal_defender_submit":
		// Parse and validate all fields
		level, levelErr := validateIntField(e.Data.Components, "dmgcalc_modal_level", "Level")
		defense, defenseErr := validateIntField(e.Data.Components, "dmgcalc_modal_defense", "Defense")
		vitality, vitalityErr := validateIntField(e.Data.Components, "dmgcalc_modal_vitality", "Vitality")

		// Collect all errors
		var errors []string
		for _, err := range []string{levelErr, defenseErr, vitalityErr} {
			if err != "" {
				errors = append(errors, err)
			}
		}

		if len(errors) > 0 {
			sendValidationErrors(e, errors)
			return
		}

		// Update the embed with defender stats
		oldEmbed := e.Message.Embeds[0]
		ptrTrue := BoolToPtr(true)

		err := e.UpdateMessage(
			discord.NewMessageUpdateBuilder().
				AddEmbeds(discord.NewEmbedBuilder().
					SetTitle(oldEmbed.Title).
					SetColor(oldEmbed.Color).
					SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
					SetFields(append(oldEmbed.Fields, discord.EmbedField{
						Name:   "Defender Raw Stats",
						Value:  fmt.Sprintf("Level: %d\nDefense: %d\nVitality: %d", level, defense, vitality),
						Inline: ptrTrue,
					})...).
					Build(),
				).
				AddActionRow(discord.NewSecondaryButton("Affinity Multipliers", "dmgcalc_affinity_multipliers")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}

	case "dmgcalc_modal_affinity_submit":
		// Parse and validate all fields
		baseAffinity, baseErr := validateFloatField(e.Data.Components, "dmgcalc_modal_base_affinity", "Base Affinity")
		powerAffinity, powerErr := validateFloatField(e.Data.Components, "dmgcalc_modal_power_affinity", "Power Affinity")
		damageAffinity, damageErr := validateFloatField(e.Data.Components, "dmgcalc_modal_damage_affinity", "Damage Affinity")

		// Collect all errors
		var errors []string
		for _, err := range []string{baseErr, powerErr, damageErr} {
			if err != "" {
				errors = append(errors, err)
			}
		}

		if len(errors) > 0 {
			sendValidationErrors(e, errors)
			return
		}

		// Update the embed with affinity multipliers
		oldEmbed := e.Message.Embeds[0]
		ptrTrue := BoolToPtr(true)

		err := e.UpdateMessage(
			discord.NewMessageUpdateBuilder().
				AddEmbeds(discord.NewEmbedBuilder().
					SetTitle(oldEmbed.Title).
					SetColor(oldEmbed.Color).
					SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
					SetFields(append(oldEmbed.Fields, discord.EmbedField{
						Name:   "Affinity Multipliers",
						Value:  fmt.Sprintf("Base Affinity: %.2f\nPower Affinity: %.2f\nDamage Affinity: %.2f", baseAffinity, powerAffinity, damageAffinity),
						Inline: ptrTrue,
					})...).
					Build(),
				).
				AddActionRow(discord.NewSecondaryButton("Additional Multipliers", "dmgcalc_additional_multipliers")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}

	case "dmgcalc_modal_additional_submit":
		// Parse and validate all fields with correct component IDs
		customization, customErr := validateFloatField(e.Data.Components, "dmgcalc_modal_customization", "Customization")
		synergy, synergyErr := validateFloatField(e.Data.Components, "dmgcalc_modal_synergy", "Synergy")
		shape, shapeErr := validateFloatField(e.Data.Components, "dmgcalc_modal_shape", "Shape/Embodiment")
		charging, chargingErr := validateFloatField(e.Data.Components, "dmgcalc_modal_charging", "Charging")

		// Collect all errors
		var errors []string
		for _, err := range []string{customErr, synergyErr, shapeErr, chargingErr} {
			if err != "" {
				errors = append(errors, err)
			}
		}

		if len(errors) > 0 {
			sendValidationErrors(e, errors)
			return
		}

		// Update the embed with additional multipliers
		oldEmbed := e.Message.Embeds[0]
		ptrTrue := BoolToPtr(true)

		err := e.UpdateMessage(
			discord.NewMessageUpdateBuilder().
				AddEmbeds(discord.NewEmbedBuilder().
					SetTitle(oldEmbed.Title).
					SetColor(oldEmbed.Color).
					SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
					SetFields(append(oldEmbed.Fields, discord.EmbedField{
						Name:   "Additional Multipliers",
						Value:  fmt.Sprintf("Customization: %.2f\nSynergy: %.2f\nShape/Embodiment: %.2f\nCharging: %.2f", customization, synergy, shape, charging),
						Inline: ptrTrue,
					})...).
					Build(),
				).
				AddActionRow(discord.NewSuccessButton("Calculate", "dmgcalc_calculate")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}
	}
}
