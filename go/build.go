package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"log/slog"
)

func CommandBuild(e *events.ApplicationCommandInteractionCreate) {
	urlOption := e.SlashCommandInteractionData().String("url")

	if !strings.HasPrefix(urlOption, BuildURLPrefix) {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent(InvalidURLMsg).Build(),
		)

		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	hash := strings.TrimPrefix(urlOption, "https://tools.arcaneodyssey.net/gearBuilder#")

	player, err := UnhashBuildCode(hash)

	if err != nil {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent(fmt.Sprintf("error parsing build code: %v", err)).Build(),
		)
		if err != nil {
			slog.Error("error sending error message", slog.Any("err", err))
		}
		return
	}

	fields := make([]discord.EmbedField, 0, 8) // Estimate: 3 base + 3 accessories + chestplate + boots
	ptrTrue := BoolToPtr(true)

	var magicfs string
	var builder strings.Builder
	builder.Grow(len(player.Magics)*20 + len(player.FightingStyles)*20)

	for _, v := range player.Magics {
		builder.WriteString(MagicFsIntoEmoji(v))
		builder.WriteString(" ")
	}

	for _, v := range player.FightingStyles {
		builder.WriteString(MagicFsIntoEmoji(v))
		builder.WriteString(" ")
	}

	if builder.Len() == 0 {
		magicfs = "None"
	} else {
		magicfs = builder.String()
	}

	fields = append(fields,
		discord.EmbedField{
			Name:   "Level",
			Value:  fmt.Sprint(player.Level),
			Inline: ptrTrue,
		},
		discord.EmbedField{
			Name:   "Stat Allocation",
			Value:  fmt.Sprintf("🟩 %v 🟦 %v\n🟥 %v 🟨 %v", player.VitalityPoints, player.MagicPoints, player.StrengthPoints, player.WeaponPoints),
			Inline: ptrTrue,
		},
		discord.EmbedField{
			Name:   "Magics/Fighting Styles",
			Value:  magicfs,
			Inline: ptrTrue,
		},
	)

	for _, v := range player.Accessories {
		fields = append(fields, BuildSlotField("Accessory", v, EmptyAccessoryID))
	}

	fields = append(fields, BuildSlotField("Chestplate", player.Chestplate, EmptyChestplateID))
	fields = append(fields, BuildSlotField("Boots", player.Boots, EmptyBootsID))

	totalStats := CalculateTotalStats(player)
	statsString := FormatTotalStats(totalStats)

	fields = append(fields, discord.EmbedField{
		Name:   "Total Stats",
		Value:  statsString,
		Inline: ptrTrue,
	})

	err = e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetAuthor(e.User().Username, "", *e.User().AvatarURL()).
					SetTitle(fmt.Sprintf("%v's Build", e.User().Username)).
					SetFields(fields...).
					SetFooter(EmbedFooter, "").
					SetTimestamp(time.Now()).
					Build(),
			).Build(),
	)

	if err != nil {
		slog.Error("error", slog.Any("err", err))
		return
	}
}
