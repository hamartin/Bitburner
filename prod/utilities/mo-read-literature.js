/**
 * @typedef {{
 *  _: (String | Number | Boolean)[],
 *  help: Boolean,
 * }} MyFlags
 */

/**
 * @param {NS} ns
 * @returns
 */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
    ]));
    const fileName = String(flags._[0]);

    if (fileName == "undefined" || flags.help) {
        ns.tprint(`Usage: run ${ns.getScriptName()} <.lit FILENAME> --help <BOOLEAN>`); 
        return;
    }

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    ns.print(ns.read(fileName));
}