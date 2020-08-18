/**
 * Simple echo bot that replies to your message exactly what you sent.
 */

require("dotenv").config();

const { PollingBot } = require("../src");
const bot = new PollingBot(process.env.BOT_TOKEN);

bot.addHandler(function (update) {
  setTimeout(() => {
    bot.tapi("sendMessage", {
      chat_id: update.message.chat.id, // Can save this value in DB and use later!
      text: "Sending this 5 seconds later!",
    });
  }, 5000);
});

bot.startPolling(0);

setTimeout(() => bot.stopPolling(), 10000);
