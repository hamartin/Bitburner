import { Threads } from "./threads"


/**
 * Searches the map of hosts given and looks for hosts that has been Nuked and
 * that has enough vacant RAM to run at least 1 thread. If no such host has been
 * found, then it returns null.
 * 
 * @param {ServersInfo_m} hostsInfo - A map with host name as key and HostInfo_o as value.
 * @returns {HostName_s | null}     - Returns the host name of the best server. If no best server found, null.
 */
function getBestServer(hostsInfo) {
    let bestHost = null
    let bestThreads = -Infinity

    for (const [host, info] of hostsInfo) {
        if (info.threads
            && info.threads > bestThreads
            && info.stats.hasAdminRights == true
        ) {
            bestThreads = info.threads
            bestHost = host
        }
    }

    return bestHost
}

/**
 * Returns a mapping between host names and a set of information.
 * 
 * @param {NS} ns                     - Netscript context 
 * @param {HostNames_l} hostNames     - List of host names
 * @param {Script | undefined} script - The script to calculate threads for
 * @param {number} [minVacantRam=32]  - The minimum amount of RAM we want available on "home" at any given time
 * @param {number} [minMaxRam=128]    - The minimum max RAM "home" can have before we start overriding used RAM
 * @returns {ServersInfo_m}
 */
export function getServersInfo(ns, hostNames, script  = undefined, minVacantRam = 32, minMaxRam = 128) {
    const threads = new Threads(ns)

    return new Map(
        hostNames.map(hostName => {
            // Clone the server stats so qw don't mutate Bitburner's internal object
            const stats = { ...ns.getServer(hostName) }

            // I want to make sure there is always a minimum of 32GB of vacant
            // RAM on the home server so that I can run things like utility
            // scripts etc. But I only want to do this if I have a lot of RAM
            // simply because in the beginning, you have very little resources
            // to use for hacking.
            if (hostName === "home" && stats.maxRam > minMaxRam) {
                stats.ramUsed += minVacantRam
            }

            return [hostName, {
                ...(script && {
                    threads: threads.getNumberOfThreadsAHostCanRun(stats, script.requiredRam)
                }),
                stats,
            }]
        })
    )
}

/**
 * Finds the best server to run the script on, then gets the number of threads
 * it can run and then runs the script itself.
 * 
 * @param {ServersInfo_m} serverWithThreads - Map of hosts and their stats
 * @param {Script} script                   - The script object to run the code for
 * @param  {...string} args                 - Any additional arguments to be passed to ns.exec
 */
export function runOnBestServer(serverWithThreads, script, ...args) {
    /** @type {HostName_s | null} */
    const best = getBestServer(serverWithThreads)
    if (!best) return

    /** @type {Threads_n | undefined} */
    const threads = serverWithThreads.get(best)?.threads
    if (!threads) return

    script.runScriptOnServer(best, threads, ...args)
}