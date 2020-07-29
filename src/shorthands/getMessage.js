function getMessage(update) {
  return {
    text: update.message.text,
    photo: update.message.photo,
    video: update.message.video,
    sticker: update.message.sticker,
  };
}

module.exports = getMessage;
