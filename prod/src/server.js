import { Logger } from "./logger.js";
import { Payloads } from "./payloads.js";


/**
 * A class to keep track of what is happening on a server.
 * 
 * @example const server = new Server(ns, "n00dles");
 */
export class Server {
    /**
     * @param {NS} ns             - Netscript context
     * @param {string} hostName   - The server host name
     * @example const server = new Server(ns, "n00dles", payloads);
     */
    constructor (ns, hostName) {
        this.ns = ns;
        this.hostName = hostName;
        this.payloads = new Payloads(ns);
        this.logger = new Logger(ns);
        this.stats = ns.getServer(hostName);
    }

    toString() {
        return `${this.hostName}`;
    }

    /**
     * Function which returns the amount of available RAM on the host.
     * 
     * @returns {number}
     */
    getAvailableRam() {
        return this.stats.maxRam - this.stats.ramUsed;
    }

    /**
     * Returns generic information about the host.
     * 
     * @return {ServerStats}
     */
    getCurrentInfo() {
        const money = this.stats.moneyAvailable === undefined
            ? 1
            : this.stats.moneyAvailable;
        const maxMoney = this.stats.moneyMax === undefined
            ? 0
            : this.stats.moneyMax;

        const minSec = this.ns.getServerMinSecurityLevel(this.hostName);
        const sec = this.ns.getServerSecurityLevel(this.hostName);
        return {currentMoney: money, maxMoney: maxMoney, currentSecurity: sec, minSecurity: minSec};
    }

    /**
     * Returns the number of threads for each stage when batching needed to reduce the hosts amount of money by hackPercentage amount.
     * 
     * @param {number} hackPercentage - The percentage (in 0.0 -> 1.0) we wish to extract from the host at its current money and security level.
     * @returns {Threads}
     */
    getHackThreads(hackPercentage) {
        const baseHackPercent = this.ns.hackAnalyze(this.hostName);
        const baseWeakenPower = this.ns.weakenAnalyze(1);

        const hackThreads = Math.floor(hackPercentage / baseHackPercent);
        const weakenHackThreads = Math.ceil((hackThreads * 0.002) / baseWeakenPower);
        const growThreads = Math.ceil(this.ns.growthAnalyze(this.hostName, 1 / (1 - hackPercentage)));
        const weakenGrowThreads = Math.ceil((growThreads * 0.004) / baseWeakenPower);
        const totalThreads = hackThreads + weakenHackThreads + growThreads + weakenGrowThreads;

        const hackThreadsNeededRam = this.payloads.getRamRequirements(this.payloads.hackFileNameFull) * hackThreads;
        const weakenHackThreadsNeededRam = this.payloads.getRamRequirements(this.payloads.weakenFileNameFull) * weakenHackThreads;
        const growThreadsNeededRam = this.payloads.getRamRequirements(this.payloads.growFileNameFull) * growThreads;
        const weakenGrowThreadsNeededRam = this.payloads.getRamRequirements(this.payloads.weakenFileNameFull) * weakenGrowThreads;
        const totalThreadsNeededRam = hackThreadsNeededRam + weakenHackThreadsNeededRam + growThreadsNeededRam + weakenGrowThreadsNeededRam;

        /** @type {Threads} */
        return {
            hack: hackThreads,
            hackRequiredRam: hackThreadsNeededRam,
            weakenHack: weakenHackThreads,
            weakenHackRequiredRam: weakenHackThreadsNeededRam,
            grow: growThreads,
            growRequiredRam: growThreadsNeededRam,
            weakenGrow: weakenGrowThreads,
            weakenGrowRequiredRam: weakenGrowThreadsNeededRam,
            total: totalThreads,
            totalRequiredRam: totalThreadsNeededRam,
        };
    }

    /**
     * Function which returns the number of running processes on the host.
     * 
     * @returns {number}
     */
    getNumbRunningProcesses() {
        return this.ns.ps(this.hostName).length
    }

    /**
     * Prepares the host before putting batches on it. The function simply
     * maximizes money and minimizes the security on the host.
     * 
     * If there is not enough RAM to execute the prepping, then the script
     * quits and an alert will be shown on screen.
     * 
     * @example server.prepHost();
     */
    async prepHost() {
        const growMem = this.payloads.getRamRequirements(this.payloads.growFileNameFull);
        const weakenMem = this.payloads.getRamRequirements(this.payloads.weakenFileNameFull);

        this.logger.write(this.logger.INFO, `Starting to prepare host ${this.hostName}.`);
        this.logger.write(this.logger.INFO, `This might take some time. You can see the progress doing > run ./utilities/monitor.js ${this.hostName}`);
        while (true) {
            const freeMem = this.ns.getServerMaxRam(this.ns.getHostname()) - this.ns.getServerUsedRam(this.ns.getHostname());
            // Checking if the host is at minimum security level, if not we weaken it.
            if (this.ns.getServerSecurityLevel(this.hostName) > this.ns.getServerMinSecurityLevel(this.hostName)) {
                const threads = Math.floor(freeMem / weakenMem);
                if (threads <= 0) {
                    this.ns.alert("Not enough memory to run the weaken script for prepping.");
                    this.ns.exit();
                }
                const pid = this.ns.run(this.payloads.weakenFileNameFull, threads, this.hostName, 0);
                while (this.ns.isRunning(pid, this.ns.getHostname())) {
                    await this.ns.sleep(200);
                }
            // Checking if the host has the most amount of money it can have, if not we grow it.
            } else if (this.ns.getServerMoneyAvailable(this.hostName) < this.ns.getServerMaxMoney(this.hostName)) {
                const threads = Math.floor(freeMem / growMem);
                if (threads <= 0) {
                    this.ns.alert("Not enough memory to run the grow script for prepping.");
                    this.ns.exit();
                }
                const pid = this.ns.run(this.payloads.growFileNameFull, threads, this.hostName, 0);
                while (this.ns.isRunning(pid, this.ns.getHostname())) {
                    await this.ns.sleep(200);
                }
            }

            // Checking if host has the least amount of security it can have, and
            // that it has the most amount of money it can have. If both is true, we
            // break out of the loop and return.
            if (this.ns.getServerSecurityLevel(this.hostName) <= this.ns.getServerMinSecurityLevel(this.hostName) 
                && this.ns.getServerMoneyAvailable(this.hostName) >= this.ns.getServerMaxMoney(this.hostName)
            ) {
                this.logger.write(this.logger.INFO, `Finished preparing host ${this.hostName}.`);
                break;
            }

            await this.ns.sleep(200);
        }
    }

    /**
     * Returns the amount of security we can reduce the host by at its current state.
     * 
     * @returns {number} - The retaining security we can remove.
     */
    getWeakenStatus() {
        const hackDifficulty = this.stats.hackDifficulty === undefined
            ? 0
            : this.stats.hackDifficulty;
        const minDifficulty = this.stats.minDifficulty === undefined
            ? 0
            : this.stats.minDifficulty;
        return hackDifficulty - minDifficulty;
    }

    /**
     * Returns the amount of money we can grow the host by at its current state.
     * 
     * @returns {number} - The retaining money we can grow.
     */
    getGrowStatus() {
        const moneyMax = this.stats.moneyMax === undefined
            ? 0
            : this.stats.moneyMax;
        const moneyAvailable = this.stats.moneyAvailable === undefined
            ? 0
            : this.stats.moneyAvailable;
        return moneyMax - moneyAvailable;
    }
}