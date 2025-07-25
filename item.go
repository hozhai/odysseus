package main

import (
	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

func CommandItem(e *events.ApplicationCommandInteractionCreate) {
	id := e.SlashCommandInteractionData().String("name")
	item := FindByIDCached(id)
	if item == nil || item.Name == "Unknown" {
		err := e.CreateMessage(discord.NewMessageCreateBuilder().SetContent(ItemNotFoundMsg).SetEphemeral(true).Build())
		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	initialSlot := Slot{
		Item:  item.ID,
		Level: MaxLevel,
	}

	messageUpdate := BuildItemEditorResponse(initialSlot, e.User())
	messageCreate := discord.MessageCreate{
		Embeds:     *messageUpdate.Embeds,
		Components: *messageUpdate.Components,
	}

	err := e.CreateMessage(messageCreate)

	if err != nil {
		slog.Error("Error sending item message", slog.Any("err", err))
	}
}
