/**
 * Example on how to create a short hand and use it as a plugin with the bot
 *
 * The update and tapi methods will be binded to this for you to use.
 * Note the update object will be different for every single update
 */
function replyMessage(text, extra) {
  return this.tapi("sendMessage", {
    chat_id: this.update.message ? this.update.message.chat.id : undefined,
    text,
    ...extra,
  });
}

module.exports = replyMessage;
