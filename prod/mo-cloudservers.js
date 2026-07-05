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
// ignoring the 2GB alternative as almost all scripts will be bigger than this.
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
    const serverNamePrefix = ns.args[0] ? String(ns.args[0]) : "Vogon-";
    const sleepTime = ns.args[1] ? Number(ns.args[1]) : 10000;

    ns.ui.openTail();

    ns.print(LOG_LEVEL.INFO + "Note that you can override default settings.");
    ns.print(LOG_LEVEL.INFO + `Usage: run ${ns.getScriptName()} <SERVER NAME PREFIX> <SLEEP TIME>`);
    ns.print(LOG_LEVEL.INFO + "\t<SERVER NAME PREFIX:");
    ns.print(LOG_LEVEL.INFO + "\t  Is optional and defaults to Vogon-");
    ns.print(LOG_LEVEL.INFO + "\t<SLEEP TIME>:");
    ns.print(LOG_LEVEL.INFO + "\t  Is optional and defaults to 10000 equalling 10 seconds.");
    ns.print(LOG_LEVEL.INFO + "");

    const maxServers = ns.cloud.getServerLimit();
    while (true) {
        const boughtServers = ns.cloud.getServerNames();
        // We have less than maxServer amount of cloud servers, let buy
        // som more.
        if (boughtServers.length < maxServers) {
            for (const ramTier of ramTiers) {
                const cost = ns.cloud.getServerCost(ramTier);
                if (ns.getServerMoneyAvailable(ns.getHostname()) > cost) {
                    const hostName = serverNamePrefix + boughtServers.length;
                    ns.cloud.purchaseServer(hostName, ramTier);
                    ns.print(
                        LOG_LEVEL.SUCCESS +
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
                    LOG_LEVEL.SUCCESS +
                    `Upgraded RAM on ${smallest} from ${ramTier}GB to ${nextRamTier}GB`
                );
            }
        }
        await ns.sleep(sleepTime);
    }
    ns.tprint(LOG_LEVEL.INFO + "All purchased servers are maxed out. Exiting script.");
}