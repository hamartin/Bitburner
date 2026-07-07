import {
    CLOUDSERVER_NAME_PREFIX,
    LOG_LEVEL,
    RAM_TIERS,
} from "./src/constants.js";
import { LogMessage } from "./src/logging.js";

/**
 * @typedef {{ sleepTime: Number, help: Boolean }} MyFlags
 */

/** @param {NS} ns */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["sleepTime", 1000],
        ["help", false],
    ]));

    if (flags.help) {
        LogMessage(ns, LOG_LEVEL.INFO, `Usage: run ${ns.getScriptName()} --sleepTime <TIME>`);
        LogMessage(ns, LOG_LEVEL.INFO, "\t--sleepTime -> Optional and defaults to 1000 equalling 1 second.");
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
            for (const ramTier of RAM_TIERS) {
                const cost = ns.cloud.getServerCost(ramTier);
                if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                    const hostName = CLOUDSERVER_NAME_PREFIX + boughtServers.length;
                    ns.cloud.purchaseServer(hostName, ramTier);
                    LogMessage(ns, LOG_LEVEL.INFO, `Bought new server ${hostName} with ${ramTier}GB`);
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
            const nextRamTier = RAM_TIERS.find(r => r > ramTier);

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
                LogMessage(ns, LOG_LEVEL.INFO, `Upgraded RAM on ${smallest} from ${ramTier}GB to ${nextRamTier}GB`);
            }
        }
        await ns.sleep(flags.sleepTime);
    }
    LogMessage(ns, LOG_LEVEL.INFO, "All purchased servers are maxed out. Exiting script.");
}