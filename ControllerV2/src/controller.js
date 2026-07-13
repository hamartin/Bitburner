import { Network } from "./network"
import { Script } from "./script"
import { Threads } from "./threads"


/**
 * @param {NS} ns - Netscript context
 */
export async function main(ns) {
    const network = new Network(ns)
    const threads = new Threads(ns)
    const script = new Script(ns, "payload.js")

    while (true) {
        const hostNames = network.getRootedHostNames()

        /** @type {HostsInfo_m} */
        const hostsInfo = new Map(
            hostNames.map(h => [h, {
                threads: threads.getNumberOfThreadsAHostCanRun(h, script.requiredRam),
                stats: ns.getServer(h),
            }])
        )
        /** @type {HostsInfo_m} */
        const hostsWithThreads = new Map(
            [...hostsInfo].filter(([host, info]) => info.threads >= 1)
        );

        const bestSourceHost = getBestHost(hostsWithThreads)
        if (bestSourceHost !== null) {
            if (!script.hostHasScript(bestSourceHost)) {
                script.copyToHost(bestSourceHost)
            }
            ns.exec(script.pathAndFileName,
                bestSourceHost,
                threads.getNumberOfThreadsAHostCanRun(bestSourceHost, script.requiredRam),
                "omega-net"
            )
        }
        await ns.sleep(1000)
        // TODO: Vi må finne ut av bestTarget, regne ut batch sizes og finne ut
        // av hvordan vi holder styr på hvilke hoster som skal ha hva slags type
        // threads/batches osv.
    }
}

/**
 * 
 * @param {HostsInfo_m} hostsInfo - A map with host name as key and HostInfo_o as value.
 * @returns {HostName_s | null}
 */
function getBestHost(hostsInfo) {
    let bestHost = null;
    let bestThreads = -Infinity;

    for (const [host, info] of hostsInfo) {
        if (info.threads > bestThreads
            && info.stats.hasAdminRights == true
        ) {
            bestThreads = info.threads;
            bestHost = host;
        }
    }

    return bestHost;
}