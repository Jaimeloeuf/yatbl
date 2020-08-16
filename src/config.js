// Configs that can be overriden using the bot's constructor
module.exports = Object.freeze({
  blockingHandlers: process.env["blockingHandlers"] || false, // allow the process.env to be of all cases, use regex?
});
