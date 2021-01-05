require("dotenv").config();

const { PollingBot, shortHands } = require("../src");
const bot = new PollingBot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands.defaultShortHands);

bot.addHandler(async function (update) {
  console.log("this in addHandler", this);
});

// On specific command
bot.onCommand("start", function (parsedCommand) {
  console.log("this in start", this);

  if (parsedCommand[0])
    console.log("User registration token:", parsedCommand[0][0]);
});

bot.onCommand("unsub", function (parsedCommand, update) {
  // using chat id instead of from id, allow grp notifs, so like unsub from grp instead of just a user
  console.log("unsub:", update.message.from.id);
  console.log("unsub:", update.message.chat.id);

  // Call logic for unsubscribe
});

bot.startPolling(0);
