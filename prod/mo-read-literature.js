/**
 * @param {NS} ns
 */
export async function main(ns) {
  const fileName = ns.args[0] ? String(ns.args[0]) : "";
  if (fileName) {
    ns.tprint(ns.read(fileName));
  } else {
    ns.tprint("Usage: run mo-read-literature.js <.lit filename>"); 
  }
}