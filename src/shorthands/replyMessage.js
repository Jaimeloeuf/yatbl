function replyMessage(text, extra) {
  return this.tapi("sendMessage", {
    chat_id: this.update.message ? this.update.message.chat.id : undefined,
    text,
    ...extra,
  });
}

module.exports = replyMessage;
