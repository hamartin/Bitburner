import { Logger } from "./logger";
import { Payloads } from "./payloads";
import { MyPlayer } from "./player";
import { Server } from "./server";

import { getHackingServerHostNames, getNetworkHostNames } from "./utility";

/**
 * A class to control the batching of hacks on machines in the cluster.
 * 
 * @example const controller = new Constroller(ns);
 * @example const controller = new Constroller(ns, .01);
 */
export class Controller {
    /**
     * @param {NS} ns                      - Netscript context
     * @param {number} [hackPercentage=.1] - How much of the total money on a host we should hack per batch.
     * @example const controller = new Controller(ns, .01);
     */
    constructor (ns, hackPercentage = .1) {
        this.ns = ns;
        this.hackPercentage = hackPercentage;
        this.logger = new Logger(ns);
        this.payloads = new Payloads(ns);
        this.player = new MyPlayer(ns);
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

    /**
     * Iterates over a list of host names and returns a map between host names
     * and the amount of free RAM on that host.
     * 
     * @param {Server[]} hosts - A list of host names to find the mount of free RAM for.
     * @returns {HostRam}      - A mapping between host names and the amount of free RAM on that host.
     */
    getUsableRam(hosts) {
        const ret = new Map();
        for (const host of hosts) {
            ret.set(host.hostName, host.getAvailableRam());
        }
        return ret;
    }

    async run() {
        // Chose an initial target host and prepare it.
        //let targetHost = new Server(this.ns, this.player.getBestHostToAttack());
        let targetHost = new Server(this.ns, "n00dles");
        await targetHost.prepHost();

        while (true) {
            // Check if we need to switch to a new host and prepare the host if we do.
            //const newTargetHost = new Server(this.ns, this.player.getBestHostToAttack());
            const newTargetHost = new Server(this.ns, "n00dles");
            if (newTargetHost.hostName != targetHost.hostName) {
                targetHost = newTargetHost;
                this.logger.write(this.logger.INFO, `New optimal host to attack found ${targetHost.hostName}.`);
                // Prepare the host, so we can get the required information to enable us to do batching.
                await targetHost.prepHost();
            }

            // Find a host that has enough RAM free to run a batch.
            const hackingHosts = this.getUsableHosts();
            const threads = targetHost.getHackThreads(this.hackPercentage);
            let batchTargethost = null;
            for (const host of hackingHosts) {
                // We want the free RAM to be bigger and not equal to give us some space to work within.
                if (!batchTargethost && host.getAvailableRam() > threads.totalRequiredRam) {
                    batchTargethost = host;
                }
                if (batchTargethost && host.getAvailableRam() > batchTargethost.getAvailableRam()) {
                    batchTargethost = host;
                }
            }

            if (batchTargethost) {
                const delays = this.player.getDelay(targetHost.hostName);

                const hackPid = this.ns.exec(this.payloads.hackFileNameFull, batchTargethost.hostName, threads.hack, targetHost.hostName, delays.hack);
                const hackWeakenPid = this.ns.exec(this.payloads.weakenFileNameFull, batchTargethost.hostName, threads.weakenHack, targetHost.hostName, delays.weakenHack);
                const growPid = this.ns.exec(this.payloads.growFileNameFull, batchTargethost.hostName, threads.grow, targetHost.hostName, delays.grow);
                const growWeakenPid = this.ns.exec(this.payloads.weakenFileNameFull, batchTargethost.hostName, threads.weakenGrow, targetHost.hostName, delays.weakenGrow);

                if (hackPid == 0 || hackWeakenPid == 0 || growPid == 0 || growWeakenPid == 0) {
                    this.ns.alert("Failed to start the individual batch file hack/weaken/grow/weaken maybe to RAM")
                    this.ns.exit()
                }
            }

            // test
            await this.ns.sleep(50);
        }
    }
}