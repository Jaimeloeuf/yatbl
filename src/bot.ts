import tapiFF from "./tapiFF";
import onUpdate from "./onUpdate";

type ApiErrorHandler = (error: any) => void;
type ShortHand = Function;
type ShortHandArg = ShortHand | Array<ShortHand> | object | Array<object>;
type Handler = Function;
type Callback = Function;

/**
 * @todo Back pressure adjustment support to pause polling/webhook or lower polling freq to prevent OOM death
 */
export default class Bot {
  // Instance variables. Most are defined here more for documentation purposes than anything.
  tapi;
  _onUpdate = onUpdate;
  apiErrorHandler: ApiErrorHandler = console.error; // Default error handler is just error logging
  handlers: Array<Handler> = []; // On update handler functions
  _BOT_TOKEN = "";
  _shortHands: Array<ShortHand> = []; // shortHand methods

  /**
   * @param {String} BOT_TOKEN Telegram Bot token from bot father
   * @param {Object} configurations Used to configure the bot, changing the default configs
   */
  constructor(BOT_TOKEN: string, configurations: object = {}) {
    this.changeToken(BOT_TOKEN);
  }

  /**
   * Calling this triggers an immediate change of token and tapi base URL.
   * Use this with caution as this might change token's while there are still pending calls to use tapi.
   * Alternatively, spin up a new instance of the Bot class instead of reusing bot instance.
   * The primary use case for this would be for the constructor and when a new bot token for the same bot has been requested from bot father.
   * @param {*} NEW_BOT_TOKEN Bot token provided by bot father from telegram
   */
  changeToken(NEW_BOT_TOKEN: string) {
    if (!NEW_BOT_TOKEN || NEW_BOT_TOKEN === "")
      throw new Error("Bot token required!");

    // Save bot token onto object
    this._BOT_TOKEN = NEW_BOT_TOKEN;

    // Create tapi function using bot token
    this.tapi = tapiFF(NEW_BOT_TOKEN);
  }

  /**
   * Function to allow you to register a custom error handler
   * @param {*} apiErrorHandler Error handler called with error object on error from telegram API
   */
  registerApiErrorHandler(apiErrorHandler: ApiErrorHandler) {
    this.apiErrorHandler = apiErrorHandler;
  }

  /**
   * Add new shorthand method(s) to bind onto "this" of new update callback handlers
   * @param {(Function | Array<Function> | object | Array<object>)} shortHand method(s)
   */
  addShortHand(shortHand: ShortHandArg) {
    // Foreach has an arrow function to not pass this._addShortHand the optional parameters for a forEach handler
    if (Array.isArray(shortHand))
      return shortHand.forEach((shortHand) => this._addShortHand(shortHand));
    else return this._addShortHand(shortHand);
  }

  /**
   * Inner method for adding new shorthand method(s) to bind onto "this" of new update callback handlers
   * @param {(Function | object)} shortHand method(s)
   */
  _addShortHand(shortHand: ShortHandArg) {
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
  checkShortHandConflicts(nameToCheck: string): boolean {
    return this._shortHands
      .map((shortHand) => shortHand.name) // Transform array of functions to array of function names
      .includes(nameToCheck);
  }

  /**
   * Add a new update handler/callback to be called for every new update
   * @param {function} newHandler handler function to call with update object on new update
   * @return {Number} Number of handlers registered on this bot
   */
  addHandler(newHandler: Handler): number {
    return this.handlers.push(newHandler);
  }

  /**
   * Set a callback to be called when any command is received
   * @param {function} callback Callback function that will be called with the update object
   * @return {Number} Number of handlers registered on this bot
   */
  onAllCommands(callback: Callback): number {
    const getCommands = require("./shorthands/getCommands"); // Only load shortHand if this method is used
    // Alternatively -->  () => getCommands().length ? await callback(update) : undefined
    // Alternatively -->  () => getCommands().length && await callback(update)
    // Using function instead of arrow function to prevent inheriting the "this" value binding, of the object's method.
    // Instead, we want the "this" binding that is passed in via the onUpdate method
    return this.addHandler(async function (update) {
      // Bind update to this when calling shortHand
      const commandList = getCommands.call({ update });
      if (commandList.length)
        return await callback.call(this, commandList, update);
    });
  }

  /**
   * Set a callback for specific commands received
   * @param {string} command Command that will trigger the callback function
   * @param {function} callback Callback function that will be called with the update object
   * @return {Number} Number of handlers registered on this bot
   */
  onCommand(command: string, callback: Callback): number {
    const getCommand = require("./shorthands/getCommand"); // Only load shortHand if this method is used
    // Using function instead of arrow function to prevent inheriting the "this" value binding, of the object's method.
    // Instead, we want the "this" binding that is passed in via the onUpdate method
    return this.addHandler(async function (update) {
      // Bind update to this when calling shortHand
      const parsedCommand = getCommand.call({ update }, command);
      if (parsedCommand)
        return await callback.call(this, parsedCommand, update);
    });
  }

  /**
   * Wrapper over addHandler method to set callbacks for updates that are ONLY messages, and no command type updates
   * @param {Function} callback function to be used as the handler for this type of updates
   */
  onMessage(callback: Callback): number {
    const noCommands = require("./shorthands/noCommands"); // Only load shortHand if this method is used
    // Using function instead of arrow function to prevent inheriting the "this" value binding, of the object's method.
    // Instead, we want the "this" binding that is passed in via the onUpdate method
    return this.addHandler(async function (update) {
      // Bind update to this when calling shortHand
      if (noCommands.call({ update })) return await callback.call(this, update);
    });

    // Alternatively, use && shortcircuiting with noCommands call
    // return this.addHandler(async function (update) {
    //   return noCommands.call({ update }) && (await callback.call(this, update));
    // });
  }
}
