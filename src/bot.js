const tapiFF = require("./tapiFF");
const onUpdate = require("./onUpdate");

/**
 * @todo Back pressure adjustment support to pause polling/webhook or lower polling freq to prevent OOM death
 */
class Bot {
  // Instance variables. Most are defined here more for documentation purposes than anything.
  tapi;
  _onUpdate = onUpdate;
  apiErrorHandler = console.error; // Default error handler is just error logging
  handlers = []; // On update handler functions
  _BOT_TOKEN = "";
  // @todo Make baseUrl on Bot class but as a getter only and cannot be set
  _BASE_URL = "";
  _shortHands = []; // shortHand methods

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
   * Add new shorthand method(s) to bind onto "this" of new update callback handlers
   * @param {(Function | Array<Function> | object | Array<object>)} shortHand method(s)
   */
  addShortHand(shortHand) {
    // Foreach has an arrow function to not pass this._addShortHand the optional parameters for a forEach handler
    if (Array.isArray(shortHand))
      return shortHand.forEach((shortHand) => this._addShortHand(shortHand));
    else return this._addShortHand(shortHand);
  }

  /**
   * Inner method for adding new shorthand method(s) to bind onto "this" of new update callback handlers
   * @param {(Function | object)} shortHand method(s)
   */
  _addShortHand(shortHand) {
    // If shortHand is a function, do nothing
    // Modify name of function if name is given. Primarily to change names to prevent naming conflicts
    // Function is conditionally imported for faster load time when no renaming is needed
    // Else if object with only shortHand, just assign function to the variable
    // Else the configuration object is invalid.
    if (typeof shortHand === "function");
    else if (
      typeof shortHand === "object" &&
      typeof shortHand.name === "string"
    )
      shortHand = require("./utils/renameFunction")(
        shortHand.name,
        shortHand.shortHand
      );
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
   * Add a new update handler/callback to be called for every new update
   * @param {function} newHandler handler function to call with update object on new update
   * @return {Number} Number of handlers registered on this bot
   */
  addHandler(newHandler) {
    return this.handlers.push(newHandler);
  }

  /**
   * Set a callback to be called when any command is received
   * @param {function} callback Callback function that will be called with the update object
   * @return {Number} Number of handlers registered on this bot
   */
  onAllCommands(callback) {
    const getCommands = require("./shorthands/getCommands"); // Only load shortHand if this method is used
    // Alternatively -->  () => getCommands().length ? await callback(update) : undefined
    return this.addHandler(async (update) => {
      // Bind update to this when calling shortHand
      const commandList = getCommands.call({ update });
      if (commandList.length) return await callback(commandList, update);
    });
  }

  /**
   * Set a callback for specific commands received
   * @param {string} command Command that will trigger the callback function
   * @param {function} callback Callback function that will be called with the update object
   * @return {Number} Number of handlers registered on this bot
   */
  onCommand(command, callback) {
    const getCommand = require("./shorthands/getCommand"); // Only load shortHand if this method is used
    return this.addHandler(async (update) => {
      // Bind update to this when calling shortHand
      const parsedCommand = getCommand.call({ update }, command);
      if (parsedCommand) return await callback(parsedCommand, update);
    });
  }
}

module.exports = Bot;
