/**
 * Simple echo bot that replies to your message exactly what you sent using telegram's webhook API.
 */

require("dotenv").config();

const { WebhookBot, shortHands } = require("../src");
const bot = new WebhookBot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands.replyMessage);

bot.addHandler(function (update) {
  this.replyMessage(update.message.text, {
    reply_to_message_id: update.message.message_id,
  });
});

bot.setWebhookAndStartServer();
// bot.setWebhookAndStartServer({
//   url: "https://bot-api.example.com",
// });
