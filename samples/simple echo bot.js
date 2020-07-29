require("dotenv").config();

const Bot = require("../src/bot");
const shortHands = require("../src/shorthands/defaultShortHands");

const bot = new Bot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands);

bot.addHandler(async function (update) {
  this.replyMessage(this.message.text, {
    reply_to_message_id: update.message.message_id,
  });
});

bot.startPolling(0);

setTimeout(() => bot.stopPolling(), 8000);
