require("dotenv").config();

const Bot = require("../dist/bot");
const bot = new Bot(process.env.BOT_TOKEN);

bot.addHandler(async function (update) {
  console.log(update);
  console.log("this", this);
  this.test = "testing string";

  await this.replyMessage("Hi", {
    reply_to_message_id: update.message.message_id,
  });
});

bot.addHandler(function (update) {
  console.log("this", this);

  bot.tapi("sendMessage", {
    chat_id: update.message.chat.id,
    text: "fk off",
    reply_to_message_id: update.message.message_id,
  });
});

bot.startPolling();
