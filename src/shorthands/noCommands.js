/**
 * https://core.telegram.org/bots/api#messageentity
 *
 * Short hand to check if a command was sent.
 * Used to ensure that you are only handling a message type update instead of command type update
 */
module.exports = function noCommands() {
  if (this.update.message && this.update.message.entities)
    for (const entity of this.update.message.entities) {
      if (entity.type === "bot_command") return false;
    }
  else return true;
};
