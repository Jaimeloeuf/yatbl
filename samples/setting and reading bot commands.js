/**
 * Sample bot project to showcase how to set bot commands using the given shortHand
 */

require("dotenv").config();

const { PollingBot, shortHands } = require("../dist");
const bot = new PollingBot(process.env.BOT_TOKEN);
const tapi = bot.tapi;

const botCommands = [
  { command: "test1", description: "testing 1" },
  { command: "test2", description: "testing 2" },
];

// IIFE
(async function () {
  // Show all existing commands
  console.log(await tapi("getMyCommands"));

  // Clears all commands if any
  await shortHands.setCommands(tapi);

  // Show all existing commands
  console.log(await tapi("getMyCommands"));

  // Set the commands in botCommands array in
  await shortHands.setCommands(tapi, botCommands);

  // Show all existing commands
  console.log(await tapi("getMyCommands"));

  // Append a new command into the list of commands
  await shortHands.setCommands(tapi, [
    { command: "test3", description: "testing 3" },
  ]);

  // Show all existing commands
  console.log(await tapi("getMyCommands"));
})();
