/**
 * Webhook bot with a basic built in server implementation.
 * @todo startServer and setWebhook should be "seperate" methods as users might want to use builtin method to set webhook, but want to run their own webhook server.
 */

const Bot = require("./bot");
const startServer = require("./server");

class WebhookBot extends Bot {
  // Instance variables. Most are defined here more for documentation purposes than anything.
  _webhookServer; // Reference to the integrated webhook server

  /**
   * @param {String} BOT_TOKEN Telegram Bot token from bot father
   * @param {Object} configurations Used to configure the bot, changing the default configs
   */
  constructor(BOT_TOKEN, configurations = {}) {
    super(BOT_TOKEN, configurations);
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * @note Any errors thrown in 'startServer' function will be bubbled up
   * @note Default url follows telegram API standard of using the base API url where bot token is used, but allow user to override using options
   * @param {Number} [PORT=3000] The port on localhost for the server to listen to.
   * Defaults to 3000 assuming bot server does not handle HTTPS directly, rather traffic is routed from a reverse proxy.
   * Since the built in webhook server will not handle HTTPS, and node is not exactly good at it,
   * it is recommended to set webhook to a reverse proxy, and have the traffic routed to this.
   * Doing this also allows multiple bots to share the same domain and port, with just different URL paths.
   */
  async startServer(PORT = 3000) {
    // Start the webhook server and save reference to the server
    // Call the startServer function with "call" method to bind "this" which is the current instance of the WebhookBot
    // This is because onUpdate functions needs a "this" binding that is a instance of the Bot Class,
    // Thus we are passing the current instance to startServer, which will call onUpdate with this instance binded to "this"
    this._webhookServer = startServer.call(
      this,
      PORT,
      this._BOT_TOKEN,
      this._onUpdate,
      this.apiErrorHandler
    );
  }

  /**
   * Set/Register webhook URL with telegram server. Run this only after server is started and ready for incoming updates.
   * Reference: https://core.telegram.org/bots/api#setwebhook
   * @note Default url path follows telegram API standard of using bot token as the base API url, but allow user to override using options.path
   * @param {String} url HTTPS URL to send updates to, options.path or bot token will be appended to path.
   * @param {Object} [options={}] Options object for registering the API, refer to telegram API reference
   */
  async setWebhook(url, options = {}) {
    // Validate url and ensure it is https first
    try {
      const urlObject = new URL(url);
      if (urlObject.protocol !== "https:") throw new Error();
    } catch (_) {
      // Catch and re-throw with specific error message
      throw new Error(
        "Invalid Webhook URL! See 'https://core.telegram.org/bots/api#setwebhook'"
      );
    }

    // Get webhook url path, either from options or following telegram's recommendations, use the bot token (set on object by the constructor)
    const urlPath = options.path || this._BOT_TOKEN;
    // If path is specified in options, delete before spreading options object onto setWebhook API call request body
    if (options.path) delete options.path;

    // Call setWebhook API and get back the response to check if the setup was successful
    const setWebhookResponse = await this.tapi("setWebhook", {
      // also can we read the hostname of the server and figure out the domain name? then add the path to the back?
      url: url + urlPath,
      ...options,
    });

    // Throw error from telegram if webhook setup failed.
    if (!setWebhookResponse.ok) throw new Error(setWebhookResponse.description);

    console.log("Webhook successfully set to: ", url + urlPath);
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * Refer to the setWebhook and startServer methods for more details.
   * This function just wraps over these 2 methods
   * The parameters are also the same as the 2 methods, refer to them for more details.
   *
   * @todo Maybe add a try catch or smth?
   * @todo Add a return value perhaps?
   */
  async setWebhookAndStartServer(url, options, port) {
    // Start server first before setting up webhook integration with telegram API to ensure
    // server is up and running before telegram API attempts to send any updates.
    await this.startServer(port);
    await this.setWebhook(url, options);
  }

  /**
   * @param {Object} [options={}] Reference: https://core.telegram.org/bots/api#deletewebhook
   * @return {boolean} Boolean returned to determine if webhook is successfully removed
   *
   * @todo Get webhook info to ensure webhook is properly removed
   */
  async deleteWebhook(options = {}) {
    // Remove webhook to ensure telegram stop sending updates to this webhook server
    return this.tapi("deleteWebhook", options);
  }

  /**
   * Only run this method to stop server after deleting webhook integration config with telegram method using the 'deleteWebhook' method
   * @return {boolean} Boolean returned to indicate if server is successfully stopped
   */
  async stopServer() {
    try {
      // Close server once all current updates have been processed
      // Wrapped in a Promise to use async/await to run it sequentially and use within a try/catch block
      // Check if server is created and set on instance because if startServer fails,
      // and process.on("uncaughtException") catches it, then we dont want to call "close" on undefined
      if (this._webhookServer)
        await new Promise((resolve, reject) =>
          this._webhookServer.close((err) => (err ? reject(err) : resolve()))
        );

      // Alternative to promise wrapping code above using native util.promisify method
      // This is the more official way to do it, but contains more unneccessary code without any value.
      // const closeServer = require("util").promisify(this._webhookServer.close);
      // await closeServer();

      console.log("Internal webhook server closed");
      return true;
    } catch (error) {
      console.error("Failed to close internal webhook server");
      console.error(error);
      return false;
    }
  }

  /**
   * Wrapper method over deleteWebhook and stopServer methods to make it easier for users to call them in order
   * Refer to deleteWebhook for parameters, as params are directly passed to that method
   *
   * @todo Auto call this using a process.onExit / onError handler
   */
  async stopServerAndRemoveWebhook(options) {
    await this.deleteWebhook(options);
    await this.stopServer();
  }
}

module.exports = WebhookBot;
