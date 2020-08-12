/**
 * Simple utility function to rename functions by generating a PLAIN wrapper function over the original
 * Reference: https://stackoverflow.com/questions/5905492/dynamic-function-name-in-javascript
 * @param {String} newName Name to rename the function to
 * @param {Function} fn The original function
 */
module.exports = function renameFunction(newName, fn) {
  return {
    [newName]() {
      return fn(...arguments);
    },
  }[newName];
};
