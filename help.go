package main

import (
	"time"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

func CommandHelp(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().AddEmbeds(
			discord.NewEmbedBuilder().
				SetTitle("Help").
				SetFields(
					discord.EmbedField{Name: "</help:1371529758495608853>", Value: "Displays this message :)"},
					discord.EmbedField{Name: "</about:1366598377147465791>", Value: "Displays an about page where you can also join our Discord!"},
					discord.EmbedField{Name: "</latency:1396224588349706342>", Value: "Returns the API latency."},
					discord.EmbedField{Name: "</item:1371980876799410238>", Value: "Displays an item along with stats and additional info."},
					discord.EmbedField{Name: "</build:1394100657706893453>", Value: "Loads a build from GearBuilder using the URL."},
					discord.EmbedField{Name: "</wiki:1394143370452144129>", Value: "Searches the AO Wiki."},
					discord.EmbedField{Name: "</sort:0>", Value: "Sort and display items by specific stats with pagination."},
					discord.EmbedField{Name: "</damagecalc:0>", Value: "Calculate your damage given certain stats."},
					discord.EmbedField{Name: "</ping:1366258542704594974>", Value: "Mentions the specified role."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> add", Value: "Adds a role that can be mentioned, requires the `Manage Roles` permission to use."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> list", Value: "Lists the roles that can be mentioned via /ping, requires the `Manage Roles` permission to use."},
					discord.EmbedField{Name: "</pingset:1396224588349706343> remove", Value: "Removes a role that can be mentioned, requires the `Manage Roles` permission to use."},
				).
				SetFooter(EmbedFooter, "").
				SetTimestamp(time.Now()).
				SetColor(DefaultColor).
				Build(),
		).Build(),
	)

	if err != nil {
		slog.Error("error sending message", slog.Any("err", err))
	}
}
