export function replyMessage(text: string, extra: any) {
  return this.tapi("sendMessage", {
    chat_id: this.update.message ? this.update.message.chat.id : undefined,
    text,
    ...extra,
  });
}
