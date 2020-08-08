/**
 * _onUpdate handler whose job is to call all the user's update handler callback functions
 * this is used by both webhook and polling
 * @param {object} updates Array of Update objects from telegram https://core.telegram.org/bots/api#update
 *
 *
 * @todo Add a try/catch when calling all the handlers to allow a individual handler to error out. Should other handlers still be ran? Ran with an error binded to "this"?
 */
module.exports = async function _onUpdate(updates) {
  // Loop through every single update
  for (const update of updates) {
    // Context object binded to "this" in the handlers
    // Call every shorthand creation method with the update object and tapi
    // Reduce them into a single object to be used as the ctx/this object for the handlers to use
    const ctx = this._shortHands.reduce(
      (accumalator, shortHand) =>
        Object.assign(accumalator, shortHand(update, this.tapi)),
      {}
    );

    // Loop through these handlers with shared ctx object binded to "this" and update as the arguement
    // Using forEach ensures every handler is called 1 by 1, without blocking the loop through every single update
    this.handlers.forEach(async (handler) => await handler.call(ctx, update));
  }
};
