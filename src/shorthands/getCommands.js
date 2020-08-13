/**
 * https://core.telegram.org/bots/api#messageentity
 *
 * Short hand for checking if a command was sent and get the list of commands sent
 * Uses ternary operators to gaurd against non message type updates
 *
 * @todo treats everything behind the command as arguments for that command
 * @todo Make this into something like a getter, so handlers can just, this.commands
 * @todo Perhaps allow this method to test for commands, like this.commands("start") // returns bool + arguements
 */
function getCommands() {
  return this.update.message
    ? this.update.message.entities
      ? this.update.message.entities
          .map((entity) =>
            entity.type === "bot_command"
              ? this.update.message.text.slice(
                  entity.offset + 1, // +1 to ensure removal of "/"
                  entity.offset + entity.length
                )
              : undefined
          )
          .filter((entity) => entity !== undefined)
      : []
    : [];
}

module.exports = getCommands;
