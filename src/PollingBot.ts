import { Bot } from "./bot";
import sleep from "./sleep";

export class PollingBot extends Bot {
  // Set #update_id (used for polling) to start at 0 and use snake case to match tel API response
  #update_id = 0;

  // Bool to determine if looping should continue
  #continueLooping = false;

  /**
   * Start polling
   * @param {number} [pollingInterval=200] Interval in Milliseconds to poll for updates where interval is the minimum time between each call to the telegram API
   *
   * @notice Even if pollingInterval is set to something really small, it will not poll telegram API every single millisecond or whatever, because pollingInterval is the time between EACH call to the API
   * @notice Which means that you can pass in 0 as the interval to poll without any interval or delay between the getUpdates
   *
   * @todos
   * - Implement restart calls. Instead of re-creating everything, check if there is a polling loop already first.
   * - Perhaps the fix for the issue where messages get skipped, is to stop using "dont care loops",
   * - meaning, we should only make the nxt API call, once the first polling is completed
   * - Or an easier way is just to await the polling method call.
   */
  async startPolling(pollingInterval: number = 200) {
    // Delete webhook before using getUpdates to prevent conflicts https://core.telegram.org/bots/api#deletewebhook
    // This is ran to completion before flag setting to ensure looping does not start before webhook config with telegram API is deleted.
    await this.tapi!("deleteWebhook");

    // Set continue looping flag
    this.#continueLooping = true;

    // Function to poll telegram API for updates
    // Arrow function to keep "this" binding
    const poll = async () => {
      const update = await this.tapi!("getUpdates", {
        offset: this.#update_id,
      });

      // On telegram API failure
      if (!update.ok) return this.apiErrorHandler(update);

      // If no updates, end this function
      if (!update.result || !update.result.length) return;

      // Update this.#update_id to the update_id of the next update
      this.#update_id = update.result[update.result.length - 1].update_id + 1;

      // Only avail after Node 16.6.0 will use this once v18 becomes active LTS
      // this.#update_id = update.result(-1).update_id + 1;

      this._onUpdate(update.result);
    };

    // Mimics setInterval, but only looping again after the current loop is completed
    while (this.#continueLooping) {
      // Call this first to ensure it starts the first poll on startPolling and not after the first interval
      await poll();

      // @todo introduce back pressure control by increasing polling interval
      if (pollingInterval) await sleep(pollingInterval); // Only sleep/timeout/delay if a pollingInterval is specified
    }
  }

  /** Stop polling but keep configurations. */
  stopPolling() {
    this.#continueLooping = false;
  }

  /**
   * Simple wrapper over stop and start polling to poll at a new interval
   * @param {number} newInterval the polling interval in ms
   * @notice This does not change the handlers. Only use if already using polling
   */
  changePollingInterval(newInterval: number) {
    this.stopPolling();
    this.startPolling(newInterval);
  }
}
