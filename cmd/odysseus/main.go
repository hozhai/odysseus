package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/joho/godotenv"
)

type Item struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Legend   string `json:"legend"`
	MainType string `json:"mainType"`
	Rarity   string `json:"rarity"`
	ImageId  string `json:"imageId"`
}

type APIResponse []Item

func PtrToBool(b bool) *bool {
	return &b
}

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

func getData() error {
	resp, err := http.Get("https://api.arcaneodyssey.net/items")
	if err != nil {
		return fmt.Errorf("cannot fetch items: %w", err)
	}

	defer resp.Body.Close()

	respBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return fmt.Errorf("cannot read response body: %w", readErr)
	}

	var items APIResponse

	unmarshalErr := json.Unmarshal(respBytes, &items)
	if unmarshalErr != nil {
		return fmt.Errorf("cannot unmarshal response body: %w", unmarshalErr)
	}

	APIData = items
	slog.Info("Finished fetching data from API")
	return nil
}

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Error("Error loading .env file.")
		return
	}

	client, err := disgo.New(os.Getenv("ODYSSEUS_TOKEN"),
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
		slog.Error("Error registering commands:", slog.Any("err", err))
		panic(err)
	}

	if gatewayErr := client.OpenGateway(context.TODO()); gatewayErr != nil {
		slog.Error("Error opening gateway:", slog.Any("err", err))
		panic(gatewayErr)
	}

	if APIErr := getData(); APIErr != nil {
		slog.Error("Error fetching data from API", slog.Any("err", err))
		panic(APIErr)
	}

	s := make(chan os.Signal, 1)
	signal.Notify(s, syscall.SIGINT, syscall.SIGTERM)
	<-s
}

func onReady(e *events.Ready) {
	slog.Info(
		fmt.Sprintf(
			"Logged in as %s#%s (%s)\n",
			e.User.Username,
			e.User.Discriminator,
			e.Client().ApplicationID(),
		),
	)

	err := e.Client().SetPresence(context.TODO(), gateway.WithPlayingActivity("Arcane Odyssey"))
	if err != nil {
		slog.Error("Error setting playing activity", slog.Any("err", err))
	}
}

func onAutocompleteInteractionCreate(e *events.AutocompleteInteractionCreate) {
	if e.Data.CommandName == "item" {
		for _, option := range e.AutocompleteInteraction.Data.Options {
			if option.Focused {
				var value string

				if err := json.Unmarshal(option.Value, &value); err != nil {
					slog.Error("Error unmarshaling option value", slog.Any("err", err))
					return
				}

				results := make([]discord.AutocompleteChoice, 0, 25)
				for _, item := range APIData {

					if len(results) >= 25 {
						break
					}

					if strings.Contains(item.Name, value) && item.Name != "None" {
						results = append(results, discord.AutocompleteChoiceString{
							Name:  item.Name,
							Value: item.ID,
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

func onApplicationCommandInteractionCreate(e *events.ApplicationCommandInteractionCreate) {
	if e.Data.CommandName() == "ping" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitlef("Pong! %v", e.Client().Gateway().Latency()).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}

		return
	}

	if e.Data.CommandName() == "about" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("About Odysseus v0.1.0").
					SetDescription(`
						Odysseus is a general-purpose utility bot for Arcane Odyssey, a Roblox game where you embark through an epic journey through the War Seas.

						This is a side project by <@360235359746916352> and an excuse to learn Go. Here's the [source code](https://github.com/hozhai/odysseus) of the project.
						`).
					SetImage("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.webp").
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}

	if e.Data.CommandName() == "help" {
		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle("Help").
					SetFields(
						discord.EmbedField{Name: "/help", Value: "Displays this message. :)"},
						discord.EmbedField{Name: "/about", Value: "About Odysseus."},
						discord.EmbedField{Name: "/ping", Value: "Returns the API latency."},
						discord.EmbedField{Name: "/item", Value: "Shows an item from Arcane Odyssey."},
					).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}

	if e.Data.CommandName() == "item" {
		id := e.SlashCommandInteractionData().String("name")
		var item Item

		for _, i := range APIData {
			if i.ID == id {
				item = i
				break
			}
		}

		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle(item.Name).
					SetThumbnail(item.ImageId).
					SetFields(
						discord.EmbedField{
							Name:  "Description",
							Value: item.Legend,
						},
						discord.EmbedField{
							Name:   "ID",
							Value:  item.ID,
							Inline: PtrToBool(true),
						},
						discord.EmbedField{
							Name:   "Type",
							Value:  item.MainType,
							Inline: PtrToBool(true),
						},
					).
					SetFooter("Odysseus - Made with love <3", "").
					SetTimestamp(time.Now()).
					SetColor(0x93b1e3).
					Build(),
			).Build(),
		)

		if err != nil {
			slog.Error("Error sending message", slog.Any("err", err))
		}
	}
}
