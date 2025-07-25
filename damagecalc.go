package main

import (
	"fmt"
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
			SetTitle("Defender Raw Stats").
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
		// TODO NEXT
	case "dmgcalc_calculate":
	}
}

func handleDamageCalcModal(e *events.ModalSubmitInteractionCreate) {
	customID := e.Data.CustomID
	ptrTrue := BoolToPtr(true)

	switch customID {
	case "dmgcalc_modal_attacker_submit":
		// parse and validate the numeric values
		var level, power, vitality, armorPiercing int
		var errors []string

		// extract and validate level
		if levelComponent, exists := e.Data.Components["dmgcalc_modal_level"]; exists {
			if textInput, ok := levelComponent.(discord.TextInputComponent); ok {
				levelStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(levelStr); err != nil || val < 0 {
					errors = append(errors, "Level must be a non-negative number!")
				} else {
					level = val
				}
			}
		}

		// ditto
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

		// ditto
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

		// ditto
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

		// TODO: prettify the message
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

		oldEmbed := e.Message.Embeds[0]

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
		var level, defense, vitality int
		var errors []string

		// extract and validate level
		if levelComponent, exists := e.Data.Components["dmgcalc_modal_level"]; exists {
			if textInput, ok := levelComponent.(discord.TextInputComponent); ok {
				levelStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(levelStr); err != nil || val < 0 {
					errors = append(errors, "Level must be a non-negative number!")
				} else {
					level = val
				}
			}
		}

		// ditto
		if defenseComponent, exists := e.Data.Components["dmgcalc_modal_defense"]; exists {
			if textInput, ok := defenseComponent.(discord.TextInputComponent); ok {
				powerStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.Atoi(powerStr); err != nil || val < 0 {
					errors = append(errors, "Defense must be a non-negative number")
				} else {
					defense = val
				}
			}
		}

		// ditto
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

		// TODO: prettify the message
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

		oldEmbed := e.Message.Embeds[0]

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
		var baseAffinity, powerAffinity, damageAffinity float64
		var errors []string

		// extract and validate level
		if baseAffinityComponent, exists := e.Data.Components["dmgcalc_modal_base_affinity"]; exists {
			if textInput, ok := baseAffinityComponent.(discord.TextInputComponent); ok {
				levelStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.ParseFloat(levelStr, 64); err != nil || val < 0 {
					errors = append(errors, "Base Affinity must be a non-negative decimal number!")
				} else {
					baseAffinity = val
				}
			}
		}

		// ditto
		if powerAffinityComponent, exists := e.Data.Components["dmgcalc_modal_power_affinity"]; exists {
			if textInput, ok := powerAffinityComponent.(discord.TextInputComponent); ok {
				powerStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.ParseFloat(powerStr, 64); err != nil || val < 0 {
					errors = append(errors, "Power Affinity must be a non-negative decimal number")
				} else {
					powerAffinity = val
				}
			}
		}

		// ditto
		if damageAffinityComponent, exists := e.Data.Components["dmgcalc_modal_damage_affinity"]; exists {
			if textInput, ok := damageAffinityComponent.(discord.TextInputComponent); ok {
				vitalityStr := strings.TrimSpace(textInput.Value)
				if val, err := strconv.ParseFloat(vitalityStr, 64); err != nil || val < 0 {
					errors = append(errors, "Damage Affinity must be a non-negative decimal number")
				} else {
					damageAffinity = val
				}
			}
		}

		// TODO: prettify the message
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

		oldEmbed := e.Message.Embeds[0]

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

	}
}
