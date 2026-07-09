import { CloudServers } from "./src/cloudserver";
import { Logger } from "./src/logger";


/**
 * @typedef {{ sleepTime: Number, help: Boolean }} MyFlags
 */

/** @param {NS} ns */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["sleepTime", 1000],
        ["help", false],
    ]));

    const cloudServers = new CloudServers(ns);
    const logger = new Logger(ns);

    if (flags.help) {
        logger.write(logger.INFO, `Usage: run ${ns.getScriptName()} --sleepTime <TIME>`);
        logger.write(logger.INFO, "\t--sleepTime -> Optional and defaults to 1000 equalling 1 second.");
        return;
    }

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    while (true) {
        if (cloudServers.canBuyMoreServers()) {
            cloudServers.buyServer();
        } else {
            // Find the server with the least amount of RAM installed.
            const boughtServers = ns.cloud.getServerNames();
            let smallest = boughtServers[0];
            for (const host of boughtServers) {
                if (ns.getServerMaxRam(host) < ns.getServerMaxRam(smallest)) smallest = host;
            }
            cloudServers.upgradeServer(smallest);
        }
        await ns.sleep(flags.sleepTime);
    }
    logger.write(logger.INFO, "All purchased servers are maxed out. Exiting script.");
}