# yatbl (Yet Another Telegram Bot Library)
***Core tenets of this library:***
- Simple
- Intuitive
- Fast
- Extensible


## Introduction
Building telegram bots should be fun simple and easy, which is what all libraries advertise. Which is true... until, you start to build more complex bots. Too often, the bot library/framework gets in your way either because it is too opinionated or just have too many design restrictions. Libraries should help you achieve your goals and if you feel like you are fighting your library too often, this might be the change that you are looking for.  

The aim of this library is just to be a thin wrapper around the actualy telegram API so that you can go FAST and BIG without needing to setup the bare basics.  

This library provides 3 types of functionalities:
1. A super simple wrapper around the telegram API exposed to you so that you can focus on building your applications and logic the way you want it to be, and have full control over communications with telegram servers.
2. Optional, shorthand methods that can be imported seperately and attached to core service to provide some basic operations like "reply_to_message", if you dont want to always deal with the raw update object and "tapi" method
3. A open API for you to create custom shorthands as plugins for you to use throughout your bot.


## More details
- Note that this library primarily target the intermediate to advanced usecases where you need more flexibility and control, thus this can actually be more complex to use in a simple bot project.
- How does this library strives to achieve the "Simple" tenet
    - No frills... literally... to even have shorthand methods, you need to load them in yourself. By default the core library is really really tiny and simple to use.
- How does this library strives to achieve the "Intuitive" tenet
    - By not assuming things and relying on telegram's API design so that the user is not confused and mislead by the library.
- How does this library strives to achieve the "Fast" tenet
    - By keeping things simple and minimalistic, relying on the default telegram API whenever complexity arises instead of building around it to provide some feature to the user that may be never used
    - Keeping all shorthands optional, and requiring the user to load them into the Core service if needed
    - By relying on native APIs whenever possible and using as little external dependencies as possible.


## Using this library
- Refer to the sample codes [here](./samples)
- Samples included:
    - Simple Echo Bot


## Additional technical details
- Callback functions for new updates have a custom "this" binded to them for you to access shorthand methods, and to pass data along to the next update handler by binding data onto "this"
    - IF you would like to access the injected "this", all update handler callback functions must be declared with the "function" keyword and cannot be arrow functions for proper this binding.
    - You can add properties to "this" to access it in the next handler callback in the stack using a middleware pattern to handler updates
- Add try/catch blocks into your own handlers, if there are any uncaught errors, all other update handlers will not run for the current update.
- Writing your own shorthand methods
    - Short hand functions must always always return an object, as they will be "spread" using es6 spread syntax to merge all the shorthand functions into 1 "this" object to bind to the user.
    - The other reason it needs to be an object is because we want to keep the key of the shorthand the same.
    - You can attach anything you like as a shorthand method, from custom data fields, to methods that wrap over the telegram API
    - Short hand creation methods recieve "update" object (exact update object from telegram API servers like [this](https://core.telegram.org/bots/api#update)) and "tapi" (same instance as the one the bot uses) to create your shorthand methods.
    - Shorthand generator methods should be asynchronous and they should also not be blocking
        - This is because update handlers are only called after all shorthand methods have been generated
- Update handlers can be asynchronous, but are not recommended to
    - This is because update handlers are awaited for and called one after the other
    - So if one of the handlers take really long to complete, the overall response will take extra long. Thus it is recommended to keep your update handlers as synchronous functions that call async methods without any awaits and let them complete in the background.
        - An example would be responding to a message using "tapi", where tapi is async.
        - The update handler should be synchronous and call tapi without awaiting for it, letting tapi run off in the background.


## Development
- Note that this library is still under development and is not stable for production.
- This library uses common JS for modules


## License, Author and Contributing
This project is developed and made available under the "MIT" License  
Pull requests are welcomed and open a issue if you have any questions!  
If you more questions, contact us via [email](mailto:developer@enkeldigital.com)  
Authors:
- [JJ](https://github.com/Jaimeloeuf)