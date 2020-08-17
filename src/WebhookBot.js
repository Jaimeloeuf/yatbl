const Bot = require("./bot");

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
   * @note Default url follows telegram API standard of using the base API url where bot token is used, but allow user to override using options
   * @param {*} [PORT=3000]
   * @param {*} options Options object for registering the API. Ref to https://core.telegram.org/bots/api#setwebhook
   * @return {boolean} Boolean returned to determine if webhook is successfully set
   */
  async setWebhook(PORT = 3000, options = {}) {
    // Call to stopPolling() if it exists to ensure bot instance is not polling before registering as registration will fail
    if (this.stopPolling) this.stopPolling();

    // Start the webhook server and save the server object
    this._webhookServer = startServer(PORT, this._BOT_TOKEN, {
      _onUpdate: this._onUpdate,
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
}

module.exports = WebhookBot;
