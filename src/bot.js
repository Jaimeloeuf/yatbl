const tapiFF = require("./tapiFF");

// @todo Add a try/catch when calling all the handlers to allow a individual handler to error out. Should other handlers still be ran? Ran with an error binded to "this"
async function _onUpdate() {
  // Call telegram update API with update offset
  const update = await this.tapi("getUpdates", { offset: ++this.update_id });

  // If no updates, end the function
  if (!update.result.length) return;

  // Update this.update_id when there is one and use the latest update_id from update response
  this.update_id = update.result[update.result.length - 1].update_id;

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
  handlers = []; // On update handler functions
  update_id = 0; // Set update_id to start at 0 and use snake case to match tel API response
  _pollingLoop; // Interval ID from setInterval when polling
  _shortHands = []; // shortHand method generators

  asyncUpdateCounter = 0;

  constructor(BOT_TOKEN) {
    // Create base API url with the bot's token and create tapi function with it
    this.tapi = tapiFF(`https://api.telegram.org/bot${BOT_TOKEN}/`);
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

  setWebhook() {
    // @todo
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
