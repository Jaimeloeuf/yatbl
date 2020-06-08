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

function startServer(PORT, path) {
  path = "/" + path;

  return polkadot(async function (req, res) {
    try {
      // Only if exact matche of path and method, then do we execute middlewares and return their result
      if (req.path === path && req.method === "POST")
        return await loop(
          [
            json(), // Parse request body and put it on req.body
            function main(req, res) {
              if (!req.body.ok) return errorHandler(req.body);

              const { result } = req.body;
              _onUpdate(result);

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
      // this.errorHandler(error);

      // Close the connection
      res.statusCode = 400;
      return error.message || error;
    }
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Running on localhost:${PORT}`);
  });
}

const server = startServer(4000, "1");

// To close the server
// server.close((err) => {
// if (err) console.error("Failed to close internal webhook server:", err);
// console.log("Internal webhook server closed");
// })
