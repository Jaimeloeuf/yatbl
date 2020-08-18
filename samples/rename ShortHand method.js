require("dotenv").config();

const { PollingBot, shortHands } = require("../src");
const bot = new PollingBot(process.env.BOT_TOKEN);

bot.addShortHand(shortHands.replyMessage);
bot.addShortHand({
  // Use the SAME EXACT shortHand method, but since the function name clash, we will use a different name
  shortHand: shortHands.replyMessage,
  name: "replyMessageDiffName",
});

bot.addHandler(async function () {
  this.replyMessage("Hey, this uses 'replyMessage'!");
  this.replyMessageDiffName("Hey, this uses 'replyMessageDiffName'!");
});

bot.startPolling(0);
