/**
 * ShortHand to get a command and its arguments from the message if any.
 *
 * Parser treats everything behind the command as arguments for that command
 * Guard in place against non-message type updates
 * Reference used for parser https://core.telegram.org/bots/api#messageentity
 * @param {String} command Command to find and parse when found
 */
export default function getCommand(command: string) {
  // Explicitly end and return undefined if the update does not contain a message or if the message have not entities
  if (
    !this.update.message ||
    !this.update.message.entities ||
    !this.update.message.entities.length
  )
    return undefined;

  const commandArgumentList = [];

  for (const entity of this.update.message.entities) {
    if (
      entity.type === "bot_command" &&
      command ===
        this.update.message.text.slice(
          entity.offset + 1, // +1 to ensure removal of "/"
          entity.offset + entity.length
        )
    ) {
      // Take everything after the command as arguments for it, EVEN if there is a second command after the command
      // @todo Should stop when there is another command
      const args = this.update.message.text
        // +1 to start from the next character after the command
        .slice(entity.offset + entity.length + 1)
        .trim();

      // If there are arguments, split them by spaces into an array, else save null as the argument
      commandArgumentList.push(args.length ? args.split(" ") : null);
    }
  }

  // Return undefined if the given command was not found
  return commandArgumentList.length ? commandArgumentList : undefined;
}
