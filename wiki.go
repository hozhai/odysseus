package main

import (
	"fmt"
	"net/url"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"log/slog"
)

func CommandWiki(e *events.ApplicationCommandInteractionCreate) {
	query := e.SlashCommandInteractionData().String("query")

	if err := e.DeferCreateMessage(false); err != nil {
		slog.Error("error deferring message", slog.Any("err", err))
		return
	}

	results, err := SearchWiki(query)
	if err != nil {
		if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
			Content: fmt.Sprintf("Error searching wiki: %v", err),
		}); err != nil {
			slog.Error("error updating interaction response", slog.Any("err", err))
		}
		return
	}

	if len(results) == 0 {
		if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
			Content: fmt.Sprintf("No results found for '%s'", query),
		}); err != nil {
			slog.Error("error updating interaction response", slog.Any("err", err))
		}
		return
	}

	// build embed with results
	fields := make([]discord.EmbedField, 0, min(len(results), 5)) // Limit to 5 results
	ptrFalse := BoolToPtr(false)

	for i, result := range results {
		if i >= 5 {
			break
		}

		description := result.Description
		if len(description) > 200 {
			description = description[:200] + "..."
		}

		fields = append(fields, discord.EmbedField{
			Name:   result.Title,
			Value:  fmt.Sprintf("%s\n[Read more](%s)", description, result.URL),
			Inline: ptrFalse,
		})
	}

	embed := discord.NewEmbedBuilder().
		SetTitle(fmt.Sprintf("Wiki Search Results for '%s'", query)).
		SetURL(fmt.Sprintf("https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query=%s", url.QueryEscape(query))).
		SetFields(fields...).
		SetFooter(EmbedFooter, "").
		SetTimestamp(time.Now()).
		SetColor(DefaultColor).
		Build()

	if _, err := e.Client().Rest().CreateFollowupMessage(e.ApplicationID(), e.Token(), discord.MessageCreate{
		Embeds: []discord.Embed{embed},
	}); err != nil {
		slog.Error("error updating interaction response", slog.Any("err", err))
	}
}
