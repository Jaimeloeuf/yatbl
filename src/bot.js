const tapiFF = require("./tapiFF");
const _onUpdate = require("./onUpdate");
const sleep = require("./sleep");

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
    // Create base API url with the bot's token
    this._BASE_URL = `https://api.telegram.org/bot${NEW_BOT_TOKEN}/`;

    // Create tapi function using base URL
    this.tapi = tapiFF(this._BASE_URL);
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
   * @note Default url follows telegram API standard of using the base API url where bot token is used, but allow user to override using options
   * @param {*} [PORT=3000]
   * @param {*} options Options object for registering the API. Ref to https://core.telegram.org/bots/api#setwebhook
   * @return {boolean} Boolean returned to determine if webhook is successfully set
   */
  async setWebhook(PORT = 3000, options = {}) {
    // Call to stopPolling() to ensure bot instance is not polling before registering as registration will fail
    this.stopPolling();

    // Start the webhook server and save the server object
    this._webhookServer = startServer(PORT, this._BOT_TOKEN, {
      _onUpdate,
      apiErrorHandler: this.apiErrorHandler,
    });

    const url = this._BASE_URL;

    await this.tapi("setWebhook", {
      url,
      ...options,
    });

    // @todo Get the webhook info to ensure webhook is properly set

    return true;
  }

  /**
   * @return {boolean} Boolean returned to determine if webhook is successfully removed
   */
  async deleteWebhook() {
    try {
      const url = this._BASE_URL;

      // Remove webhook first to ensure telegram stop sending updates to the webhook server
      await this.tapi("deleteWebhook", {
        url,
        ...options,
      });

      // @todo Get webhook info to ensure webhook is properly removed

      // Close the server once all current updates have been processed
      // Wrapped in a Promise to use async/await
      await new Promise((resolve, reject) =>
        this._webhookServer.close((err) => (err ? reject(err) : resolve()))
      );

      console.log("Internal webhook server closed");
      return true;
    } catch (error) {
      console.error("Failed to close internal webhook server");
      console.error(error);
      return false;
    }
  }

  /**
   * Add new shorthand method(s) to bind onto "this" of new update callback handlers
   * @param {(Function | Array<Function> | object | Array<object>)} shortHand method(s)
   */
  addShortHand(shortHand) {
    // Foreach has an arrow function to not pass this._addShortHand the optional parameters for a forEach handler
    if (Array.isArray(shortHand))
      return shortHand.forEach((shortHand) => this._addShortHand(shortHand));
    else return this._addShortHand(shortHand);
  }

  _addShortHand(shortHand) {
    // Modify name of the function if a name is given.
    // Primarily used to change the name of shortHands to prevent naming conflicts
    // Function is conditionally imported for faster start speeds when no renaming is needed
    // Else if object with only shortHand, just assign function to the variable
    if (typeof shortHand === "object" && typeof shortHand.name === "string")
      shortHand = require("./utils/renameFunction")(name, shortHand);
    else if (typeof shortHand.shortHand === "function")
      shortHand = shortHand.shortHand;
    else throw new Error("Invalid short hand configuration object used!");

    // Check if the name is taken and warn the user if so.
    // Note: users can just ignore this and override previous shortHand that used the same name if needed
    if (this.checkShortHandConflicts(shortHand.name))
      console.warn(
        `Function name ${shortHand.name} is taken. Please rename it or else this will override the previous shortHand added`
      );

    this._shortHands.push(shortHand);
  }

  /**
   * Test if there are any conflicting shorthand methods
   * This is called everytime a new shorthand method is added, and can be called externally too to precheck if a name/key is taken
   * @param {String} nameToCheck Name of the function to check. Name can be accessed using "Function.name"
   * @returns {Boolean} Whether the name is already registered or not. To be handled by callee
   */
  checkShortHandConflicts(nameToCheck) {
    return this._shortHands
      .map((shortHand) => shortHand.name) // Transform array of functions to array of function names
      .includes(nameToCheck);
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
