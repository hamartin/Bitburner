/**
 * Searches the map of hosts given and looks for hosts that has been Nuked and
 * that has enough vacant RAM to run at least 1 thread. If no such host has been
 * found, then it returns null.
 * 
 * @param {ServersInfo_m} serversInfo - A map with host name as key and HostInfo_o as value.
 * @returns {ServerName_s | null}     - Returns the host name of the best server. If no best server found, null.
 */
export function getBestServer(serversInfo) {
    let bestServer = null
    let bestThreads = -Infinity

    for (const [server, info] of serversInfo) {
        if (info.threads
            && info.threads > bestThreads
            && info.stats.hasAdminRights == true
        ) {
            bestThreads = info.threads
            bestServer = server
        }
    }

    return bestServer
}

/**
 * Returns the min, max and current levels for hack, grow and weaken for the
 * host in question.
 * 
 * @param {ServerInfo_o} hostInfo - Information about the host in question
 * @returns {HGWStatus_o}
 */
export function getHGWStatus(hostInfo) {
    // Get and calculate the security level stuff.
    const hackDifficulty = hostInfo.stats.hackDifficulty === undefined
        ? Infinity
        : hostInfo.stats.hackDifficulty
    const minDifficulty = hostInfo.stats.minDifficulty === undefined
        ? Infinity
        : hostInfo.stats.minDifficulty

    // Get and calculate the grow level stuff.
    const moneyMax = hostInfo.stats.moneyMax === undefined
        ? -Infinity
        : hostInfo.stats.moneyMax
    const moneyAvailable = hostInfo.stats.moneyAvailable === undefined
        ? -Infinity
        : hostInfo.stats.moneyAvailable

    return {
        currentSecurity: hackDifficulty,
        minSecurity: minDifficulty,
        diffSecurity: hackDifficulty - minDifficulty,
        currentMoney: moneyAvailable,
        maxMoney: moneyMax,
        diffMoney: moneyMax - moneyAvailable,
    }
}

/**
 * Takes a host to information mapping and returns a mapping between
 * hostnames and RAM information for that host.
 * 
 * @param {ServersInfo_m} serversInfo - Server information
 * @returns {ServerRAM_m}
 */
export function getRAMInformation(serversInfo) {
    return new Map(
        [...serversInfo].map(([serverName, info]) => {
            const maxRAM = info.stats.maxRam
            const usedRAM = info.stats.ramUsed
            const freeRAM = maxRAM - usedRAM
            return [serverName, {maxRAM: maxRAM, usedRAM: usedRAM, freeRAM: freeRAM}]
        })
    )
}

/**
 * 
 * @param {ServerRAM_m} serversRamInfo 
 * @returns {ServerNames_l}
 */
export function sortByFreeRam(serversRamInfo) {
    return [...serversRamInfo.entries()]
        .sort((a, b) => b[1].freeRam - a[1].freeRam)
        .map(([host]) => host)
}

/**
 * Waits until all PIDs in the array have stopped running.
 * 
 * @param {NS} ns
 * @param {PID_l} pids
 */
export async function waitForAll(ns, pids) {
    while (true) {
        // Filter out any PIDs that are still running
        const stillRunning = pids.filter(pid => ns.isRunning(pid));

        if (stillRunning.length === 0) {
            break; // all done
        }
        await ns.sleep(50);
    }
}