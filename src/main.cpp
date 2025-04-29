#include "cpr/api.h"
#include <dotenv.h>
#include <dpp/dpp.h>

using namespace dotenv;

int main()
{
    env.load_dotenv();
    const std::string BOT_TOKEN = env["ODYSSEUS_TOKEN"];

    cpr::Response res =
        cpr::Get(cpr::Url{"https://api.arcaneodyssey.net/items"});
    dpp::json api_data = dpp::json::parse(res.text);

    dpp::cluster bot(BOT_TOKEN);
    bot.on_log(dpp::utility::cout_logger());

    bot.on_ready(
        [&bot](const dpp::ready_t &)
        {
            if (dpp::run_once<struct register_bot_commands>())
            {
                bot.set_presence(dpp::presence(dpp::ps_online, dpp::at_game,
                                               "Arcane Odyssey"));

                bot.global_command_create(
                    dpp::slashcommand("about", "About Odysseus", bot.me.id));
                bot.global_command_create(
                    dpp::slashcommand("ping", "Ping pong!", bot.me.id));
                bot.global_command_create(
                    dpp::slashcommand("item", "Get info about an item",
                                      bot.me.id)
                        .add_option(dpp::command_option(dpp::co_string, "name",
                                                        "The name of the item.",
                                                        true)
                                        .set_auto_complete(true)));

                bot.log(dpp::ll_info, "Logged in as " + bot.me.username + "#" +
                                          std::to_string(bot.me.discriminator));
            }
        });

    bot.on_slashcommand(
        [&bot](const dpp::slashcommand_t &event)
        {
            if (event.command.get_command_name() == "about")
            {
                dpp::embed embed =
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

                event.reply(dpp::message(event.command.channel_id, embed));
            }
            else if (event.command.get_command_name() == "ping")
            {
                event.reply(":ping_pong: Pong! " +
                            std::to_string(bot.rest_ping).substr(0, 5) + "ms");
            }
            else if (event.command.get_command_name() == "item")
            {
                // TODO
            }
        });

    bot.on_autocomplete(
        [&bot, &api_data](const dpp::autocomplete_t &event)
        {
            for (const auto &opt : event.options)
            {
                if (opt.focused)
                {
                    std::string uservalue = std::get<std::string>(opt.value);
                    if (uservalue.empty())
                    {
                        bot.interaction_response_create(
                            event.command.id, event.command.token,
                            dpp::interaction_response(
                                dpp::ir_autocomplete_reply));
                        break;
                    }

                    std::vector<dpp::json> results;
                    for (const auto &elem : api_data)
                    {
                        if (results.size() == 10)
                            break;
                        if (elem["name"].starts_with(uservalue) &&
                            elem["mainType"] != "Enchant" &&
                            elem["mainType"] != "Modifier")
                        {
                            results.push_back(elem);
                        }
                    }

                    dpp::interaction_response response(
                        dpp::ir_autocomplete_reply);
                    for (size_t i = 0; i < results.size(); ++i)
                    {
                        response.add_autocomplete_choice(
                            dpp::command_option_choice(results[i]["name"],
                                                       std::to_string(i)));
                    }

                    bot.interaction_response_create(
                        event.command.id, event.command.token, response);
                    break;
                }
            }
        });

    bot.start(dpp::st_wait);
}