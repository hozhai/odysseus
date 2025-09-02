package main

import (
	"fmt"
	"log/slog"
	"math"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/json"
)

// scaleStatToSquares converts a stat value to a 1-10 scale represented by square emojis
func scaleStatToSquares(value float64, min float64, max float64, stat string) string {
	normalized := (value - min) / (max - min)

	// scale to 1-10 range
	scaled := math.Round(normalized*9) + 1
	if scaled < 1 {
		scaled = 1
	}
	if scaled > 10 {
		scaled = 10
	}

	var filled string
	switch stat {
	case "damage":
		filled = "🟧"
	case "speed":
		filled = "🟦"
	case "size":
		filled = "🟩"
	default:
		filled = "⬛"
	}

	result := ""
	for i := 1; i <= 10; i++ {
		if i <= int(scaled) {
			result += filled
		}
	}

	return result
}

func getWeaponStatFields(weapon *Weapon) []discord.EmbedField {
	damageMin, damageMax := 0.9, 1.15
	speedMin, speedMax := 0.7, 1.2
	sizeMin, sizeMax := 0.75, 1.3

	return []discord.EmbedField{
		{
			Name:  "Damage",
			Value: fmt.Sprintf("%s %.3fx", scaleStatToSquares(weapon.Damage, damageMin, damageMax, "damage"), weapon.Damage),
		},
		{
			Name:  "Speed",
			Value: fmt.Sprintf("%s %.3fx", scaleStatToSquares(weapon.Speed, speedMin, speedMax, "speed"), weapon.Speed),
		},
		{
			Name:  "Size",
			Value: fmt.Sprintf("%s %.3fx", scaleStatToSquares(weapon.Size, sizeMin, sizeMax, "size"), weapon.Size),
		},
	}
}

func CommandWeapon(e *events.ApplicationCommandInteractionCreate) {
	name := e.SlashCommandInteractionData().String("name")
	weapon := FindWeapon(name)
	if weapon == nil || weapon.Name == "Unknown" {
		err := e.CreateMessage(discord.NewMessageCreateBuilder().SetContent(ItemNotFoundMsg).SetEphemeral(true).Build())
		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	ptrTrue := BoolToPtr(true)

	fields := []discord.EmbedField{
		{
			Name:  "Description",
			Value: weapon.Legend,
		},
		{
			Name:   "Special Effect",
			Value:  weapon.SpecialEffect,
			Inline: ptrTrue,
		},
	}

	if weapon.BlockingPower != 0 && weapon.Durability != 0 {
		shieldFields := []discord.EmbedField{
			{
				Name:   "Blocking Power",
				Value:  fmt.Sprintf("%.2f", weapon.BlockingPower),
				Inline: ptrTrue,
			},
			{
				Name:   "Durability",
				Value:  fmt.Sprintf("%d", weapon.Durability),
				Inline: ptrTrue,
			},
		}

		fields = append(fields, shieldFields...)
	}

	statFields := getWeaponStatFields(weapon)
	fields = append(fields, statFields...)

	messageCreate := discord.NewMessageCreateBuilder().
		AddEmbeds(
			discord.NewEmbedBuilder().
				SetColor(GetRarityColor(weapon.Rarity)).
				SetAuthor(e.User().Username, "", *e.User().AvatarURL()).
				SetTitle(weapon.Name).
				SetThumbnail(weapon.ImageID).
				SetFields(fields...).
				SetTimestamp(time.Now()).
				SetFooter(EmbedFooter, "").
				Build(),
		).
		Build()

	err := e.CreateMessage(messageCreate)

	if err != nil {
		slog.Error("Error sending item message", slog.Any("err", err))
	}

}

func handleWeaponAutocomplete(e *events.AutocompleteInteractionCreate) {
	for _, option := range e.AutocompleteInteraction.Data.Options {
		if option.Focused {
			var value string

			if err := json.Unmarshal(option.Value, &value); err != nil {
				slog.Error("error unmarshaling option value", slog.Any("err", err))
				return
			}

			results := make([]discord.AutocompleteChoice, 0, 25)
			for _, weapon := range WeaponsData {

				if len(results) >= 25 {
					break
				}

				if strings.Contains(strings.ToLower(weapon.Name), strings.ToLower(value)) {
					results = append(results, discord.AutocompleteChoiceString{
						Name:  weapon.Name,
						Value: strings.ToLower(weapon.Name),
					})
				}
			}

			err := e.AutocompleteResult(results)
			if err != nil {
				return
			}
		}
		for _, option := range e.AutocompleteInteraction.Data.Options {
			if option.Focused {
				var value string

				if err := json.Unmarshal(option.Value, &value); err != nil {
					slog.Error("error unmarshaling option value", slog.Any("err", err))
					return
				}

				results := make([]discord.AutocompleteChoice, 0, 25)
				for _, weapon := range WeaponsData {

					if len(results) >= 25 {
						break
					}

					if strings.Contains(strings.ToLower(weapon.Name), strings.ToLower(value)) {
						results = append(results, discord.AutocompleteChoiceString{
							Name:  weapon.Name,
							Value: weapon.Name,
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
