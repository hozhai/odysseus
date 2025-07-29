package main

import (
	"context"
	"fmt"
	"log/slog"
	"slices"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
)

func onReady(e *events.Ready) {
	slog.Info(
		fmt.Sprintf(
			"logged in as %s#%s (%s)\n",
			e.User.Username,
			e.User.Discriminator,
			e.Client().ApplicationID(),
		),
	)

	err := e.Client().SetPresence(context.TODO(), gateway.WithPlayingActivity("Arcane Odyssey"))
	if err != nil {
		slog.Error("error setting playing activity", slog.Any("err", err))
	}
}

func onAutocompleteInteractionCreate(e *events.AutocompleteInteractionCreate) {
	data := e.Data

	switch data.CommandName {
	case "item":
		handleItemAutocomplete(e)
	case "ping":
		handlePingAutocomplete(e)
	case "pingset":
		handlePingSetAutocomplete(e)
	}
}

func onApplicationCommandInteractionCreate(e *events.ApplicationCommandInteractionCreate) {
	switch e.Data.CommandName() {
	case "latency":
		CommandLatency(e)
	case "about":
		CommandAbout(e)
	case "help":
		CommandHelp(e)
	case "item":
		CommandItem(e)
	case "build":
		CommandBuild(e)
	case "wiki":
		CommandWiki(e)
	case "ping":
		CommandPing(e)
	case "pingset":
		CommandPingSet(e)
	case "damagecalc":
		CommandDamageCalc(e)
	case "sort":
		CommandSort(e)
	}
}

func onComponentInteractionCreate(e *events.ComponentInteractionCreate) {
	customID := e.ComponentInteraction.Data.CustomID()

	// Handle sort pagination without author check (sort results are public)
	if strings.HasPrefix(customID, "sort_") {
		handleSortPagination(e)
		return
	}

	// For other interactions, check authorization
	authorUsername := strings.Split(e.Message.Embeds[0].Author.Name, " | ")[0]
	if authorUsername != e.User().Username {
		e.CreateMessage(
			discord.NewMessageCreateBuilder().
				SetContent("You cannot modify items displayed by others! Display your own item and change its properties by using </item:1371980876799410238>.").
				SetEphemeral(true).
				Build(),
		)
		return
	}

	switch e.ComponentInteraction.Data.Type() {
	case discord.ComponentTypeButton:
		if slices.Contains([]string{"item_add_enchant", "item_add_gem", "item_add_modifier", "item_done"}, customID) {
			handleItemButtonInteraction(e)
		} else if slices.Contains([]string{"dmgcalc_attacker_raw", "dmgcalc_defender_raw", "dmgcalc_affinity_multipliers", "dmgcalc_additional_multipliers", "dmgcalc_calculate"}, customID) {
			handleDamageCalcButtons(e)
		}
	case discord.ComponentTypeStringSelectMenu:
		handleItemSelectInteraction(e)
	}
}

func onModalSubmitInteractionCreate(e *events.ModalSubmitInteractionCreate) {
	handleDamageCalcModal(e)
}
