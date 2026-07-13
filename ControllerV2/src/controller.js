import { Network } from "./network"
import { Script } from "./script"

import {
    getServersInfo,
    runOnBestServer
} from "./servers"


/**
 * This class controlls batching out hack, weaken, grow, weaken stages on the
 * target server calculated to be best to attack.
 */
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

    toString() {
        return `Controller(${this.#ns}, ${this.targetHostname})`
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

            runOnBestServer(serversWithThreads, this.#script, this.targetHostname)
            await this.#ns.sleep(200)
            // TODO: Vi må finne ut av bestTarget, regne ut batch sizes og finne ut
            // av hvordan vi holder styr på hvilke hoster som skal ha hva slags type
            // threads/batches osv.
        }
    }
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