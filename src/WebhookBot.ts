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
  // Reference to a URL object if user used setWebhook to set a webhook URL
  #urlObject?: URL;

  // Reference to the integrated webhook server
  // Union type instead of optional type to be able to set this field to undefined later on
  #webhookServer: Server | undefined;

  /**
   * Start a webhook server (HTTP POST server), that does not handle HTTPS
   *
   * @param PORT The port on localhost for the server to listen to.
   * Defaults to 3000 assuming bot server does not handle HTTPS directly, rather traffic is routed from a reverse proxy.
   * Since the built in webhook server will not handle HTTPS, and node is not exactly good at it,
   * it is recommended to set webhook to a reverse proxy, and have the traffic routed to this.
   * Doing this also allows multiple bots to share the same domain and port, with just different URL paths.
   *
   * @param path Set the webhook url's path for server to listen to.
   * If URL object exists, means user set a new webhook URL, then use the path name for server's path.
   * Else if no URL object exists and user did not pass a path in,
   * assume user is using BOT_TOKEN as the webhook URL's path as recommended by telegram.
   * Else if user passes in a path, that will be the path used for server's path
   */
  async startServer(PORT: number = 3000, path: string = "/" + this._BOT_TOKEN) {
    // Start the webhook server and save its reference on an instance variable
    // Start server with current instance of this WebhookBot because `onUpdate` needs an instance of Bot Class as its "this" binding
    this.#webhookServer = server(
      this,
      PORT,
      this.#urlObject ? this.#urlObject.pathname : path
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

    // Set url object onto the reference so that it can be used by startServer method to set server's path
    this.#urlObject = urlObject;

    console.log("Webhook successfully set to: ", urlObject.toString());
  }

  /**
   * Start a webhook server and Set/Register webhook URL with telegram server
   * Refer to the setWebhook and startServer methods for more details.
   * This function just wraps over these 2 methods
   * The parameters are also the same as the 2 methods, refer to them for more details.
   */
  async startServerAndSetWebhook(
    url: string,
    webhookConfig?: WebhookConfig,
    port?: number,
    path?: string
  ) {
    // Start server first before setting up webhook integration with telegram API to ensure
    // server is up and running before telegram API attempts to send any updates.
    await this.startServer(port, path);
    await this.setWebhook(url, webhookConfig);
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
   * Only run this method to stop server after deleting webhook integration config with telegram method using the 'deleteWebhook' method.
   * Once this method resolves, it means server successfully stopped, if it throws means it failed to stop the webhook server.
   */
  async stopServer(): Promise<void> {
    return new Promise((resolve, reject) =>
      this.#webhookServer
        ? this.#webhookServer.close((err) => {
            if (err) {
              console.error("Failed to stop internal webhook server\n", err);
              return reject(err);
            }

            // Remove reference of webhook server from instance once it is stopped
            // However cannot delete using the delete operator as private class fields cannot be deleted
            // delete this.#webhookServer;
            //
            // Thus instead of deleting it, setting it to undefined to lose the reference to the instance
            // On the TS side, this means that annotating that field as optional does not work,
            // Instead it has to be a union type with undefined.
            this.#webhookServer = undefined;

            console.log("Internal webhook server stopped");
            resolve();
          })
        : reject(new Error("There is no webhook server to stop"))
    );
  }

  /**
   * Wrapper method over deleteWebhook and stopServer methods to make it easier for users to run them in the correct order
   * Refer to deleteWebhook for parameters, as params are directly passed to that method
   */
  async deleteWebhookAndStopServer(options: Object) {
    // Delete webhook first before stopping server to ensure no more requests will be sent in
    await this.deleteWebhook(options);
    await this.stopServer();
  }
}
