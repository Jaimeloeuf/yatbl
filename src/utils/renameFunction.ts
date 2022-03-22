/**
 * Simple utility function to rename functions by generating a PLAIN wrapper function over the original
 * Reference: https://stackoverflow.com/questions/5905492/dynamic-function-name-in-javascript
 *
 * Create a new Object with a single property, where name is the given new name.
 * Make that property a function that simply wraps around the original function,
 * then use Object access syntax to grab that function out and return to the caller.
 *
 * @param {String} newName Name to rename the function to
 * @param {Function} fn The original function
 */
export default (newName: string, fn: Function) =>
  ({
    // Use the dynamic string parameter as the property name, which is also the function name
    // Need to use a regular function instead of arrow function to access the arguments variable
    [newName]() {
      return fn(...arguments);
    },
  }[newName]);
