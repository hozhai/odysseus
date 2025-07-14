package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/gateway"
)

type APIResponse []Item

var (
	commands = []discord.ApplicationCommandCreate{
		discord.SlashCommandCreate{
			Name:        "help",
			Description: "Displays the help menu.",
		},
		discord.SlashCommandCreate{
			Name:        "ping",
			Description: "Returns the API latency.",
		},
		discord.SlashCommandCreate{
			Name:        "about",
			Description: "About Odysseus.",
		},
		discord.SlashCommandCreate{
			Name:        "wiki",
			Description: "Searches the wiki",
			Options: []discord.ApplicationCommandOption{
				discord.ApplicationCommandOptionString{
					Name:        "query",
					Description: "What to search for on the wiki",
					Required:    true,
				},
			},
		},
		discord.SlashCommandCreate{
			Name:        "build",
			Description: "Loads a GearBuilder build from URL.",
			Options: []discord.ApplicationCommandOption{
				discord.ApplicationCommandOptionString{
					Name:        "url",
					Description: "URL of the build.",
					Required:    true,
				},
			},
		},
		discord.SlashCommandCreate{
			Name:        "item",
			Description: "Get information about an item.",
			Options: []discord.ApplicationCommandOption{
				discord.ApplicationCommandOptionString{
					Name:         "name",
					Description:  "Name of the item.",
					Required:     true,
					Autocomplete: true,
				},
			},
		},
	}
	APIData APIResponse
)

func main() {
	token := flag.String("token", "", "the bot token")
	flag.Parse()

	if *token == "" {
		slog.Error("you need to specify a token! ./odysseus --token TOKEN-HERE")
		return
	}

	client, err := disgo.New(*token,
		bot.WithGatewayConfigOpts(
			gateway.WithIntents(
				gateway.IntentGuilds,
				gateway.IntentGuildMessages,
				gateway.IntentDirectMessages,
			),
		),

		bot.WithEventListenerFunc(onReady),
		bot.WithEventListenerFunc(onApplicationCommandInteractionCreate),
		bot.WithEventListenerFunc(onAutocompleteInteractionCreate),
	)

	if err != nil {
		panic(err)
	}

	defer client.Close(context.TODO())

	if _, err = client.Rest().SetGlobalCommands(
		client.ApplicationID(),
		commands,
	); err != nil {
		slog.Error("error registering commands: ", slog.Any("err", err))
		panic(err)
	}

	if gatewayErr := client.OpenGateway(context.TODO()); gatewayErr != nil {
		slog.Error("error opening gateway: ", slog.Any("err", err))
		panic(gatewayErr)
	}

	if APIErr := GetData(); APIErr != nil {
		slog.Error("error fetching data from API: ", slog.Any("err", err))
		panic(APIErr)
	}

	slog.Info("successfully logged in. ctrl-c to exit")
	s := make(chan os.Signal, 1)
	signal.Notify(s, syscall.SIGINT, syscall.SIGTERM)
	<-s
}
