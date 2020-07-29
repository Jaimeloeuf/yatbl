// https://core.telegram.org/bots/api#messageentity
function getCommands(update) {
  return update.message
    ? update.message.entities
      ? update.message.entities
          .map((entity) =>
            entity.type === "bot_command"
              ? update.message.text.slice(
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
