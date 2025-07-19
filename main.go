package main

import (
	"context"
	"database/sql"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/gateway"
	_ "github.com/go-sql-driver/mysql"
)

var dbConn *sql.DB

type APIResponse []Item

var (
	commands = []discord.ApplicationCommandCreate{
		discord.SlashCommandCreate{
			Name:        "help",
			Description: "Displays the help menu.",
		},
		discord.SlashCommandCreate{
			Name:        "latency",
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
		discord.SlashCommandCreate{
			Name:        "ping",
			Description: "Displays the ping menu.",
		},
		discord.SlashCommandCreate{
			Name:        "pingset",
			Description: "Sets the role IDs for the pings in /ping. Must have Manage Roles permission to use.",
		},
	}
	APIData APIResponse
)

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Error("failed to load env")
	}

	token := os.Getenv("TOKEN")
	dbUrl := os.Getenv("DB_URL")

	// TODO: add error messages for when env isn't set correctly

	client, err := disgo.New(token,
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
		bot.WithEventListenerFunc(onComponentInteractionCreate),
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

	if err = client.OpenGateway(context.TODO()); err != nil {
		slog.Error("error opening gateway: ", slog.Any("err", err))
		panic(err)
	}

	if err := GetData(); err != nil {
		slog.Error("error fetching data from API: ", slog.Any("err", err))
		panic(err)
	}

	dbConn, err = sql.Open("mysql", dbUrl)

	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		panic(err)
	}

	if err = dbConn.Ping(); err != nil {
		slog.Error("failed to ping database", "error", err)
		panic(err)
	}

	defer func(dbConn *sql.DB) {
		err := dbConn.Close()
		if err != nil {
			slog.Error("failed to close database connection", "error", err)
		}
	}(dbConn)

	dbConn.SetMaxOpenConns(25)
	dbConn.SetMaxIdleConns(25)
	dbConn.SetConnMaxLifetime(5 * time.Minute)

	slog.Info("successfully logged in. ctrl-c to exit")
	s := make(chan os.Signal, 1)
	signal.Notify(s, syscall.SIGINT, syscall.SIGTERM)
	<-s
}
