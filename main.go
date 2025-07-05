package main

import (
	"context"
	"encoding/json"
	"flag"
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

	"github.com/hozhai/odysseus/pkg/zutils"
)

type Item struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Legend   string `json:"legend"`
	MainType string `json:"mainType"`
	Rarity   string `json:"rarity"`
	ImageID  string `json:"imageId"`
	Deleted  bool   `json:"deleted"`
	SubType  string `json:"subType,omitempty"`
	GemNo    int    `json:"gemNo,omitempty"`
	MinLevel int    `json:"minLevel,omitempty"`
	MaxLevel int    `json:"maxLevel,omitempty"`

	StatType      string `json:"statType,omitempty"`
	StatsPerLevel []struct {
		Level       int `json:"level"`
		Power       int `json:"power,omitempty"`
		Agility     int `json:"agility,omitempty"`
		Defense     int `json:"defense,omitempty"`
		AttackSpeed int `json:"attackSpeed,omitempty"`
		AttackSize  int `json:"attackSize,omitempty"`
		Intensity   int `json:"intensity,omitempty"`
		Warding     int `json:"warding,omitempty"`
		Drawback    int `json:"drawback,omitempty"`
	} `json:"statsPerLevel,omitempty"`

	ValidModifiers []string `json:"validModifiers,omitempty"`

	EnchantTypes struct {
		Gear struct {
			DefenseIncrement int `json:"defenseIncrement"`
			PowerIncrement   int `json:"powerIncrement"`
		} `json:"gear,omitempty"`
		Ship struct {
			Hull struct {
				Durability int `json:"durability"`
			} `json:"hull,omitempty"`
			Ram struct {
				Durability int `json:"durability"`
			} `json:"ram,omitempty"`
		} `json:"ship"`
	} `json:"enchantTypes,omitempty"`

	PowerIncrement        float32 `json:"powerIncrement,omitempty"`
	DefenseIncrement      float32 `json:"defenseIncrement,omitempty"`
	AgilityIncrement      float32 `json:"agilityIncrement,omitempty"`
	AttackSpeedIncrement  float32 `json:"attackSpeedIncrement,omitempty"`
	AttackSizeIncrement   float32 `json:"attackSizeIncrement,omitempty"`
	IntensityIncrement    float32 `json:"intensityIncrement,omitempty"`
	RegenerationIncrement float32 `json:"regenerationIncrement,omitempty"`
	PiercingIncrement     float32 `json:"piercingIncrement,omitempty"`
	ResistanceIncrement   float32 `json:"resistanceIncrement,omitempty"`

	Insanity     int `json:"insanity,omitempty"`
	Warding      int `json:"warding,omitempty"`
	Agility      int `json:"agility,omitempty"`
	AttackSize   int `json:"attackSize,omitempty"`
	Defense      int `json:"defense,omitempty"`
	Drawback     int `json:"drawback,omitempty"`
	Power        int `json:"power,omitempty"`
	AttackSpeed  int `json:"attackSpeed,omitempty"`
	Intensity    int `json:"intensity,omitempty"`
	Piercing     int `json:"piercing,omitempty"`
	Regeneration int `json:"regeneration,omitempty"`
	Resistance   int `json:"resistance,omitempty"`
	Durability   int `json:"durability,omitempty"`
	Speed        int `json:"speed,omitempty"`
	Stability    int `json:"stability,omitempty"`
	Turning      int `json:"turning,omitempty"`
	RamDefense   int `json:"ramDefense,omitempty"`
}

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

	if APIErr := getData(); APIErr != nil {
		slog.Error("error fetching data from API: ", slog.Any("err", err))
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

					if strings.Contains(strings.ToLower(item.Name), strings.ToLower(value)) && item.Name != "None" {
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

		ptrTrue := zutils.PtrToBool(true)

		var fields []discord.EmbedField

		fields = append(fields, discord.EmbedField{
			Name:  "Description",
			Value: item.Legend,
		}, discord.EmbedField{
			Name:   "ID",
			Value:  item.ID,
			Inline: ptrTrue,
		}, discord.EmbedField{
			Name:   "Type",
			Value:  item.MainType,
			Inline: ptrTrue,
		})

		err := e.CreateMessage(
			discord.NewMessageCreateBuilder().AddEmbeds(
				discord.NewEmbedBuilder().
					SetTitle(item.Name).
					SetThumbnail(item.ImageID).
					SetFields(
						fields...,
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

func getData() error {
	fileContent, err := os.ReadFile("items.json")

	if err == nil {
		slog.Info("items.json found, decoding...")
		err = json.Unmarshal(fileContent, &APIData)
		if err != nil {
			slog.Warn("failed to decode, falling back to fetching api...")
		} else {
			slog.Info("succesfully decoded json")
			return nil
		}
	} else if os.IsNotExist(err) {
		slog.Warn("item.json doesn't exist, fetching from api...")
	} else {
		slog.Error("error reading items.json")
		return err
	}

	resp, err := http.Get("https://api.arcaneodyssey.net/items")
	if err != nil {
		return fmt.Errorf("cannot fetch items: %w", err)
	}

	defer resp.Body.Close()

	respBytes, readErr := io.ReadAll(resp.Body)
	if readErr != nil {
		return fmt.Errorf("cannot read response body: %w", readErr)
	}

	unmarshalErr := json.Unmarshal(respBytes, &APIData)
	if unmarshalErr != nil {
		return fmt.Errorf("cannot unmarshal response body: %w", unmarshalErr)
	}

	file, fileErr := json.MarshalIndent(APIData, "", "  ")
	if fileErr != nil {
		return fmt.Errorf("cannot encode marshal response body: %w", fileErr)
	}

	writeErr := os.WriteFile("items.json", file, 0644)
	if writeErr != nil {
		return fmt.Errorf("cannot write file: %w", writeErr)
	}

	slog.Info("finished fetching data from API")
	return nil
}
