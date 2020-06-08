const tapiFF = require("./tapiFF");

const sleep = async (timeout) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

/**
 * _onUpdate handler whose job is to call all the user's update handler callback functions
 * this is used by both webhook and polling
 * @param {object} update Update object from telegram https://core.telegram.org/bots/api#update
 *
 *
 * @todo Add a try/catch when calling all the handlers to allow a individual handler to error out. Should other handlers still be ran? Ran with an error binded to "this"?
 */
async function _onUpdate(update) {
  // On telegram API failure
  if (!update.ok) return this.errorHandler(update);

  // Loop through every single update
  for (const result of update.result) {
    // Context object binded to "this" in the handlers
    const ctx = this._shortHands
      .map((shortHand) => shortHand(result, this.tapi))
      .reduce((acc, shortHand) => Object.assign(acc, shortHand), {});

    // Loop through all the this.handlers and call them 1 by 1 with shared ctx object and result
    for (const handler of this.handlers) await handler.call(ctx, result);
  }
}

/**
 * @todo Back pressure adjustment support to pause polling/webhook or lower polling freq to prevent OOM death
 */
class Bot {
  tapi;
  errorHandler = console.error; // Default error handler is just error logging
  handlers = []; // On update handler functions
  update_id = 0; // Set update_id (used for polling) to start at 0 and use snake case to match tel API response
  _pollingLoop; // Interval ID from setInterval when polling
  _shortHands = []; // shortHand method generators

  asyncUpdateCounter = 0;

  constructor(BOT_TOKEN) {
    // Create base API url with the bot's token and create tapi function with it
    this.tapi = tapiFF(`https://api.telegram.org/bot${BOT_TOKEN}/`);
  }

  /**
   * Function to allow you to register a custom error handler
   * @param {*} errorHandler Error handler called with error object on error from telegram API
   */
  registerErrorHandler(errorHandler) {
    this.errorHandler = errorHandler;
  }

  /**
   * Start polling
   * @param {number} [pollingInterval=1000] Interval in Milliseconds to poll for updates
   */
  startPolling(pollingInterval = 1000) {
    // Run it once first before the setInterval starts
    _onUpdate.call(this);

    // Start polling using setInterval and save interval ID onto object
    this._pollingLoop = setInterval(
      async () => await _onUpdate.call(this),
      pollingInterval
    );
  }

  /**
   * Simple wrapper over stop and start polling to poll at a new interval
   * @param {number} newInterval the polling interval in ms
   * @notice This does not change the handlers. Only use if already using polling
   */
  changePollingInterval(newInterval) {
    this.stopPolling();
    this.startPolling(newInterval);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    clearInterval(this._pollingLoop);
  }

  /**
   * @todo url should follow the standard by telegram API to use the bot token, but allow user to override using options
   *
   * @param {*} port
   * @param {*} options
   */
  setWebhook(port, options = {}) {
    this.stopPolling();
    this.tapi("setWebhook", {
      url,
      ...options,
    });
  }

  /**
   * Add a new shorthand method that will be binded to "this" for new update callbacks
   * @param {function} shortHand method to bind onto "this" of update callbacks
   * @todo Check if the new shorthands' key collide with any existing shorthand method
   */
  addShortHand(shortHand) {
    this._shortHands.push(shortHand);
  }

  /**
   * Add a new update handler/callback to be called on new update
   * @param {function} newHandler handler function to call with update object on new update
   */
  addHandler(newHandler) {
    this.handlers.push(newHandler);
  }

  /**
   * Set a callback to be called when any command is received
   * @param {function} callback Callback function that will be called with the update object
   */
  onAllCommands(callback) {
    // @todo
  }

  /**
   * Set a callback for specific commands received
   * @param {string} command Command that will trigger the callback function
   * @param {function} callback Callback function that will be called with the update object
   */
  onCommand(command, callback) {
    // @todo
  }
}

module.exports = Bot;
