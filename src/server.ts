import type { Bot } from "./bot";
import http from "http";

/** Function to create and start a server instance */
export default (
  // Although bot passed in is webhookbot by default when users use this library's webhook bot,
  // the bot is only used for calling onUpdate in this function, which means that by right,
  // since onUpdate is binded on Bot class type, this type can be widened to be `Bot`.
  // Which will make it easier for users who want to use this server, but implement their own webhook bot class,
  // as they wont have to conform to the methods/class-type of our webhook bot to use this server.
  bot: Bot,

  PORT: number,
  path: string,
  onUpdate: Function,
  apiErrorHandler: Function
) =>
  http
    .createServer(
      // Using arrow function to keep `this` binding of startServer function
      async (req, res): Promise<any> => {
        try {
          // Only handle update if both path and method matches exactly
          if (req.url === path && req.method === "POST") {
            // Get the POST request body, which is an Update object
            const update = await new Promise((resolve, reject) => {
              const chunks: Array<Uint8Array> = [];
              req
                .on("data", (chunk) => chunks.push(chunk))
                .on("end", () =>
                  resolve(JSON.parse(Buffer.concat(chunks).toString()))
                )
                .on("error", reject);
            });

            // Unlike getUpdates telegram API
            // 1. Every webhook invocation / HTTP POST message coming in, will only receive ONE update at a time
            //    Although telegram can make multiple simultaneous POST requests to your bot, each request only ONE update object
            //    This is why update object is put in an array, since onUpdate always expects an array of update(s)
            // 2. This is not a response so there is no 'ok' field in the request body from telegram
            //
            // References:
            // https://core.telegram.org/bots/webhooks#testing-your-bot-with-updates
            // https://core.telegram.org/bots/api#setwebhook
            // https://core.telegram.org/bots/api#getupdates
            await onUpdate.call(bot, [update]);

            // Set header to indicate response type as JSON
            // res.setHeader("Content-Type", "application/json");
            res.writeHead(200);
            res.end();
          } else {
            // If route is invalid, we assume it is not telegram that called our API
            // Thus return 404 and dont respond to any updates sent
            res.writeHead(404);
            res.end();
          }
        } catch (error) {
          console.error(error);

          // actual error handler instead of the normal api error handler
          apiErrorHandler(error);

          // Close the connection
          res.writeHead(500);
          res.end();
        }
      }
    )
    .listen(PORT, () =>
      console.log(`Webhook server running on localhost:${PORT}`)
    );
