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
    #scriptPayload
    #scriptHack
    #scriptGrow
    #scriptWeaken

    /**
     * @param {NS} ns                     - Netscript context 
     */
    constructor(ns) {
        this.#ns = ns
        this.#network = new Network(ns)
        this.#scriptPayload = new Script(ns, "egh.js")
        this.#scriptHack = new Script(ns, "hack.js")
        this.#scriptGrow = new Script(ns, "grow.js")
        this.#scriptWeaken = new Script(ns, "weaken.js")

        this.targetHostName = "n00dles"
    }

    toString() {
        return `Controller(${this.#ns}, ${this.targetHostName})`
    }

    /**
     * @param {HostNames_l} hostNames      - A list of host names found on the network
     * @param {number} [difficultyScale=3] - A host must be difficultyScale times smaller than player to be available for attacking
     * @returns {HostName_s}              - A list of host names sorted by the degree which it is most proffitable to attack. Index 0 being the most proffitable.
     */
    getBestHostsToAttack(hostNames, difficultyScale = 3) {
        const serversInfo = getServersInfo(this.#ns, hostNames)
        const myHackLevel = this.#ns.getHackingLevel()
        
        const hackAble = new Map(
            [...serversInfo].filter(([_, info]) =>
                info.stats.hasAdminRights &&
                (info.stats.hackDifficulty ?? Infinity) <= myHackLevel / difficultyScale
        ))

        let best = null
        let bestScore = -Infinity
        for (const [hostName, info] of hackAble) {
            // We don't know how much money the host has or it cannot have any money
            // at all. Skip the host if so.
            const maxMoney = info.stats.moneyMax
            if (!maxMoney || maxMoney <= 0) continue

            const hackPercent = this.#ns.hackAnalyze(hostName)
            const hackTime = this.#ns.getHackTime(hostName)
            const growth = this.#ns.getGrowTime(hostName)
            const score = (maxMoney * hackPercent * growth) / hackTime

            if (score > bestScore) {
                bestScore = score
                best = hostName
            }
        }
        // If no best host can be found, we return the easiest host to attack in
        // the game.
        return best ?? this.targetHostName
    }

    /**
     * Runs the simple early game hack algorithm on all hosts available to run
     * the script. The target host is automatically chosen.
     */
    async runEGH() {
        while (true) {
            const hostNames = this.#network.getRootedHostNames()
            const targetHostName = this.getBestHostsToAttack(hostNames)
            // We get information about all the hosts we found and reduce the number
            // of hosts to only those that has reported they can run 1 or more
            // threads.
            const serversInfo = getServersInfo(this.#ns, hostNames, this.#scriptPayload)
            /** @type {ServersInfo_m} */
            const serversWithThreads = new Map(
                [...serversInfo].filter(([_, info]) => info.threads && info.threads >= 1)
            )

            runOnBestServer(serversWithThreads, this.#scriptPayload, targetHostName)
            await this.#ns.sleep(200)
            // TODO: regne ut batch sizes og finne ut
            // av hvordan vi holder styr på hvilke hoster som skal ha hva slags type
            // threads/batches osv.
        }
    }

    /**
     * Runs a batching algorithm which times when the 4 stages of hack, weaken
     * hack, grow and weaken grow. The attacking host is chosen based on if it
     * can fit all 4 stages or 1 or more stages in RAM.
     */
    async runBatching() {
        while (true) {
            const hostNames = this.#network.getRootedHostNames()
            const targetHostName = this.getBestHostsToAttack(hostNames)
            // We get information about all the hosts we found and reduce the number
            // of hosts to only those that has reported they can run 1 or more
            // threads.
            const serversInfo = getServersInfo(this.#ns, hostNames, this.#scriptPayload)
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
    const controller = new Controller(ns)
    await controller.runEGH()
}