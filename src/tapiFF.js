const fetch = require("node-fetch");

/**
 * tapi Factory Function
 * @param {string} baseUrl The base telegram API URL
 * @returns {function} The tapi function
 */
function tapiFF(baseUrl) {
  /**
   * By default uses HTTP POST method and JSON body for sending data
   * @param {string} tApiMethod Telegram API method found on https://core.telegram.org/bots/api#available-methods
   * @param {object} body Request body for the API
   */
  async function tapi(tApiMethod, body) {
    const res = await fetch(baseUrl + tApiMethod, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Assumes JSON is received back and parse it before returning it to caller
    return res.json();
  }

  return tapi;
}

module.exports = tapiFF;
