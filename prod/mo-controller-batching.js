import { Controller } from "./src/controller";
import { Logger } from "./src/logger";


/**
 * @typedef {{
 *     help: Boolean,
 * }} MyFlags
 */

/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns - Netscript context
 * @returns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
    ]));

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const logger = new Logger(ns);
    const controller = new Controller(ns);

    if (flags.help) {
        logger.write(logger.INFO, `Usage: run ${ns.getScriptName()} <BATCH DELAY> --help`)
        logger.write(logger.INFO, "\t--help -> Shows this message.");
        return;
    }
    await controller.run();
}