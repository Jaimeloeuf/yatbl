const config = require("./config");

/**
 * Create context object to bind as "this" of update handlers
 *
 * Go over every shorthand method to bind their own "this" context in and,
 * reducing them into a single object for the "this" context object in handlers
 * @param {object} ctxForShortHands Object containing the update object and tapi to bind as this for short hand methods
 * @param {Array<Function>} shortHands the array of shortHand functions
 * @returns {object} "this" ctx for handlers
 */
function createShortHands(ctxForShortHands, shortHands) {
  const ctx = {};
  for (const shortHand of shortHands)
    ctx[shortHand.name] = shortHand.bind(ctxForShortHands);
  return ctx;
}

/**
 * _onUpdate handler whose job is to call all the user's update handler callback functions
 * This function is used by both webhook and polling
 * @notice You MUST bind a instance of the Bot class to "this" when calling this function, as it relies on the instance values.
 * @param {object} updates Array of Update objects from telegram https://core.telegram.org/bots/api#update
 *
 *
 * @todo Add a try/catch when calling all the handlers to allow a individual handler to error out. Should other handlers still be ran? Ran with an error binded to "this"?
 */
module.exports = async function _onUpdate(updates) {
  // Loop through every single update
  for (const update of updates) {
    // Create the context object for each update
    const ctx = createShortHands(
      { update, tapi: this.tapi }, // Context for the short hand method itself
      this._shortHands
    );

    // Loop through these handlers with shared ctx object binded to "this" and update as the arguement
    // Using forEach ensures every handler is called 1 by 1, without blocking the loop through every single update
    this.handlers.forEach((handler) => handler.call(ctx, update));
  }
};
