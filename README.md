# yatbl (Yet Another Telegram Bot Library)
***Core tenets of this library:***
- Simple & Intuitive
- Fast
- Extensible


## Introduction
Building telegram bots should be fun, simple and easy, which is what all libraries advertise. Which is true... until, you start to build more complex bots.  
Too often, the bot library/framework gets in your way either because it is too opinionated or just have too many design restrictions caused by design patterns or over the top abstractions.  
Libraries should help you achieve your goals and if you feel like you are fighting your library too often, this might be the change that you are looking for.  

The aim of this library is just to be a SUPER thin wrapper around the actualy telegram API so that you can go FAST and BIG without needing to setup the bare basics (like creating the base API url using your bot token or setting up a polling mechanism).  

This library provides 3 core functionalities:
1. A super simple wrapper around the telegram API exposed to you so that you can focus on building your applications and logic the way you want it to be, and have full control over communications with telegram servers.
2. Optional, shorthand methods that can be imported seperately and attached to core service to provide some basic operations like "reply_to_message", if you dont want to always deal with the raw update object and "tapi" method
3. A open API for you to create custom shorthands as plugins for you to use throughout your bot.


## More details
- Note that this library primarily target the intermediate to advanced usecases where you need more flexibility and control, thus this can actually be more complex to use in a simple bot project due to the lower level of abstraction.
- How does this library strives to achieve the "Simple" tenet
    - No frills... literally... to even have shorthand methods, you need to load them in yourself. By default the core library is really really tiny and simple to use.
- How does this library strives to achieve the "Intuitive" tenet
    - By not assuming things and relying on telegram's API design so that the user is not confused and mislead by the library.
    - Users should just learn the telegram API ONLY, and not have to also learn the library's API.
    - Think of this library as a simple utility wrapper for the official telegram API.
- How does this library strives to achieve the "Fast" tenet
    - By keeping things simple and minimalistic, relying on the default telegram API whenever complexity arises instead of building around it to provide some feature to the user that may be never used
    - Keeping all shorthands optional, and requiring the user to load them into the Core service if needed
    - By relying on native APIs whenever possible and using as little external dependencies as possible.


## Development
- Note that this library is still under development and although it has been used in certain products, use it in production at your own risk.
- This library uses common JS for modules


## Using this library
- Refer to the sample codes [here](./samples)
- Samples included:
    - [Simple Echo Bot](<./samples/simple echo bot.js>)
    - [Bot that only responds to messages of a single type (photos)](<./samples/single message type (photo).js>)
    - [Bot that can store user's unique chat ID to reuse later](<./samples/save user's chat_id to reply later.js>)
    - [Simple sample on how to write a shortHand method/plugin](<./samples/simple replyMessage shortHand.js>)
        - This is a shortHand that users can use to reply to a message directly per update without needing to get the chat_id from update object before sending that chat_id a message
    - [Reading and setting bot commands](<./samples/setting and reading bot commands.js>)
        - Sample to showcase how to read the existing bot commands and set new ones using a default shortHand

## ShortHands
This library provides a plugin system that users can use to simplify their development experience with reusable plugins.  
ShortHands are basically plugins, that are methods to abstract over common functionality.  
This library will:
- Help to bind each update object and a tapi utility method to every shortHand method for them to build abstractions
- Attach these methods onto the "this" context of every update handler for easy access by the library and shortHand method user

## Additional technical details
- Callback functions for new updates have a custom "this" binded to them for you to access shorthand methods, and to pass data along to the next update handler by binding data onto "this"
    - IF you would like to access the injected "this", all update handler callback functions must be declared with the "function" keyword and cannot be arrow functions for proper "this" binding.
    - You can add properties to "this" to access it in the next handler callback in the stack using a middleware pattern to handle updates
- ** Add try/catch blocks into your own handlers, if there are any uncaught errors, all other update handlers will not run for the current update.
- Writing your own shorthand functions
    - Refer to this [simple sample on how to write a shortHand method/plugin](<./samples/simple replyMessage shortHand.js>)
    - Note that the name of your shortHand function will be used as the key of the "this" object binded to updateHandlers
        - Specifically ShortHand functions are attached to the context object using Function.name and Function.bind
        - ***IMPORTANT NOTE*** Due to the way the shortHand functions are attached, it is recommended TO NOT USE any bundler/minification/uglier build tools or build steps, as they may alter the function name. IF YOU MUST, please inform your users to rename the shortHand function before use. Refer to the documentation on renaming shortHand functions
    - You can attach anything you like as a shorthand method, from custom data fields, to methods that wrap over the telegram API
    - A new binded copy of the shortHand function is created for EVERY single update
        - This means that your shortHand functions should be performant, else it will slow down the bot
    - The reason why a new copy of the shortHand function is created for every single update is because, Short hand creation functions have the "update" object [from telegram servers](https://core.telegram.org/bots/api#update) and a utility "tapi" method (same instance as the one the bot uses) binded to their "this" context to create your shorthand function.
        - Thus a new one is needed for every unique update object
<!-- - Update handlers can be asynchronous, but are not recommended to
    - This is because update handlers are awaited for and called one after the other
    - So if one of the handlers take really long to complete, the overall response will take extra long. Thus it is recommended to keep your update handlers as synchronous functions that call async methods without any awaits and let them complete in the background.
        - An example would be responding to a message using "tapi", where tapi is async.
        - The update handler should be synchronous and call tapi without awaiting for it, letting tapi run off in the background. -->
- Bot/PollingBot/WebhookBot classes and their structure:
    - The core Bot functionalities are all implemented in the Bot class
    - The PollingBot and WebhookBot are classes that extends the base Bot class with polling and webhook functionality
    - This is done for modularity, readability and bug containment
    - By having core functionalities in the Bot, advance users can choose to, if they want, to implement polling and webhook functionality on their OWN, and just using the Bot class for the update handler calling and shortHand plugin architecture


## Handling load spikes
1. Polling method, use back pressure and slow down polling by tracking the num of updates being handled currently
    - Use this if it is ok, if the average bot reponse time goes up to ensure uniform resource usage
2. Webhook method, use serverless architecture to scale if you want to keep avrg bot response time uniform and low without regard for resource usage.
    - This solution simply increase the number of instances of bot update handlers
        - Using this method, these functions should only run the bot update handler code instead of the main server.
        - WIP tutorial and sample bot on how to do this.
    - Scales better in most cases with serverless functions instead of serverless CaaS solutions since using functions the provider handles the http request routing for you already and you do not need to handle it yourself



## License, Author and Contributing
This project is developed and made available under the "MIT" License  
Pull requests are welcomed and open a issue if you have any questions!  
If you more questions, contact us via [email](mailto:developer@enkeldigital.com)  
Authors:
- [JJ](https://github.com/Jaimeloeuf)