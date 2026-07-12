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

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    const cloudServers = new CloudServers(ns);
    const logger = new Logger(ns);

    if (flags.help) {
        logger.info(`Usage: run ${ns.getScriptName()} --sleepTime <TIME>`);
        logger.info("\t--sleepTime -> Optional and defaults to 1000 equalling 1 second.");
        return;
    }

    while (true) {
        if (cloudServers.canBuyMoreServers()) {
            cloudServers.buyServer();
        } else {
            // Find the server with the least amount of RAM installed.
            const boughtServers = cloudServers.getServerNames();
            let smallest = boughtServers[0];
            for (const host of boughtServers) {
                if (ns.getServerMaxRam(host) < ns.getServerMaxRam(smallest)) smallest = host;
            }
            if (!cloudServers.upgradeServer(smallest)) {
                break;
            }
        }
        await ns.sleep(flags.sleepTime);
    }
    logger.info("All purchased servers are maxed out. Exiting script.");
}