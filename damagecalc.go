package main

import (
	"fmt"
	"log/slog"
	"math"
	"strconv"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

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

func updateEmbedWithField(e *events.ModalSubmitInteractionCreate, fieldName, fieldValue string) *discord.MessageUpdateBuilder {
	oldEmbed := e.Message.Embeds[0]
	ptrTrue := BoolToPtr(true)

	return discord.NewMessageUpdateBuilder().
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
			AddActionRow(discord.NewPrimaryButton("Set Attacker Raw Stats", "dmgcalc_attacker_raw")).
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
			).
			SetCustomID("dmgcalc_modal_attacker_submit").
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
		fields := e.Message.Embeds[0].Fields
		var (
			attackerLevel, attackerPower, attackerVitality int
			baseAffinity, powerAffinity, damageAffinity    float64
			customization, synergy, shape, charging        float64
		)

		for _, field := range fields {
			switch field.Name {
			case "Attacker Raw Stats":
				lines := strings.Split(field.Value, "\n")
				for _, line := range lines {
					parts := strings.SplitN(line, ": ", 2)
					if len(parts) != 2 {
						continue
					}
					val := strings.TrimSpace(parts[1])
					switch parts[0] {
					case "Level":
						attackerLevel, _ = strconv.Atoi(val)
					case "Power":
						attackerPower, _ = strconv.Atoi(val)
					case "Vitality":
						attackerVitality, _ = strconv.Atoi(val)
					}
				}
			case "Affinity Multipliers":
				lines := strings.Split(field.Value, "\n")
				for _, line := range lines {
					parts := strings.SplitN(line, ": ", 2)
					if len(parts) != 2 {
						continue
					}
					val := strings.TrimSpace(parts[1])
					switch parts[0] {
					case "Base Affinity":
						baseAffinity, _ = strconv.ParseFloat(val, 64)
					case "Power Affinity":
						powerAffinity, _ = strconv.ParseFloat(val, 64)
					case "Damage Affinity":
						damageAffinity, _ = strconv.ParseFloat(val, 64)
					}
				}
			case "Additional Multipliers":
				lines := strings.Split(field.Value, "\n")
				for _, line := range lines {
					parts := strings.SplitN(line, ": ", 2)
					if len(parts) != 2 {
						continue
					}
					val := strings.TrimSpace(parts[1])
					switch parts[0] {
					case "Customization":
						customization, _ = strconv.ParseFloat(val, 64)
					case "Synergy":
						synergy, _ = strconv.ParseFloat(val, 64)
					case "Shape/Embodiment":
						shape, _ = strconv.ParseFloat(val, 64)
					case "Charging":
						charging, _ = strconv.ParseFloat(val, 64)
					}
				}
			}
		}

		baseAbilityDamage := int(baseAffinity * float64((19 + attackerLevel)))
		powerAbilityDamage := int(powerAffinity * float64(attackerPower))
		preMultiplierDamage := baseAbilityDamage + powerAbilityDamage

		baseHp := 93 + 7*attackerLevel
		maxHp := baseHp + 4*attackerVitality

		damage := math.Sqrt(float64(baseHp)/float64(maxHp)) * damageAffinity * float64(preMultiplierDamage)
		rawSimpleDamage := math.Sqrt(float64(baseHp)/float64(maxHp)) * (damageAffinity * ((float64(19+attackerLevel) * baseAffinity) + (float64(attackerPower) * powerAffinity)))

		totalMultiplier := customization * synergy * shape * charging

		finalDamage := damage * totalMultiplier

		oldEmbed := e.Message.Embeds[0]

		ptrTrue := BoolToPtr(true)

		err := e.UpdateMessage(
			discord.NewMessageUpdateBuilder().
				ClearContainerComponents().
				AddEmbeds(
					discord.NewEmbedBuilder().
						SetAuthor(oldEmbed.Author.Name, "", oldEmbed.Author.IconURL).
						SetFields([]discord.EmbedField{
							{
								Name:   "Base Ability Damage",
								Value:  fmt.Sprintf("%d", baseAbilityDamage),
								Inline: ptrTrue,
							},
							{
								Name:   "Power Ability Damage",
								Value:  fmt.Sprintf("%d", powerAbilityDamage),
								Inline: ptrTrue,
							},
							{
								Name:   "Pre-Multiplier Damage",
								Value:  fmt.Sprintf("%d", preMultiplierDamage),
								Inline: ptrTrue,
							},
							{
								Name:   "Damage",
								Value:  fmt.Sprintf("%.2f", damage),
								Inline: ptrTrue,
							},
							{
								Name:   "Raw Simple Damage",
								Value:  fmt.Sprintf("%.2f", rawSimpleDamage),
								Inline: ptrTrue,
							},
							{
								Name:   "Final Damage",
								Value:  fmt.Sprintf("%.2f", finalDamage),
								Inline: ptrTrue,
							},
						}...).
						SetColor(DefaultColor).
						SetFooter(EmbedFooter, "").
						Build(),
				).
				Build(),
		)

		if err != nil {
			slog.Error("error updating embed", "error", err)
		}
	}
}

func handleDamageCalcModal(e *events.ModalSubmitInteractionCreate) {
	customID := e.Data.CustomID

	switch customID {
	case "dmgcalc_modal_attacker_submit":
		level, levelErr := validateIntField(e.Data.Components, "dmgcalc_modal_level", "Level")
		power, powerErr := validateIntField(e.Data.Components, "dmgcalc_modal_power", "Power")
		vitality, vitalityErr := validateIntField(e.Data.Components, "dmgcalc_modal_vitality", "Vitality")

		var errors []string
		for _, err := range []string{levelErr, powerErr, vitalityErr} {
			if err != "" {
				errors = append(errors, err)
			}
		}

		if len(errors) > 0 {
			sendValidationErrors(e, errors)
			return
		}

		message := updateEmbedWithField(e, "Attacker Raw Stats", fmt.Sprintf("Level: %d\nPower: %d\nVitality: %d", level, power, vitality))

		err := e.UpdateMessage(
			message.
				AddActionRow(discord.NewPrimaryButton("Set Affinity Multipliers", "dmgcalc_affinity_multipliers")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}
	case "dmgcalc_modal_affinity_submit":
		baseAffinity, baseErr := validateFloatField(e.Data.Components, "dmgcalc_modal_base_affinity", "Base Affinity")
		powerAffinity, powerErr := validateFloatField(e.Data.Components, "dmgcalc_modal_power_affinity", "Power Affinity")
		damageAffinity, damageErr := validateFloatField(e.Data.Components, "dmgcalc_modal_damage_affinity", "Damage Affinity")

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

		message := updateEmbedWithField(e, "Affinity Multipliers", fmt.Sprintf("Base Affinity: %.2f\nPower Affinity: %.2f\nDamage Affinity: %.2f", baseAffinity, powerAffinity, damageAffinity))

		err := e.UpdateMessage(
			message.
				AddActionRow(discord.NewPrimaryButton("Set Additional Multipliers", "dmgcalc_additional_multipliers")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}

	case "dmgcalc_modal_additional_submit":
		customization, customErr := validateFloatField(e.Data.Components, "dmgcalc_modal_customization", "Customization")
		synergy, synergyErr := validateFloatField(e.Data.Components, "dmgcalc_modal_synergy", "Synergy")
		shape, shapeErr := validateFloatField(e.Data.Components, "dmgcalc_modal_shape", "Shape/Embodiment")
		charging, chargingErr := validateFloatField(e.Data.Components, "dmgcalc_modal_charging", "Charging")

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

		message := updateEmbedWithField(e, "Additional Multipliers", fmt.Sprintf("Customization: %.2f\nSynergy: %.2f\nShape/Embodiment: %.2f\nCharging: %.2f", customization, synergy, shape, charging))

		err := e.UpdateMessage(
			message.
				AddActionRow(discord.NewSuccessButton("Calculate", "dmgcalc_calculate")).
				Build(),
		)

		if err != nil {
			slog.Error("error updating confirmation message", slog.Any("err", err))
		}
	}
}
