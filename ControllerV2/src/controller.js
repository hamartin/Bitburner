import { Network } from "./network"
import { Script } from "./script"

import { getServersInfo } from "./servers"


export class Controller {
    // Private members
    #ns
    #network
    #script

    /**
     * @param {NS} ns                     - Netscript context 
     * @param {HostName_s} targetHostName - Host name of the host to drain
     */
    constructor(ns, targetHostName) {
        this.#ns = ns
        this.#network = new Network(ns)
        this.#script = new Script(ns, "payload.js")

        this.targetHostname = targetHostName
    }

    async run() {
        while (true) {
            const hostNames = this.#network.getRootedHostNames()

            // We get information about all the hosts we found and reduce the number
            // of hosts to only those that has reported they can run 1 or more
            // threads.
            const serversInfo = getServersInfo(this.#ns, hostNames, this.#script)
            /** @type {ServersInfo_m} */
            const serversWithThreads = new Map(
                [...serversInfo].filter(([_, info]) => info.threads >= 1)
            );

            // We find the server which can run the most amount of threads for the
            // script we are using and run the script on that host.
            /** @type {HostName_s | null} */
            const bestSourceServer = getBestServer(serversWithThreads)
            if (bestSourceServer !== null) {
                /** @type {Threads_n | undefined} */
                if (bestSourceServer !== null) {
                    const numbThreads = serversWithThreads.get(bestSourceServer)?.threads
                    if (numbThreads !== undefined) {
                        this.#script.runScriptOnServer(bestSourceServer, numbThreads, this.targetHostname)
                    }
                }
            }
            await this.#ns.sleep(1000)
            // TODO: Vi må finne ut av bestTarget, regne ut batch sizes og finne ut
            // av hvordan vi holder styr på hvilke hoster som skal ha hva slags type
            // threads/batches osv.
        }
    }
}

/**
 * 
 * @param {ServersInfo_m} hostsInfo - A map with host name as key and HostInfo_o as value.
 * @returns {HostName_s | null}
 */
function getBestServer(hostsInfo) {
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

/**
 * Runs the controller as it is right now. I can't "hide" main from other files
 * which import this file, because BitBurner will only run main which is
 * exported and async.
 * 
 * @param {NS} ns - Netscript context
 */
export async function main(ns) {
    const controller = new Controller(ns, "phantasy")
    await controller.run()
}