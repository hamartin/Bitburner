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
}