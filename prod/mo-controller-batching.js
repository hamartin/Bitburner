import { Controller } from "./src/controller";
import { Logger } from "./src/logger";


/**
 * @typedef {{
 *     help: Boolean,
 *     _: String
 * }} MyFlags
 */

/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns - Netscript context
 * @example run mo-controller-batching.js
 * @example run mo-controller-batching.js n00dles
 * @example run mo-controller-batching.js --help
 * @returns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
    ]));
    const targetHost = flags._[0];

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const logger = new Logger(ns);
    const controller = new Controller(ns);

    if (flags.help) {
        logger.info(`Usage: run ${ns.getScriptName()} <TARGET HOST | Optional> --help`)
        logger.info("\t<TARGET HOST> is optional. With it, no automatic target picking is done,");
        logger.info("\t              without it, the controller chooses the target itself.")
        logger.info("\t--help -> Shows this message.");
        return;
    }
    await controller.run(targetHost);
}