/**
 * https://github.com/lukeed/polkadot/blob/master/examples/with-middleware/index.js
 */

const polkadot = require("polkadot");
const { json } = require("body-parser");

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
 * @param {Function} _onUpdate
 * @param {Function} apiErrorHandler
 */
module.exports = function startServer(PORT, path, _onUpdate, apiErrorHandler) {
  path = "/" + path;

  // @todo Only log it in debug/verbose mode
  console.log("Webhook server listening to: ", path);

  // Arrow function passed in to keep "this" binding of startServer function
  return polkadot(async (req, res) => {
    try {
      // Only execute middlewares and return their result if path and method matches exactly
      if (req.path === path && req.method === "POST")
        return await loop(
          [
            json(), // Parse request body and put it on req.body

            // Main request handler as a middleware
            // Using an arrow function to keep the "this" binding of startServer function
            (req, res) => {
              if (!req.body.ok) return apiErrorHandler(req.body);

              // Pass result to onUpdate while binding the Bot instance in
              _onUpdate.call(this, req.body.result);

              // Rely on "@polka/send-type" internally with return
              return { user: "data" };
            },
          ],
          req,
          res
        );
      else {
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
};
