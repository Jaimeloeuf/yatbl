/**
 * Simple async/await wrapper over setTimeout
 * @param {number} timeout Time in milliseconds to sleep for
 */
export default async (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));
