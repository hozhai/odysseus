package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/joho/godotenv"
)

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
	}
)

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
	}

	if err = client.OpenGateway(context.TODO()); err != nil {
		panic(err)
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

	e.Client().SetPresence(context.TODO(), gateway.WithPlayingActivity("Arcane Odyssey"))
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
					SetImage("https://raw.githubusercontent.com/hozhai/odysseus/refs/heads/main/assets/banner.png").
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
