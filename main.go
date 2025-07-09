package main

import (
	"context"
	"flag"
	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/gateway"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
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
		Level        int `json:"level"`
		Power        int `json:"power,omitempty"`
		Agility      int `json:"agility,omitempty"`
		Defense      int `json:"defense,omitempty"`
		AttackSpeed  int `json:"attackSpeed,omitempty"`
		AttackSize   int `json:"attackSize,omitempty"`
		Intensity    int `json:"intensity,omitempty"`
		Warding      int `json:"warding,omitempty"`
		Drawback     int `json:"drawback,omitempty"`
		Regeneration int `json:"regeneration,omitempty"`
		Piercing     int `json:"piercing,omitempty"`
		Resistance   int `json:"resistance,omitempty"`
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

	if APIErr := GetData(); APIErr != nil {
		slog.Error("error fetching data from API: ", slog.Any("err", err))
		panic(APIErr)
	}

	s := make(chan os.Signal, 1)
	signal.Notify(s, syscall.SIGINT, syscall.SIGTERM)
	<-s
}
