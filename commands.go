// TODO: fix /item with no item.ImageIDs

package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"golang.org/x/net/html"
)

const (
	EmbedFooter     = "Odysseus - Made with love <3"
	BuildURLPrefix  = "https://tools.arcaneodyssey.net/gearBuilder#"
	InvalidURLMsg   = "Invalid URL! Please provide a valid GearBuilder build URL."
	ItemNotFoundMsg = "Item not found!"
	DefaultColor    = 0x93b1e3
)

var cleanDescriptionRegex = regexp.MustCompile(`\s+`)

type WikiSearchResult struct {
	Title       string
	Description string
	URL         string
}

func CommandPing(e *events.ApplicationCommandInteractionCreate) {
	embed := discord.NewEmbedBuilder().
		SetTitlef("Pong! %v", e.Client().Gateway().Latency()).
		SetFooter(EmbedFooter, "").
		SetTimestamp(time.Now()).
		SetColor(DefaultColor).
		Build()

	if err := e.CreateMessage(discord.NewMessageCreateBuilder().AddEmbeds(embed).Build()); err != nil {
		slog.Error("Error sending message", slog.Any("err", err))
	}
}

func CommandAbout(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("About Odysseus v0.1.3").
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

func CommandHelp(e *events.ApplicationCommandInteractionCreate) {
	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().AddEmbeds(
			discord.NewEmbedBuilder().
				SetTitle("Help").
				SetFields(
					discord.EmbedField{Name: "</help:1371529758495608853>", Value: "Displays this message :)"},
					discord.EmbedField{Name: "</about:1366598377147465791>", Value: "Displays an about page where you can also join our Discord!"},
					discord.EmbedField{Name: "</ping:1366258542704594974>", Value: "Returns the API latency"},
					discord.EmbedField{Name: "</item:1371980876799410238>", Value: "Displays an item along with stats and additional info"},
					discord.EmbedField{Name: "</build:1394100657706893453>", Value: "Loads a build from GearBuilder using the URL"},
					discord.EmbedField{Name: "</wiki:1394143370452144129>", Value: "Searches the AO Wiki"},
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

func CommandItem(e *events.ApplicationCommandInteractionCreate) {
	id := e.SlashCommandInteractionData().String("name")
	item := FindByIDCached(id)
	if item == nil || item.Name == "Unknown" {
		e.CreateMessage(discord.NewMessageCreateBuilder().SetContent(ItemNotFoundMsg).SetEphemeral(true).Build())
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

func CommandBuild(e *events.ApplicationCommandInteractionCreate) {
	url := e.SlashCommandInteractionData().String("url")

	if !strings.HasPrefix(url, "https://tools.arcaneodyssey.net/gearBuilder#") {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().SetContent("Invalid URL! Please provide a valid Arcane Odyssey build URL.").Build(),
		)

		if err != nil {
			slog.Error("error sending message", slog.Any("err", err))
		}
		return
	}

	hash := strings.TrimPrefix(url, "https://tools.arcaneodyssey.net/gearBuilder#")

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

func CommandWiki(e *events.ApplicationCommandInteractionCreate) {
	query := e.SlashCommandInteractionData().String("query")

	if err := e.DeferCreateMessage(false); err != nil {
		slog.Error("error deferring message", slog.Any("err", err))
		return
	}

	results, err := searchWiki(query)
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

func searchWiki(query string) ([]WikiSearchResult, error) {
	// encode the query
	encodedQuery := url.QueryEscape(query)
	searchURL := fmt.Sprintf("https://roblox-arcane-odyssey.fandom.com/wiki/Special:Search?scope=internal&navigationSearch=true&query=%s", encodedQuery)

	// make HTTP request
	resp, err := httpClient.Get(searchURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch search results: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("search request failed with status: %d", resp.StatusCode)
	}

	// parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// extract search results
	results := extractSearchResults(doc)
	return results, nil
}

func extractSearchResults(n *html.Node) []WikiSearchResult {
	var results []WikiSearchResult

	// find search results - fandom uses different classes but typically contains "unified-search__result"
	if n.Type == html.ElementNode && n.Data == "li" {
		for _, attr := range n.Attr {
			if attr.Key == "class" && strings.Contains(attr.Val, "unified-search__result") {
				result := parseSearchResult(n)
				if result.Title != "" {
					results = append(results, result)
				}
				break
			}
		}
	}

	// recursively search child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		results = append(results, extractSearchResults(c)...)
	}

	return results
}

func parseSearchResult(n *html.Node) WikiSearchResult {
	var result WikiSearchResult

	// find title link
	titleLink := findElementWithClass(n, "a", "unified-search__result__title")
	if titleLink != nil {
		result.Title = getTextContent(titleLink)
		for _, attr := range titleLink.Attr {
			if attr.Key == "href" {
				if strings.HasPrefix(attr.Val, "/") {
					result.URL = "https://roblox-arcane-odyssey.fandom.com" + attr.Val
				} else {
					result.URL = attr.Val
				}
				break
			}
		}
	}

	// find description
	descElement := findElementWithClass(n, "p", "unified-search__result__snippet")
	if descElement != nil {
		result.Description = getTextContent(descElement)
		// clean up description
		result.Description = strings.TrimSpace(result.Description)
		result.Description = cleanDescriptionRegex.ReplaceAllString(result.Description, " ")
	}

	return result
}

func findElementWithClass(n *html.Node, tagName, className string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tagName {
		for _, attr := range n.Attr {
			if attr.Key == "class" && strings.Contains(attr.Val, className) {
				return n
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if result := findElementWithClass(c, tagName, className); result != nil {
			return result
		}
	}

	return nil
}

func getTextContent(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}

	var result strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		result.WriteString(getTextContent(c))
	}

	return result.String()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
