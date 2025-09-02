package main

import (
	"fmt"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"log/slog"
)

func CommandAbout(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle(fmt.Sprintf("About Odysseus %v", Version)).
					SetDescription(`
						Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.

						This is a side project by <@360235359746916352> and an excuse to learn Go. Here's the [source code](https://github.com/hozhai/odysseus) of the project.

						Join our [Discord](https://discord.gg/Z3uKnGHvMN) server for suggestions, bugs, and support!
						`).
					SetImage("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp").
					SetFooter(EmbedFooter, "").
					SetTimestamp(time.Now()).
					SetColor(DefaultColor).
					Build(),
			).Build(),
	)

	if err != nil {
		slog.Error("Error sending message", slog.Any("err", err))
	}
}
