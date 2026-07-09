/**
 * @typedef {{
 *  _: String[],
 *  help: Boolean,
 * }} MyFlags
 */

/**
 * @param {NS} ns - Netscript context.
 * @returns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
    ]));

    if (flags._.length === 0 || flags.help) {
        ns.tprint(`Usage: run ${ns.getScriptName()} <.lit FILENAME> --help <BOOLEAN>`); 
        return;
    }
    const fileName = String(flags._[0]);

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    ns.print(ns.read(fileName));
}