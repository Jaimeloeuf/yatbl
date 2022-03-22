/**
 * https://github.com/lukeed/polkadot/blob/master/examples/with-middleware/index.js
 */

import polkadot from "polkadot";
import { json } from "body-parser";

/**
 * Used to loop over all middlewares and call them 1 by 1
 * https://github.com/lukeed/polkadot/blob/master/examples/with-middleware/util.js
 * @param {*} mws The array of middleware functions
 * @param {*} req HTTP Req object
 * @param {*} res HTTP Res object
 */
async function loop(mws, req, res) {
  let out;
  for (const fn of mws) {
    out =
      (await fn(req, res, (err) => {
        if (err) throw err; // next accepts error that will get thrown
      })) || out;
  }
  return out;
}

/**
 * Function to start the server by wrapping over polkadot server starting
 * @notice "this" is expected to be passed in for this function to re-bind it to onUpdate function which REQUIRES it to be a instance of the Bot class.
 * @param {Number} PORT
 * @param {String} path The bot token should be passed in to follow telegram API standard of using bot token as the base API url, else any secret string will do too.
 * @param {Function} onUpdate
 * @param {Function} apiErrorHandler
 */
export default function startServer(
  PORT: number,
  path: string,
  onUpdate: Function,
  apiErrorHandler: Function
) {
  path = "/" + path;

  // @todo Only log it in debug/verbose mode
  console.log("Webhook server listening to: ", path);

  // Arrow function passed in to keep "this" binding of startServer function
  return polkadot(async (req, res) => {
    try {
      // Only execute middlewares if path and method matches exactly
      if (req.path === path && req.method === "POST")
        return loop(
          [
            json(), // Parse request body and put it on req.body

            // Main request handler as a middleware
            // Using an arrow function to keep the "this" binding of startServer function
            (req, _) => {
              // https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates
              // Unlike using getUpdates, this is not a response so there is no 'ok' field in the request body from telegram
              // Only a SINGLE update will be sent via webhook everytime.

              // Put update object in an array since onUpdate always expects an array of update(s)
              // Call onUpdate with update object and bind the Bot instance to onUpdate's "this"
              onUpdate.call(this, [req.body]);

              // Rely on "@polka/send-type" internally with return
              // @todo Integrate this with tapi!
              return {};
            },
          ],
          req,
          res
        );
      else {
        // If route is invalid, we assume it is not telegram that called our API
        // Thus return 404 and dont respond to any updates sent
        res.statusCode = 404;
        res.end();
      }
    } catch (error) {
      console.error(error);
      // this.errorHandler(error); // actual error handler instead of the normal api error handler

      // Close the connection
      res.statusCode = 400;
      return error.message || error;
    }
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Webhook server now running on localhost:${PORT}`);
  });
}
