import { Logger } from "./logger";
import { Payloads } from "./payloads";
import { MyPlayer } from "./player";
import { Server } from "./server";

import { 
    getHackingServerHostNames,
    getHostsThatCanBeHacked,
    getNetworkHostNames,
    hackHosts,
} from "./utility";

/**
 * A class to control the batching of hacks on machines in the cluster.
 * 
 * @example const controller = new Constroller(ns);
 * @example const controller = new Constroller(ns, .01);
 */
export class Controller {
    #debug;
    #logger;
    #ns;

    /**
     * @param {NS} ns                      - Netscript context
     * @param {number} [hackPercentage=.1] - How much of the total money on a host we should hack per batch.
     * @param {boolean} [debug=false]      - Writes extra debug info to logging window if true
     * @example const controller = new Controller(ns, .01);
     */
    constructor (ns, debug = false, hackPercentage = .1) {
        this.#debug = debug;
        this.#logger = new Logger(ns);
        this.#ns = ns;

        this.hackPercentage = hackPercentage;
        this.payloads = new Payloads(ns);
        this.player = new MyPlayer(ns);
    }

    /**
     * Creates processes/threads distributed over the servers given in the list
     * of hosts.
     * 
     * @param {Server[]} servers     - List of servers we can distribute the threads over
     * @param {string} fileName      - The payload to attack with
     * @param {number} threadsNeeded - The number of threads to spawn
     * @param {string} targetHost    - The host to target our threads on
     * @param {number} delayTime     - The time to delay the thread in millisecond
     */
    async #distributeThreads(servers, fileName, threadsNeeded, targetHost, delayTime) {
        if (threadsNeeded <= 0) return;

        for (const server of servers) {
            const freeRam = server.getAvailableRam();
            const scriptRam = this.payloads.getRamRequirements(fileName);

            const maxThreads = Math.floor(freeRam / scriptRam);
            if (maxThreads <= 0) continue;

            const threads = Math.min(maxThreads, threadsNeeded);

            this.#ns.exec(fileName, server.hostName, threads, targetHost, 0);
            threadsNeeded -= threads;

            if (threadsNeeded <= 0) break;
        }
    }

    /**
     * Prepares the host given as an argument. Meanining it will make sure the
     * host has the most amount of money it can have, and also the least amount
     * of security it can have.
     * 
     * @param {string} targetHostName 
     * @returns
     */
    async distributedPrepare(targetHostName) {
        this.#logger.info(`Starting to prepare the target host (${targetHostName}) for batching.`);
        while (true) {
            const servers = this.getUsableHosts();

            // Check if the host still needs more prepping.
            const targetServer = new Server(this.#ns, targetHostName);
            const weakenStatus = targetServer.getWeakenStatus();
            const growStatus = targetServer.getGrowStatus();

            if (weakenStatus <= 0 && growStatus <= 0) {
                if (this.#debug) this.#logger.debug(`W: ${weakenStatus}, G: ${growStatus}`);
                this.#logger.info(`Done with preparing the target host (${targetServer}).`);
                return
            }

            // We figure out the weaken stuff
            const weakenThreads = weakenStatus > 0
                ? Math.ceil(weakenStatus / this.#ns.weakenAnalyze(1))
                : 0;

            // We figure out the grow stuff
            const moneyMax = targetServer.stats.moneyMax === undefined
                ? 0
                : targetServer.stats.moneyMax;
            const moneyAvailable = targetServer.stats.moneyAvailable === undefined
                ? 0
                : targetServer.stats.moneyAvailable;
            const growThreads = growStatus > 0
                ? Math.ceil(this.#ns.growthAnalyze(targetServer.hostName, moneyMax / Math.max(moneyAvailable, 1)))
                : 0;

            // Distribute work across workers
            await this.#distributeThreads(servers, this.payloads.weakenFileNameFull, weakenThreads, targetServer.hostName, 0);
            await this.#distributeThreads(servers, this.payloads.growFileNameFull, growThreads, targetServer.hostName, 0);

            // Wait for the longest operation to finish
            const waitTime = Math.max(
                this.#ns.getWeakenTime(targetServer.hostName),
                this.#ns.getGrowTime(targetServer.hostName)
            );
        await this.#ns.sleep(waitTime + 50);
        } 
    }

    /**
     * Returns a list og hosts which has more than 0GB RAM and that has been Nuked.
     * 
     * @returns {Server[]} - A list of host names corresponding to hosts which has more than 0GB RAM and that has been Nuked.
     */
    getUsableHosts() {
        const hostNames = getNetworkHostNames(this.#ns).map(h => new Server(this.#ns, h));
        const hackingHostNames = getHackingServerHostNames(this.#ns, hostNames);
        return hackingHostNames;
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

    /**
     * Runs the controller and starts making money.
     * 
     * @param {string | undefined} target - If given, overrides the automatich choosing of which host to attack.
     */
    async run(target = undefined) {
        // Hack all the hosts which has not been hacked yet and that we are able to hack.
        const allHosts = getNetworkHostNames(this.#ns).map(h => new Server(this.#ns, h));
        const hostsThatCanBeHacked = getHostsThatCanBeHacked(this.#ns, allHosts);
        const hostsNotHacked = hostsThatCanBeHacked.filter(host => !this.#ns.hasRootAccess(host.hostName));
        if (hostsNotHacked.length > 0) hackHosts(this.#ns, hostsNotHacked);
        if (this.#debug) this.#logger.debug(`Number of hosts hacked and nuked: ${hostsNotHacked.length}`);

        // Chose an initial target host and prepare it.
        let targetHost = target
            ? new Server(this.#ns, target)
            : new Server(this.#ns, this.player.getBestHostToAttack());
        this.#logger.info(`Starting process of attacking ${targetHost.hostName}`);
        await this.distributedPrepare(targetHost.hostName);
        this.#ns.exit();

        while (true) {
            // Hack all the hosts which has not been hacked yet and that we are able to hack.
            const allHosts = getNetworkHostNames(this.#ns).map(h => new Server(this.#ns, h));
            const hostsThatCanBeHacked = getHostsThatCanBeHacked(this.#ns, allHosts);
            const hostsNotHacked = hostsThatCanBeHacked.filter(host => !this.#ns.hasRootAccess(host.hostName));
            if (hostsNotHacked.length > 0) hackHosts(this.#ns, hostsNotHacked);
            this.#logger.info(`Hosts not hacked: ${hostsNotHacked}`);

            if (!target) {
                // Check if we need to switch to a new host and prepare the host if we do.
                const newTargetHost = new Server(this.#ns, this.player.getBestHostToAttack());
                // We override this if we have set a host name to target as an argument.
                if (newTargetHost.hostName != targetHost.hostName) {
                    targetHost = newTargetHost;
                    this.#logger.info(`New optimal host to attack found ${targetHost.hostName}.`);
                    // Prepare the host, so we can get the required information to enable us to do batching.
                    await this.distributedPrepare(targetHost.hostName);
                }
            }

            // Find a host that has enough RAM free to run a batch.
            const hackingHosts = this.getUsableHosts();
            this.#logger.info(`Hacking hosts length: ${hackingHosts}`);
            const threads = targetHost.getHackThreads(this.hackPercentage);
            this.#logger.info(`Threads: ${threads}`);
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
            this.#logger.info(`Target batching host: ${batchTargethost}`);

            if (batchTargethost) {
                const delays = this.player.getDelay(targetHost.hostName);

                const hackPid = this.#ns.exec(this.payloads.hackFileNameFull, batchTargethost.hostName, threads.hack, targetHost.hostName, delays.hack);
                const hackWeakenPid = this.#ns.exec(this.payloads.weakenFileNameFull, batchTargethost.hostName, threads.weakenHack, targetHost.hostName, delays.weakenHack);
                const growPid = this.#ns.exec(this.payloads.growFileNameFull, batchTargethost.hostName, threads.grow, targetHost.hostName, delays.grow);
                const growWeakenPid = this.#ns.exec(this.payloads.weakenFileNameFull, batchTargethost.hostName, threads.weakenGrow, targetHost.hostName, delays.weakenGrow);

                if (hackPid == 0 || hackWeakenPid == 0 || growPid == 0 || growWeakenPid == 0) {
                    this.#ns.alert("Failed to start the individual batch file hack/weaken/grow/weaken maybe to RAM")
                    this.#ns.exit()
                }
            }
            await this.#ns.sleep(50);
        }
    }
}