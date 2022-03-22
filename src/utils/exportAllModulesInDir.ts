/**
 * Loads all JS modules in a given directory before returning them for export via index.js of that dir
 * This should be used in the index.js file of a directory --> ```module.exports = require("exportAllModulesInDir")(__dirname);```
 * @param {String} [dirname=__dirname] Base directory to export files from
 * @return {object} Returns an object with all the individual module exports in that directory
 *
 * @todo Should not import itself
 */
export default function exportAllModulesInDir(
  dirname: string = __dirname
  // @todo Support list of files to ignore
  // ignore = []
): object {
  const files = require("fs").readdirSync(dirname);
  const moduleList: { [s: string]: any } = {};
  const jsExt = /.js$/i;

  // console.log("files", files);

  // Loop over every JS file that is not index.js to require it onto the moduleList object
  for (const filename of files)
    if (jsExt.test(filename) && filename !== "index.js") {
      // Remove the extension when attaching to the object
      const filenameWoExt: string = filename.slice(0, filename.length - 3);
      moduleList[filenameWoExt] = require(dirname + "/" + filenameWoExt);
    }

  // console.log(moduleList);

  return moduleList;
}
