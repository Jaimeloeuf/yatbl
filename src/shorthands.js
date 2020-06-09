function replyMessage(update, tapi, text, extra) {
  return tapi("sendMessage", {
    chat_id: update.message ? update.message.chat.id : undefined,
    text,
    ...extra,
  });
}

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

function getMessage(update) {
  return {
    text: update.message.text,
    photo: update.message.photo,
    video: update.message.video,
    sticker: update.message.sticker,
  };
}

/**
 * Ran once for each update and not for each handler
 * Wraps around the actual methods, to prevent everyone of them to be initialized/defined for every update as not every update needs all of the methods.
 */
function defaultShortHands(update, tapi) {
  return {
    /**
     * Short hand for replying a message using the sendMessage tapi method
     */
    replyMessage(text, extra) {
      return replyMessage(update, tapi, text, extra);
    },

    /**
     * Short hand for checking if a command was sent and get the list of commands sent
     * Uses ternary operators to gaurd against non message type updates
     *
     * @todo treats everything behind the command as arguments for that command
     */
    get commands() {
      return getCommands(update);
    },

    /**
     * This is a getter method, so use it like "this.message.text"
     * Get the message/update received in a nicer manner allowing you to do simpler checks
     * @example
     * // to only allow a update handler to run if update contains an image
     * if (!this.message.photo) return;
     *
     * @todo add command and left+enter chat
     */
    get message() {
      return getMessage(update);
    },
  };
}

module.exports = defaultShortHands;
