/**
 * A class which is designed to be used as a singleton and handles all
 * threads specific stuff.
 * 
 * @example const threads = new Threads(ns, .1)
 */
export class Threads {
    // Private member
    #ns
    #hackPercentage

    /**
     * @param {NS} ns                 - Netscript context
     * @param {number} hackPercentage - The percentage of the host current available money to hack
     * @example const threads = new Threads(ns, .1)
     */
    constructor (ns, hackPercentage) {
        this.#ns = ns
        this.#hackPercentage = hackPercentage
    }

    toString() {
        return `Threads(${this.#ns})`
    }

    /**
     * Returns the number of threads a host can run given the script it will run
     * needs ramNeeded amount of RAM per thread.
     * 
     * @param {Server} stats    - Server information -> ns.getServer(<hostname>)
     * @param {RAM_n} ramNeeded - The amount of RAM we need for each thread
     * @returns {Threads_n}     - The number of threads we can run given ramNeeded
     * @example const newThreads = threads.getNumberOfThreadsAHostCanRun(ns.getServer("n00dles"), 1.7)
     */
    getNumberOfThreadsAHostCanRun(stats, ramNeeded) {
        const freeRam = stats.maxRam - stats.ramUsed
        return Math.floor(freeRam/ramNeeded)
    }

    /**
     * Returns the number of batches a host can run given the batch it will run
     * needs ramNeeded amount of RAM per batch. This function calls
     * getNumberOfThreadsAHostCanRun, but I assume the ramNeeded argument will
     * in general be bigger numbers.
     * 
     * @param {Server} stats    - Server information -> ns.getServer(<hostname>)
     * @param {RAM_n} ramNeeded - The amount of RAM we need for each batch
     * @returns {Batches_n}     - The number of batches we can run given ramNeeded
     * @example const newBatches = threads.getNumberOfBatchesAHostCanRun(ns.getServer("n00dles", 64.3))
     */
    getNumberOfBatchesAHostCanRun(stats, ramNeeded) {
        return this.getNumberOfThreadsAHostCanRun(stats, ramNeeded)
    }

    /**
     * Returns the number of threads we need to run for each stage to get to its
     * base levels.
     * 
     * @param {ServerName_s} targetServerName - The host name of the server to attack
     * @returns {Threads_o}                 - Dictionary thing where the keys are the stages and values are the number of threads needed
     */
    getHGWThreads(targetServerName) {
        const baseHackPercent = this.#ns.hackAnalyze(targetServerName)
        const baseWeakenPower = this.#ns.weakenAnalyze(1)
        const currentSecurity = this.#ns.getServerSecurityLevel(targetServerName)
        const minimumSecurity = this.#ns.getServerMinSecurityLevel(targetServerName)
        const currentMoney    = this.#ns.getServerMoneyAvailable(targetServerName)
        const maxMoney        = this.#ns.getServerMaxMoney(targetServerName)

        const securityLevelsToRemove = currentSecurity - minimumSecurity
        const growFactor = maxMoney / Math.max(currentMoney, 1)

        // Needed for prepping
        const weakenToMinThreads = Math.ceil(securityLevelsToRemove / baseWeakenPower)
        const growToMaxThreads = Math.ceil(this.#ns.growthAnalyze(targetServerName, growFactor))
        const weakenGrowToMaxThreads = Math.ceil((growToMaxThreads * 0.004) / baseWeakenPower)

        // Needed for normal batching
        const hackThreads = Math.floor(this.#hackPercentage / baseHackPercent)
        const weakenHackThreads = Math.ceil((hackThreads * 0.002) / baseWeakenPower)
        const growThreads = Math.ceil(this.#ns.growthAnalyze(targetServerName, 1 / (1 - this.#hackPercentage)))
        const weakenGrowThreads = Math.ceil((growThreads * 0.004) / baseWeakenPower)

        return {
            hackThreads: hackThreads,
            weakenHackThreads: weakenHackThreads,
            growThreads: growThreads,
            weakenGrowThreads: weakenGrowThreads,

            weakenToMinThreads: weakenToMinThreads,
            growToMaxThreads: growToMaxThreads,
            weakenGrowToMaxThreads: weakenGrowToMaxThreads,
        }
    }
}