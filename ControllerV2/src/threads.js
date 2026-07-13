import { NSBound } from "./nsbound"


/**
 * A class which is designed to be used as a singleton and handles all
 * threads specific stuff.
 * 
 * @example const threads = new Threads(ns)
 */
export class Threads extends NSBound {

    /**
     * @param {NS} ns - Netscript context
     * @example const threads = new Threads(ns)
     */
    constructor (ns) {
        super(ns)
    }

    /**
     * Returns the number of threads a host can run given the script it will run
     * needs ramNeeded amount of RAM per thread.
     * 
     * @param {HostName_s} hostName 
     * @param {RAM_n} ramNeeded 
     * @returns {Threads_n}
     * @example const newThreads = threads.getNumberOfThreadsAHostCanRun("n00dles", 1.7)
     */
    getNumberOfThreadsAHostCanRun(hostName, ramNeeded) {
        const freeRam = this.ns.getServerMaxRam(hostName) - this.ns.getServerUsedRam(hostName)
        return Math.floor(freeRam/ramNeeded)
    }

    /**
     * Returns the number of batches a host can run given the batch it will run
     * needs ramNeeded amount of RAM per batch. This function calls
     * getNumberOfThreadsAHostCanRun, but I assume the ramNeeded argument will
     * in general be bigger numbers.
     * 
     * @param {HostName_s} hostName 
     * @param {RAM_n} ramNeeded 
     * @returns {Batches_n}
     */
    getNumberOfBatchesAHostCanRun(hostName, ramNeeded) {
        return this.getNumberOfThreadsAHostCanRun(hostName, ramNeeded)
    }
}