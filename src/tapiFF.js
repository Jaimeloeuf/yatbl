/**
 * tapi (telegram API) Factory Function
 * @param {String} BOT_TOKEN Telegram bot token, the base telegram API url will be generated with this
 * @returns {Function} The tapi function
 */
module.exports = function tapiFF(BOT_TOKEN) {
  if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");

  const baseUrl = `https://api.telegram.org/bot${BOT_TOKEN}/`;

  // Load fetch lib lazily, only if the FF is invoked
  const fetch = require("node-fetch");

  /**
   * By default uses HTTP POST method and JSON body for sending data
   * @param {string} tApiMethod Telegram API method found on https://core.telegram.org/bots/api#available-methods
   * @param {object} body Request body for the API
   */
  async function tapi(tApiMethod, body) {
    const res = await fetch(baseUrl + tApiMethod, {
      method: "POST",
      // @todo Should include content-length headers
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Assumes JSON is received back and parse it before returning it to caller
    return res.json();
  }

  return tapi;
};
