function replyMessage(update, tapi, text, extra) {
  return tapi("sendMessage", {
    chat_id: update.message ? update.message.chat.id : undefined,
    text,
    ...extra,
  });
}

module.exports = replyMessage;
