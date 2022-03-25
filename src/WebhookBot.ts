/**
 * Webhook bot with a basic built in server implementation.
 * @todo startServer and setWebhook should be "seperate" methods as users might want to use builtin method to set webhook, but want to run their own webhook server.
 */

import { Bot } from "./bot";
import server from "./server";

import type { SetWebhook, DeleteWebhook } from "telegram-typings";
type WebhookConfig = Omit<SetWebhook, "url">;

import type { Server } from "http";

export class WebhookBot extends Bot {
  // Instance variables. Most are defined here more for documentation purposes than anything.
  _webhookServer?: Server; // Reference to the integrated webhook server

  /**
   * @param {String} BOT_TOKEN Telegram Bot token from bot father
   * @param {Object} configurations Used to configure the bot, changing the default configs
   */
  constructor(BOT_TOKEN: string, configurations: object = {}) {
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
  async startServer(PORT: number = 3000) {
    // Start the webhook server and save its reference on an instance variable
    // Start server with current instance of this WebhookBot because `onUpdate` needs an instance of Bot Class as its "this" binding
    this._webhookServer = server(
      this,
      PORT,
      "/" + this._BOT_TOKEN,
      this._onUpdate,
      this.apiErrorHandler
    );
  }

  /**
   * Set/Register webhook URL with telegram server. Run this only after server is started and ready for incoming updates.
   * Reference: https://core.telegram.org/bots/api#setwebhook
   * @param {String} url HTTPS URL to send updates to, by default the path is the bot token.
   */
  async setWebhook(url: string, webhookConfig: WebhookConfig = {}) {
    const urlObject = new URL(url);

    if (urlObject.protocol !== "https:")
      throw new Error("Only HTTPS URLs allowed for webhooks");

    // If no path name is set on the URL path, auto set path here by
    // following telegram's recommendations to use bot token (set on object by the constructor) as path
    // Setting path name will auto have / pre-pended to it
    if (urlObject.pathname === "/") urlObject.pathname = this._BOT_TOKEN;

    // Call setWebhook API and get back the response to check if the setup was successful
    const setWebhookResponse = await this.tapi!("setWebhook", {
      // Get the URL constructed above
      url: urlObject.toString(),

      ...webhookConfig,
    });

    // Throw error from telegram if webhook setup failed.
    if (!setWebhookResponse.ok) throw new Error(setWebhookResponse.description);

    console.log("Webhook successfully set to: ", urlObject.toString());
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * Refer to the setWebhook and startServer methods for more details.
   * This function just wraps over these 2 methods
   * The parameters are also the same as the 2 methods, refer to them for more details.
   */
  async setWebhookAndStartServer(url: string, options = {}, port?: number) {
    // Start server first before setting up webhook integration with telegram API to ensure
    // server is up and running before telegram API attempts to send any updates.
    await this.startServer(port);
    await this.setWebhook(url, options);
  }

  /**
   * @todo Get webhook info to ensure webhook is properly removed
   * @return Boolean returned to determine if webhook is successfully removed
   */
  async deleteWebhook(options: DeleteWebhook = {}): Promise<boolean> {
    // Remove webhook to ensure telegram stop sending updates to this webhook server
    return this.tapi("deleteWebhook", options);
  }

  /**
   * Only run this method to stop server after deleting webhook integration config with telegram method using the 'deleteWebhook' method
   * @return Boolean returned to indicate if server is successfully stopped
   */
  async stopServer(): Promise<boolean> {
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
   * Wrapper method over deleteWebhook and stopServer methods to make it easier for users to run them in the correct order
   * Refer to deleteWebhook for parameters, as params are directly passed to that method
   */
  async stopServerAndRemoveWebhook(options: Object) {
    // Delete webhook first before stopping server to ensure no more requests will be sent in
    await this.deleteWebhook(options);
    await this.stopServer();
  }
}
