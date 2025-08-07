package main

import (
	"fmt"
	"log/slog"
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
)

type SortableItem struct {
	Item  *Item
	Value int
}

const ItemsPerPage = 10

func CommandSort(e *events.ApplicationCommandInteractionCreate) {
	statType := e.SlashCommandInteractionData().String("stat")
	itemType := e.SlashCommandInteractionData().String("type") // optional

	var filteredItems []*Item
	for _, item := range ItemsData {
		if item.Deleted || item.Name == "None" || len(item.StatsPerLevel) == 0 {
			continue
		}

		// apply filters if any
		if itemType != "" && item.MainType != itemType {
			continue
		}

		if hasStatAtLevel140(&item, statType) {
			filteredItems = append(filteredItems, &item)
		}
	}

	if len(filteredItems) == 0 {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().
				SetContent(fmt.Sprintf("No items found with %s stats%s.", statType, getTypeFilter(itemType))).
				SetEphemeral(true).
				Build(),
		)
		if err != nil {
			slog.Error("error sending no items message", slog.Any("err", err))
		}
		return
	}

	// create sortable items with their stat values at level 140
	var sortableItems []SortableItem
	for _, item := range filteredItems {
		value := getStatValueAtLevel140(item, statType)
		if value > 0 {
			sortableItems = append(sortableItems, SortableItem{
				Item:  item,
				Value: value,
			})
		}
	}

	sort.Slice(sortableItems, func(i, j int) bool {
		return sortableItems[i].Value > sortableItems[j].Value
	})

	totalPages := int(math.Ceil(float64(len(sortableItems)) / float64(ItemsPerPage)))
	currentPage := 1

	embed := buildSortEmbed(sortableItems, statType, itemType, currentPage, totalPages)
	components := buildPaginationComponents(currentPage, totalPages, statType, itemType)

	err := e.CreateMessage(
		discord.NewMessageCreateBuilder().
			AddEmbeds(embed).
			AddActionRow(components...).
			Build(),
	)

	if err != nil {
		slog.Error("error sending sort message", slog.Any("err", err))
	}
}

func hasStatAtLevel140(item *Item, statType string) bool {
	for _, stats := range item.StatsPerLevel {
		if stats.Level == 140 {
			switch statType {
			case "power":
				return stats.Power > 0
			case "agility":
				return stats.Agility > 0
			case "attackspeed":
				return stats.AttackSpeed > 0
			case "defense":
				return stats.Defense > 0
			case "attacksize":
				return stats.AttackSize > 0
			case "intensity":
				return stats.Intensity > 0
			case "regeneration":
				return stats.Regeneration > 0
			case "resistance":
				return stats.Resistance > 0
			case "armorpiercing":
				return stats.Piercing > 0
			}
		}
	}
	return false
}

func getStatValueAtLevel140(item *Item, statType string) int {
	for _, stats := range item.StatsPerLevel {
		if stats.Level == 140 {
			switch statType {
			case "power":
				return stats.Power
			case "agility":
				return stats.Agility
			case "attackspeed":
				return stats.AttackSpeed
			case "defense":
				return stats.Defense
			case "attacksize":
				return stats.AttackSize
			case "intensity":
				return stats.Intensity
			case "regeneration":
				return stats.Regeneration
			case "resistance":
				return stats.Resistance
			case "armorpiercing":
				return stats.Piercing

			}
		}
	}
	return 0
}

func getTypeFilter(itemType string) string {
	if itemType != "" {
		return fmt.Sprintf(" for %s items", strings.ToLower(itemType))
	}
	return ""
}

func getStatDisplayName(statType string) string {
	switch statType {
	case "power":
		return "Power"
	case "agility":
		return "Agility"
	case "attackspeed":
		return "Attack Speed"
	case "defense":
		return "Defense"
	case "attacksize":
		return "Attack Size"
	case "intensity":
		return "Intensity"
	case "regeneration":
		return "Regeneration"
	case "resistance":
		return "Resistance"
	case "armorpiercing":
		return "Armor Piercing"

	default:
		// capitalize first letter manually
		if len(statType) > 0 {
			return strings.ToUpper(statType[:1]) + statType[1:]
		}
		return statType
	}
}

func buildSortEmbed(sortableItems []SortableItem, statType, itemType string, currentPage, totalPages int) discord.Embed {
	startIndex := (currentPage - 1) * ItemsPerPage
	endIndex := startIndex + ItemsPerPage
	if endIndex > len(sortableItems) {
		endIndex = len(sortableItems)
	}

	pageItems := sortableItems[startIndex:endIndex]

	var description strings.Builder
	description.WriteString(fmt.Sprintf("Items sorted by %s at level 140%s\n\n", getStatDisplayName(statType), getTypeFilter(itemType)))

	for i, sortableItem := range pageItems {
		rank := startIndex + i + 1
		item := sortableItem.Item

		description.WriteString(fmt.Sprintf("**%d.** %s\n", rank, item.Name))
		description.WriteString(fmt.Sprintf("   %s: **%d** | %s", getStatDisplayName(statType), sortableItem.Value, item.Rarity))

		if item.SubType != "" {
			description.WriteString(fmt.Sprintf(" | %s", item.SubType))
		}

		description.WriteString("\n\n")
	}

	embed := discord.NewEmbedBuilder().
		SetTitle(fmt.Sprintf("Top Items by %s", getStatDisplayName(statType))).
		SetDescription(description.String()).
		SetColor(DefaultColor).
		SetFooter(fmt.Sprintf("Page %d/%d • %s", currentPage, totalPages, EmbedFooter), "").
		SetTimestamp(time.Now())

	return embed.Build()
}

func buildPaginationComponents(currentPage, totalPages int, statType, itemType string) []discord.InteractiveComponent {
	var components []discord.InteractiveComponent

	prevButton := discord.NewSecondaryButton("◀ Prev", fmt.Sprintf("sort_prev_%s_%s_%d", statType, itemType, currentPage))
	if currentPage <= 1 {
		prevButton = prevButton.AsDisabled()
	}
	components = append(components, prevButton)

	pageButton := discord.NewSecondaryButton(fmt.Sprintf("Page %d/%d", currentPage, totalPages), "sort_page_indicator").AsDisabled()
	components = append(components, pageButton)

	nextButton := discord.NewSecondaryButton("Next ▶", fmt.Sprintf("sort_next_%s_%s_%d", statType, itemType, currentPage))
	if currentPage >= totalPages {
		nextButton = nextButton.AsDisabled()
	}
	components = append(components, nextButton)

	return components
}

func handleSortPagination(e *events.ComponentInteractionCreate) {
	customID := e.ButtonInteractionData().CustomID()

	parts := strings.Split(customID, "_")
	if len(parts) < 5 {
		slog.Error("invalid sort pagination custom ID", "customID", customID)
		return
	}

	action := parts[1]   // "prev" or "next"
	statType := parts[2] // stat type
	itemType := parts[3] // item type (may be empty)
	currentPageStr := parts[4]

	currentPage, err := strconv.Atoi(currentPageStr)
	if err != nil {
		slog.Error("error parsing current page", slog.Any("err", err))
		return
	}

	// calculate new page
	var newPage int
	switch action {
	case "prev":
		newPage = currentPage - 1
	case "next":
		newPage = currentPage + 1
	default:
		return
	}

	// regenerate the sorted items (this could be optimized by caching)
	var filteredItems []*Item
	for _, item := range ItemsData {
		if item.Deleted || item.Name == "None" || len(item.StatsPerLevel) == 0 {
			continue
		}

		if itemType != "" && item.MainType != itemType {
			continue
		}

		if hasStatAtLevel140(&item, statType) {
			filteredItems = append(filteredItems, &item)
		}
	}

	var sortableItems []SortableItem
	for _, item := range filteredItems {
		value := getStatValueAtLevel140(item, statType)
		if value > 0 {
			sortableItems = append(sortableItems, SortableItem{
				Item:  item,
				Value: value,
			})
		}
	}

	sort.Slice(sortableItems, func(i, j int) bool {
		return sortableItems[i].Value > sortableItems[j].Value
	})

	totalPages := int(math.Ceil(float64(len(sortableItems)) / float64(ItemsPerPage)))

	// validate new page
	if newPage < 1 {
		newPage = 1
	}
	if newPage > totalPages {
		newPage = totalPages
	}

	// build new embed and components
	embed := buildSortEmbed(sortableItems, statType, itemType, newPage, totalPages)
	components := buildPaginationComponents(newPage, totalPages, statType, itemType)

	err = e.UpdateMessage(
		discord.NewMessageUpdateBuilder().
			AddEmbeds(embed).
			AddActionRow(components...).
			Build(),
	)

	if err != nil {
		slog.Error("error updating sort pagination", slog.Any("err", err))
	}
}
