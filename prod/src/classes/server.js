/**
 * @typedef {import("./payloads.js").Payloads} Payloads - This is needed so that Visual Code can resolve the Payloads class
 */


/**
 * A class to keep track of what is happening on a server.
 * 
 * @example const server = new Server(ns, "n00dles", payloads);
 */
export class Server {
    /**
     * @param {NS} ns             - Netscript context
     * @param {string} hostName   - The server host name
     * @param {Payloads} payloads - The Payloads context
     * @example const server = new Server(ns, "n00dles", payloads);
     */
    constructor (ns, hostName, payloads) {
        this.ns = ns;
        this.hostName = hostName;
        this.payloads = payloads;
    }

    /**
     * Function which returns the amount of available RAM on the host.
     * 
     * @returns {number}
     */
    getAvailableRam() {
        return this.ns.getServerMaxRam(this.hostName) - this.ns.getServerUsedRam(this.hostName);
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
}