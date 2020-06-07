/**
 * Ran once for each update and not for each handler
 */
function defaultShortHands(update, tapi) {
  return {
    /**
     * Short hand for replying a message using the sendMessage tapi method
     */
    replyMessage(text, extra) {
      return tapi("sendMessage", {
        chat_id: update.message ? update.message.chat.id : undefined,
        text,
        ...extra,
      });
    },
    get isCommand() {
      return update.message.entities.map((entity) =>
        entity.type === "bot_command"
          ? update.message.text.slice(
              entity.offset + 1, // +1 to ensure removal of "/"
              entity.offset + entity.length
            )
          : undefined
      );
    },
    /**
     * Return the type of message/update received
     * This is a getter method, so use it as this.message.text or smth
     * basically user can define many handlers to deal with diff message formats
     */
    get message() {
      //   if (update.message.text) return update.message.text;
      //   if (update.message.sticker) return update.message.sticker;
      return {
        //   add command
        // add left+enter chat
        text: update.message.text,
        photo: update.message.photo,
        video: update.message.video,
        sticker: update.message.sticker,
      };
    },
    /**
     * Return the type of message/update received
     */
    typeOf() {
      if (update.message.text) return "text";
      if (update.message.sticker) return "sticker";
    },
  };
}

module.exports = defaultShortHands;
