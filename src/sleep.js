/**
 * Simple async/await wrapper over setTimeout
 * @param {Number} timeout Time in milliseconds to sleep for
 */
module.exports = async (timeout) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
