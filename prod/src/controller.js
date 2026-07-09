import { Logger } from "./logger";
import { Payloads } from "./payloads";
import { Server } from "./server";

import { getHackingServerHostNames, getNetworkHostNames } from "./utility";

/**
 * A class to control the batching of hacks on machines in the cluster.
 * 
 * @example const controller = new Constroller(ns);
 */
export class Controller {
    /**
     * @param {NS} ns - Netscript context
     * @example const controller = new Controller(ns);
     */
    constructor (ns) {
        this.ns = ns;
        this.logger = new Logger(ns);
        this.payloads = new Payloads(ns);
    }

    /**
     * Returns a list og hosts which has more than 0GB RAM and that has been Nuked.
     * 
     * @returns {Server[]} - A list of host names corresponding to hosts which has more than 0GB RAM and that has been Nuked.
     */
    getUsableHosts() {
        const hosts = getNetworkHostNames(this.ns);
        const hackingHostNames = getHackingServerHostNames(this.ns, hosts);
        const hackingHosts = hackingHostNames.map(hostName => new Server(this.ns, hostName));

        return hackingHosts;
    }

    async run() {
        while (true) {
            const hosts = this.getUsableHosts();
            this.logger.write(this.logger.INFO, `${hosts.toString()}`);

            await this.ns.sleep(500);
        }
    }
}