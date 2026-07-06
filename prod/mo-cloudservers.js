/**
 * @typedef {{ serverNamePrefix: String, sleepTime: Number, help: Boolean }} MyFlags
 */

//
// Global constants
//

// I use this as an "enum" for logging purposes so that I can get
// colored output.
const LOG_LEVEL = Object.freeze({
    "ERROR": "ERROR: ",
    "SUCCESS": "SUCCESS: ",
    "INFO": "INFO: ", 
    "WARN": "WARN: ",
    "DEBUG": "DEBUG: ",
});

// The different amount of RAM you can have on a cloud purchased server. We are
// ignoring the 2GB and 4GB alternatives as almost all scripts will be bigger than this.
const ramTiers = [
    8, 16, 32, 64, 128, 256, 512,
    1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144,
    524288, 1048576,
];

/**
 * @param {NS} ns 
 */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["serverNamePrefix", "Vogon-"],
        ["sleepTime", 1000],
        ["help", false],
    ]));

    if (flags.help) {
        ns.tprint(LOG_LEVEL.INFO + `Usage: run ${ns.getScriptName()} --serverNamePrefix <PREFIX> --sleepTime <TIME>`);
        ns.tprint(LOG_LEVEL.INFO + "\t--serverNamePrefix -> Optional and defaults to Vogon-");
        ns.tprint(LOG_LEVEL.INFO + "\t--sleepTime -> Optional and defaults to 1000 equalling 1 second.");
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
            for (const ramTier of ramTiers) {
                const cost = ns.cloud.getServerCost(ramTier);
                if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                    const hostName = flags.serverNamePrefix + boughtServers.length;
                    //const hostName = serverNamePrefix + boughtServers.length;
                    ns.cloud.purchaseServer(hostName, ramTier);
                    ns.print(
                        LOG_LEVEL.INFO +
                        `Bought new server ${hostName} with ${ramTier}GB`
                    );
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
            const nextRamTier = ramTiers.find(r => r > ramTier);

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
                ns.print(
                    LOG_LEVEL.INFO +
                    `Upgraded RAM on ${smallest} from ${ramTier}GB to ${nextRamTier}GB`
                );
            }
        }
        await ns.sleep(flags.sleepTime);
    }
    ns.tprint(LOG_LEVEL.INFO + "All purchased servers are maxed out. Exiting script.");
}