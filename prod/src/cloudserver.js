import { Logger } from "./logger";


/**
 * A class to help with the cloud servers.
 * 
 * @example const cloudServer = new CloudServers(ns);
 * @example const cloudServers = new CloudServers(ns, "SomeCoolName-");
 */
export class CloudServers {
    /**
     * @param {NS} ns             - Netscript context
     * @param {string} namePrefix - The name of the cloud servers with numbering postfixed to it.
     * @example const cloudServers = new CloudServers(ns);
     * @example const cloudServers = new CloudServers(ns, "SomeCoolName-");
     */
    constructor (ns, namePrefix = "Vogon-1") {
        this.ns = ns;
        this.namePrefix = namePrefix;
        // The different amount of RAM you can have on a cloud purchased server. We are
        // ignoring the 2GB and 4GB alternatives as almost all scripts will be bigger than this.
        this.ramTiers = [
            8, 16, 32, 64, 128, 256, 512,
            1024, 2048, 4096, 8192, 16384,
            32768, 65536, 131072, 262144,
            524288, 1048576,
        ];
        this.maxServers = ns.cloud.getServerLimit();
        this.logger = new Logger(ns);
    }

    /**
     * Buys the smallest cloud server providing there is enough money in the
     * bank.
     */
    buyServer() {
        // When buying, we allways buy the smallest.
        const cost = this.ns.cloud.getServerCost(this.ramTiers[0]);
        if (this.ns.getServerMoneyAvailable(this.ns.getHostname()) > cost) {
            const hostName = this.namePrefix + this.ns.cloud.getServerNames().length;
            this.ns.cloud.purchaseServer(hostName, this.ramTiers[0]);
            this.logger.write(this.logger.INFO, `Bought new server ${hostName} with ${ramTier}GB`);
        }
    }

    /**
     * Returns true, if you are still able to buy more servers, else false.
     * 
     * @returns {boolean}
     */
    canBuyMoreServers() {
        if (this.ns.cloud.getServerNames().length < this.maxServers) {
            return true;
        }
        return false;
    }

    /**
     * This bit of the code handles getting all the bought servers
     * which does not show in the normal scans.
     * 
     * @returns {String[]} - List of cloudserver names we have bought
     */
    getServerHostNames() {
        const hostNames = [];

        let i = 0;
        while (this.ns.serverExists(this.namePrefix + i)) {
            hostNames.push(this.namePrefix + i);
            i++;
        }
        return hostNames;
    }

    /**
     * Upgrades the host matching hostName if there is a next tier
     * 
     * @param {string} hostName - The host name of the cloud server to upgrade
     */
    upgradeServer(hostName) {
        // Checking if there is a next tier
        const ramTier = this.ns.getServerMaxRam(hostName);
        const nextRamTier = this.ramTiers.find(r => r > ramTier);

        // If theres no next tier on the smallest cloud server,
        // then this script is done with its job.
        // We could compare ramTier with ns.getRamLimit() also, but
        // I don't see a reason for doing this since I allready
        // have the same end result with nextRamTier.
        if (!nextRamTier) return 0;

        // We check the cost of the next tier, and if we can afford it, we upgrade the server.
        const cost = this.ns.cloud.getServerUpgradeCost(hostName, nextRamTier);
        if (this.ns.getServerMoneyAvailable(this.ns.getHostname()) > cost) {
            this.ns.cloud.upgradeServer(hostName, nextRamTier);
            this.logger.write(this.logger.INFO, `Upgraded RAM on ${hostName} from ${ramTier}GB to ${nextRamTier}GB`);
        }
    }
}