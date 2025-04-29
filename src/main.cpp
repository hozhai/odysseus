#include <dpp/dpp.h>
#include <dotenv.h>

using namespace dotenv;

int main() {
    // get bot token
    env.load_dotenv();
    const std::string BOT_TOKEN = env["ODYSSEUS_TOKEN"];

    // initialize bot
    dpp::cluster bot(BOT_TOKEN);
    bot.on_log(dpp::utility::cout_logger());

    // on ready
    bot.on_ready(
        [&bot](const dpp::ready_t &) {
            if (dpp::run_once<struct register_bot_commands>()) {
                bot.set_presence(dpp::presence(dpp::presence_status::ps_online,
                                               dpp::activity_type::at_game,
                                               "Arcane Odyssey"));

                bot.global_command_create(
                    dpp::slashcommand("about",
                                      "About Odysseus",
                                      bot.me.id));

                bot.global_command_create(
                    dpp::slashcommand("ping",
                                      "Ping pong!",
                                      bot.me.id));

                bot.log(dpp::loglevel::ll_info,
                        "Logged in as " + bot.me.username + "#" +
                        std::to_string(bot.me.discriminator));
            }
        });

    bot.on_slashcommand(
        [&bot](const dpp::slashcommand_t &event) {
            if (event.command.get_command_name() == "about") {
                const dpp::embed embed =
                        dpp::embed()
                        .set_color(dpp::colors::blue_diamond)
                        .set_title("About Odysseus")
                        .set_author(event.command.usr.username, "",
                                    event.command.usr.get_avatar_url())
                        .set_description("Version: `0.1.0-dev`\nAuthor: "
                            "<@360235359746916352>\nGithub: "
                            "https://github.com/hozhai/odysseus")
                        .set_image("https://dpp.dev/DPP-Logo.png")
                        .set_timestamp(time(nullptr))
                        .set_footer(dpp::embed_footer()
                            .set_icon(bot.me.get_avatar_url())
                            .set_text("Odysseus - Made with <3"));

                const dpp::message msg(event.command.channel_id, embed);
                event.reply(msg);
            }

            if (event.command.get_command_name() == "ping") {
                event.reply(":ping_pong: Pong! " +
                            std::to_string(bot.rest_ping).substr(0, 5) + "ms");
            }
        });

    bot.start(dpp::st_wait);
}
