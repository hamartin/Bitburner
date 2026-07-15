import { Threads } from "./threads"


/**
 * Returns information about a specific server.
 * 
 * @param {NS} ns                         - Netscript context
 * @param {ServerName_s} targetServerName - The server host name to get information about
 * @returns {ServerInfo_o}
 */
export function getServerInfo(ns, targetServerName) {
    const serverInfo = ns.getServer(targetServerName)
    return {
        stats: serverInfo
    }
}

/**
 * Returns a mapping between host names and a set of information.
 * 
 * @param {NS} ns                     - Netscript context 
 * @param {ServerNames_l} serverNames - List of host names
 * @param {Script | undefined} script - The script to calculate threads for
 * @param {number} [minVacantRam=32]  - The minimum amount of RAM we want available on "home" at any given time
 * @param {number} [minMaxRam=128]    - The minimum max RAM "home" can have before we start overriding used RAM
 * @returns {ServersInfo_m}
 */
export function getServersInfo(ns, serverNames, script = undefined, minVacantRam = 32, minMaxRam = 128) {
    // We do not care about the hackPercentage in this specific case
    const threads = new Threads(ns, .1)

    return new Map(
        serverNames.map(serverName => {
            // Clone the server stats so qw don't mutate Bitburner's internal object
            const stats = { ...ns.getServer(serverName) }

            // I want to make sure there is always a minimum of 32GB of vacant
            // RAM on the home server so that I can run things like utility
            // scripts etc. But I only want to do this if I have a lot of RAM
            // simply because in the beginning, you have very little resources
            // to use for hacking.
            if (serverName === "home" && stats.maxRam > minMaxRam) {
                stats.ramUsed += minVacantRam
            }

            return [serverName, {
                ...(script && {
                    threads: threads.getNumberOfThreadsAHostCanRun(stats, script.requiredRAM)
                }),
                stats,
            }]
        })
    )
}