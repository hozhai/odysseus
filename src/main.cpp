#include <dotenv.h>
#include <dpp/dpp.h>

#include "cpr/api.h"
#include "cpr/response.h"

using namespace dotenv;

int main()
{
    // get bot token
    env.load_dotenv();
    const std::string BOT_TOKEN = env["ODYSSEUS_TOKEN"];

    // load api data in memory
    cpr::Response res =
        cpr::Get(cpr::Url{"https://api.arcaneodyssey.net/items"});

    dpp::json api_data = dpp::json::parse(res.text);

    // initialize bot
    dpp::cluster bot(BOT_TOKEN);
    bot.on_log(dpp::utility::cout_logger());

    // on ready
    bot.on_ready(
        [&bot](const dpp::ready_t &)
        {
            if (dpp::run_once<struct register_bot_commands>())
            {
                bot.set_presence(dpp::presence(dpp::presence_status::ps_online,
                                               dpp::activity_type::at_game,
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

                bot.log(dpp::loglevel::ll_info,
                        "Logged in as " + bot.me.username + "#" +
                            std::to_string(bot.me.discriminator));
            }
        });

    bot.on_slashcommand(
        [&bot](const dpp::slashcommand_t &event)
        {
            if (event.command.get_command_name() == "about")
            {
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

            if (event.command.get_command_name() == "ping")
            {
                event.reply(":ping_pong: Pong! " +
                            std::to_string(bot.rest_ping).substr(0, 5) + "ms");
            }

            if (event.command.get_command_name() == "item")
            {
                // TODO
            }
        });

    bot.on_autocomplete(
        [&bot, &api_data](const dpp::autocomplete_t &event)
        {
            for (auto &opt : event.options)
            {
                if (opt.focused)
                {
                    std::string uservalue = std::get<std::string>(opt.value);

                    if (uservalue.empty())
                    {
                        auto response = dpp::interaction_response(
                            dpp::ir_autocomplete_reply);

                        bot.interaction_response_create(
                            event.command.id, event.command.token, response);
                        break;
                    }

                    std::vector<dpp::json> results;

                    for (auto &elem : api_data)
                    {
                        if (results.size() == 10)
                        {
                            break;
                        }

                        std::string name =
                            static_cast<std::string>(elem["name"]);
                        std::string type =
                            static_cast<std::string>(elem["mainType"]);

                        if (name.starts_with(uservalue) && type != "Enchant" &&
                            type != "Modifier")
                        {
                            results.push_back(elem);
                        }
                    }

                    auto response =
                        dpp::interaction_response(dpp::ir_autocomplete_reply);

                    int i = 0;
                    for (auto &result : results)
                    {
                        response.add_autocomplete_choice(
                            dpp::command_option_choice(result["name"],
                                                       std::to_string(i)));
                        i++;
                    }

                    bot.interaction_response_create(
                        event.command.id, event.command.token, response);

                    break;
                }
            }
        });

    bot.start(dpp::st_wait);
}
