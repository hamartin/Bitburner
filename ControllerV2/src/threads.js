/**
 * A class which is designed to be used as a singleton and handles all
 * threads specific stuff.
 * 
 * @example const threads = new Threads(ns)
 */
export class Threads {
    // Private member
    #ns

    /**
     * @param {NS} ns - Netscript context
     * @example const threads = new Threads(ns)
     */
    constructor (ns) {
        this.#ns = ns
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
}