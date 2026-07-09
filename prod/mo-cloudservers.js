import { CloudServers } from "./src/classes/cloudserver";
import { Logger } from "./src/classes/logger";


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

    const maxServers = ns.cloud.getServerLimit();
    while (true) {
        const boughtServers = ns.cloud.getServerNames();
        // We have less than maxServer amount of cloud servers, let buy
        // som more.
        if (boughtServers.length < maxServers) {
            for (const ramTier of cloudServers.ramTiers) {
                const cost = ns.cloud.getServerCost(ramTier);
                if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                    const hostName = cloudServers.namePrefix + boughtServers.length;
                    ns.cloud.purchaseServer(hostName, ramTier);
                    logger.write(logger.INFO, `Bought new server ${hostName} with ${ramTier}GB`);
                }
                break;
            } 
        // We have bought as many servers as we can. Now lets upgrade
        // them until they're maxed out.
        } else {
            // Find the server with the least amount of RAM installed.
            let smallest = boughtServers[0];
            for (const host of boughtServers) {
                if (ns.getServerMaxRam(host) < ns.getServerMaxRam(smallest)) smallest = host;
            }

            // Checking if there is a next tier, and if not, we stop the while loop.
            const ramTier = ns.getServerMaxRam(smallest);
            const nextRamTier = cloudServers.ramTiers.find(r => r > ramTier);

            // If theres no next tier on the smallest cloud server,
            // then this script is done with its job.
            // We could compare ramTier with ns.getRamLimit() also, but
            // I don't see a reason for doing this since I allready
            // have the same end result with nextRamTier.
            if (!nextRamTier) break;

            // We check the cost of the next tier, and if we can afford it, we upgrade the server.
            const cost = ns.cloud.getServerUpgradeCost(smallest, nextRamTier);
            if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                ns.cloud.upgradeServer(smallest, nextRamTier);
                logger.write(logger.INFO, `Upgraded RAM on ${smallest} from ${ramTier}GB to ${nextRamTier}GB`);
            }
        }
        await ns.sleep(flags.sleepTime);
    }
    logger.write(logger.INFO, "All purchased servers are maxed out. Exiting script.");
}