const tapiFF = require("./tapiFF");
const _onUpdate = require("./onUpdate");

const sleep = async (timeout) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

/**
 * @todo Back pressure adjustment support to pause polling/webhook or lower polling freq to prevent OOM death
 */
class Bot {
  tapi;
  apiErrorHandler = console.error; // Default error handler is just error logging
  handlers = []; // On update handler functions
  update_id = 0; // Set update_id (used for polling) to start at 0 and use snake case to match tel API response
  _continueLooping = false; // Bool to determine if looping should continue
  _webhookServer; // Reference to the integrated webhook server
  _shortHands = []; // shortHand method generators

  asyncUpdateCounter = 0;

  /**
   * @param {String} BOT_TOKEN Telegram Bot token from bot father
   * @param {Object} configurations Used to configure the bot, changing the default configs
   */
  constructor(BOT_TOKEN, configurations = {}) {
    this.changeToken(BOT_TOKEN);
  }

  /**
   * Calling this triggers an immediate change of token and tapi base URL.
   * Use this with caution as this might change token's while there are still pending calls to use tapi.
   * Alternatively, spin up a new instance of the Bot class instead of reusing bot instance.
   * The primary use case for this would be for the constructor and when a new bot token for the same bot has been requested from bot father.
   * @param {*} NEW_BOT_TOKEN Bot token provided by bot father from telegram
   */
  changeToken(NEW_BOT_TOKEN) {
    if (!NEW_BOT_TOKEN || NEW_BOT_TOKEN === "")
      throw new Error("Bot token required!");

    // Save bot token onto object
    this._BOT_TOKEN = NEW_BOT_TOKEN;

    // Create base API url with the bot's token and create tapi function with it
    this.tapi = tapiFF(`https://api.telegram.org/bot${NEW_BOT_TOKEN}/`);
  }

  /**
   * Function to allow you to register a custom error handler
   * @param {*} apiErrorHandler Error handler called with error object on error from telegram API
   */
  registerApiErrorHandler(apiErrorHandler) {
    this.apiErrorHandler = apiErrorHandler;
  }

  /**
   * Start polling
   * @param {number} [pollingInterval=200] Interval in Milliseconds to poll for updates where interval is the minimum time between each call to the telegram API
   *
   * @notice Even if pollingInterval is set to something really small, it will not poll telegram API every single millisecond or whatever, because pollingInterval is the time between EACH call to the API
   * @notice Which means that you can pass in 0 as the interval to poll without any interval or delay between the getUpdates
   */
  async startPolling(pollingInterval = 200) {
    // Set continue looping flag
    this._continueLooping = true;

    // Function to poll the telegram API for updates
    // Arrow function to keep "this" binding
    const polling = async () => {
      const update = await this.tapi("getUpdates", {
        offset: ++this.update_id,
      });

      // On telegram API failure
      if (!update.ok) return this.apiErrorHandler(update);

      // If no updates, end this function
      if (!update.result || !update.result.length) return;

      // Update this.update_id when there is one and use the latest update_id from update response
      this.update_id = update.result[update.result.length - 1].update_id;

      _onUpdate.call(this, update.result);
    };

    // Mimics setInterval, but only looping again after the current loop is completed
    while (this._continueLooping) {
      // Call this first to ensure it starts the first poll on startPolling and not after the first interval
      await polling();

      // @todo introduce back pressure control by increasing polling interval
      if (pollingInterval) await sleep(pollingInterval); // Only sleep/timeout/delay if a pollingInterval is specified
    }
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
    this._continueLooping = false;
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
