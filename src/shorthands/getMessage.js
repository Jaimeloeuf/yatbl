/**
 * This is a getter method, so use it like "this.message.text"
 * Get the message/update received in a nicer manner allowing you to do simpler checks
 * @example
 * // to only allow a update handler to run if update contains an image
 * if (!this.message.photo) return;
 *
 * @todo How to use this as a getter instead of a method call
 * @todo Can explore something like the Knex query builder pattern
 * @todo add left+enter chat
 */
function getMessage() {
  return {
    text: this.update.message.text,
    photo: this.update.message.photo,
    video: this.update.message.video,
    sticker: this.update.message.sticker,
  };
}

module.exports = getMessage;
