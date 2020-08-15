/**
 * Simple wrapper over tapi for use as a,
 * Non update handler based ShortHand for setting bot commands
 * @param {*} tapi
 * @param {Array<object>} [commands=[]] Array of Bot commands objects (https://core.telegram.org/bots/api#botcommand) leave it empty to clear all commands
 * @param {object} [options={ merge: true }] Options, merge is default to true, where new commands is appended to existing commands rather than overwriting existing commands
 * @returns {object} Refer to https://core.telegram.org/bots/api#setmycommands
 */
async function setCommands(tapi, commands = [], options = { merge: true }) {
  // Merge existing commands and new commands into new array before setting commands if user did not leave commands empty
  if (commands.length && options.merge) {
    const response = await tapi("getMyCommands");
    if (response.ok) commands = [...response.result, ...commands];
    else throw new Error("Failed to get existing commands");
  }

  return tapi("setMyCommands", { commands });
}

module.exports = setCommands;
