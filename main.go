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
			Name:        "damagecalc",
			Description: "Calculate your damage given certain stats.",
		},
		discord.SlashCommandCreate{
			Name:        "ping",
			Description: "Send a ping using configured ping types.",
			Options: []discord.ApplicationCommandOption{
				discord.ApplicationCommandOptionString{
					Name:         "type",
					Description:  "Type of ping to send",
					Required:     true,
					Autocomplete: true,
				},
				discord.ApplicationCommandOptionString{
					Name:        "message",
					Description: "Optional message to include with the ping",
					Required:    false,
				},
			},
		},
		discord.SlashCommandCreate{
			Name:        "pingset",
			Description: "Manage ping configurations. Requires Manage Roles permission.",
			Options: []discord.ApplicationCommandOption{
				discord.ApplicationCommandOptionSubCommand{
					Name:        "add",
					Description: "Add a new ping configuration",
					Options: []discord.ApplicationCommandOption{
						discord.ApplicationCommandOptionString{
							Name:        "name",
							Description: "Name for this ping type",
							Required:    true,
						},
						discord.ApplicationCommandOptionRole{
							Name:        "target",
							Description: "Role to ping",
							Required:    true,
						},
						discord.ApplicationCommandOptionRole{
							Name:        "required",
							Description: "Role required to use this ping (optional)",
							Required:    false,
						},
						discord.ApplicationCommandOptionString{
							Name:        "description",
							Description: "Description of this ping type",
							Required:    false,
						},
					},
				},
				discord.ApplicationCommandOptionSubCommand{
					Name:        "remove",
					Description: "Remove a ping configuration",
					Options: []discord.ApplicationCommandOption{
						discord.ApplicationCommandOptionString{
							Name:         "name",
							Description:  "Name of ping type to remove",
							Required:     true,
							Autocomplete: true,
						},
					},
				},
				discord.ApplicationCommandOptionSubCommand{
					Name:        "list",
					Description: "List all ping configurations",
				},
			},
		},
	}
	APIData APIResponse
)

func main() {
	if err := godotenv.Load(); err != nil {
		slog.Error("failed to load env")
		return
	}

	token := os.Getenv("TOKEN")
	dbUrl := os.Getenv("DB_URL")

	if token == "" {
		slog.Error("make sure the token is provided in the .env")
		return
	}

	if dbUrl == "" {
		slog.Error("make sure the mysql connection string is provided in the .env")
		return
	}

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
		bot.WithEventListenerFunc(onModalSubmitInteractionCreate),
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
