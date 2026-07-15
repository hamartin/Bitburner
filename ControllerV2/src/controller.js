import { Network } from "./network"
import { Script } from "./script"
import { Threads } from "./threads"

import {
    getServersInfo,
    getServerInfo,
} from "./servers"
import {
    getBestServer,
    getHGWStatus,
    getRAMInformation,
    sortByFreeRam,
    waitForAll,
} from "./utility"


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
    #threads

    /**
     * @param {NS} ns                     - Netscript context 
     */
    constructor(ns, hackPercentage = .1) {
        this.#ns = ns

        this.#network = new Network(ns)
        this.#scriptPayload = new Script(ns, "egh.js")
        this.#scriptHack = new Script(ns, "hack.js")
        this.#scriptGrow = new Script(ns, "grow.js")
        this.#scriptWeaken = new Script(ns, "weaken.js")
        this.#threads = new Threads(ns, hackPercentage)

        // The default host to target if getting a host to target is not doable.
        this.targetHostName = "n00dles"
    }

    toString() {
        return `Controller(${this.#ns}, ${this.targetHostName})`
    }

    /**
     * Starts script/stage distributed over the entire sorted list of server
     * names.
     * 
     * @param {*} stage
     * @param {ServerNames_l} sortedServers
     * @param {ServerName_s} targetServerName
     * @returns {Promise<Threads_n>}
     */
    async #distributeStageAcrossServers(stage, sortedServers, targetServerName) {
        let remainingThreads = stage.threads

        for (const serverName of sortedServers) {
            const freeRAM = this.#ns.getServerMaxRam(serverName) - this.#ns.getServerUsedRam(serverName)
            const maxThreads = Math.floor(freeRAM / stage.RAMPerThread)
            if (maxThreads <= 0) continue

            const threadsToRun = Math.min(remainingThreads, maxThreads)
            this.#ns.exec(stage.script, serverName, threadsToRun, targetServerName, stage.delay)
            remainingThreads -= threadsToRun
            if (remainingThreads <= 0) break
        }
        return remainingThreads
    }

    /**
     * @param {ServerNames_l} hostNames      - A list of host names found on the network
     * @param {number} [difficultyScale=3] - A host must be difficultyScale times smaller than player to be available for attacking
     * @returns {ServerName_s}              - A list of host names sorted by the degree which it is most proffitable to attack. Index 0 being the most proffitable.
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
     * Returns the amount of RAM needed for each stage when we know the number of threads needed.
     * 
     * @param {Threads_o} threads 
     * @returns {RAM_o}
     */
    getRAMNeeded(threads) {
        const hackRAM = threads.hackThreads * this.#scriptHack.requiredRAM
        const weakenHackRAM = threads.weakenHackThreads * this.#scriptWeaken.requiredRAM
        const growRAM = threads.growThreads * this.#scriptGrow.requiredRAM
        const weakenGrowRAM = threads.weakenGrowThreads * this.#scriptWeaken.requiredRAM
        const totalRAM = hackRAM + weakenHackRAM + growRAM + weakenGrowRAM
        return {
            hackRAM: hackRAM,
            weakenHackRAM: weakenHackRAM,
            growRAM: growRAM,
            weakenGrowRAM: weakenGrowRAM,
            totalRAM: totalRAM
        }
    }

    /**
     * Returns a sorted list of server names where index 0 has the most amount
     * of free RAM and index -1 has the least amount of free RAM.
     * 
     * @param {ServerNames_l} serverNames - A list of hostnames to sort by amount of free RAM
     * @returns {ServerNames_l}           - The sorted list of hostnames
     */
    getSortedServers(serverNames) {
        const serversInfo = getServersInfo(this.#ns, serverNames) 
        const serversRamInfo = getRAMInformation(serversInfo)
        return sortByFreeRam(serversRamInfo)
    }

    /**
     * Returns the delay time for weaken grow time stage.
     * 
     * @param {ServerName_s} targetServerName 
     * @returns {Delay_n}
     */
    getWeakenGrowDelay(targetServerName) {
        const weakenTime = this.#ns.getWeakenTime(targetServerName)
        const growTime = this.#ns.getGrowTime(targetServerName)
        const delay = growTime - weakenTime + 50
        return delay > 0 ? delay : 0
    }

    /**
     * Returns true if host still is not in its max money and min security
     * state, else false.
     * 
     * @param {ServerInfo_o} serverInfo - Server information about 1 host
     * @returns {boolean}               - True if host need preparing, else false
     */
    serverNeedPreparing(serverInfo) {
        const status = getHGWStatus(serverInfo)
        if (status.diffMoney > 0 || status.diffSecurity > 0) {
            return true
        }
        return false
    }

    /**
     * Runs weaken and grow on the host until available money equals max money and
     * current security equals min security.
     * 
     * @param {ServerName_s} targetServerName        - The target host to grow and weaken
     */
    async prepareServer(targetServerName) {
        while (true) {
            const serverInfo = getServerInfo(this.#ns, targetServerName)
            if (!serverInfo) return

            // Check if the host still need more prepping. If not, we are done here.
            if (!this.serverNeedPreparing(serverInfo)) {
                return
            }

            await this.runPrepareOnBestServer(targetServerName)
        }
    }

    /**
     * Runs a batching algorithm which times when the 4 stages of hack, weaken
     * hack, grow and weaken grow. The attacking host is chosen based on if it
     * can fit all 4 stages or 1 or more stages in RAM.
     * 
     * @param {ServerName_s | undefined} targetServerName - Target host name to attack or undefined
     */
    async runBatching(targetServerName) {
        while (true) {
            const serverNames = this.#network.getRootedHostNames()
            if (targetServerName === undefined) {
                targetServerName = this.getBestHostsToAttack(serverNames)
            }
            const serversInfo = getServersInfo(this.#ns, serverNames)
            const targetServerInfo = serversInfo.get(targetServerName)
            if (targetServerInfo === undefined) return

            // Prepare host if needed.
            if (this.serverNeedPreparing(targetServerInfo)) {
                await this.prepareServer(targetServerName)
            }
            await this.#ns.sleep(1000)
        }
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

            this.runEGHOnBestServer(serversWithThreads, targetHostName)
            await this.#ns.sleep(200)
        }
    }

    /**
     * Finds the best server to run the script on, then gets the number of threads
     * it can run and then runs the script itself.
     * 
     * @param {ServersInfo_m} serverWithThreads - Map of hosts and their stats
     * @param  {...string} args                 - Any additional arguments to be passed to ns.exec
     */
    runEGHOnBestServer(serverWithThreads, ...args) {
        /** @type {ServerName_s | null} */
        const best = getBestServer(serverWithThreads)
        if (!best) return

        /** @type {Threads_n | undefined} */
        const threads = serverWithThreads.get(best)?.threads
        if (!threads) return

        this.#scriptPayload.runScriptOnServer(best, threads, ...args)
    }

    /**
     * 
     * @param {ServerName_s} targetServerName - Host name of the server to prepare
     */
    async runPrepareOnBestServer(targetServerName) {
        const threads = this.#threads.getHGWThreads(targetServerName)
        const serverNames = this.#network.getRootedHostNames()
        const sortedServerNames = this.getSortedServers(serverNames)

        await runPrepStage(this.#ns, threads.weakenToMinThreads, sortedServerNames, this.#scriptWeaken, targetServerName)
        await runPrepStage(this.#ns, threads.growToMaxThreads, sortedServerNames, this.#scriptGrow, targetServerName)
        await runPrepStage(this.#ns, threads.weakenGrowToMaxThreads, sortedServerNames, this.#scriptWeaken, targetServerName)
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
    //await controller.runEGH()
    await controller.runBatching("iron-gym")
}

/**
 * 
 * @param {NS} ns
 * @param {Threads_n} threads 
 * @param {ServerNames_l} sortedServerNames
 * @param {Script} script
 * @param {ServerName_s} targetServerName
 */
async function runPrepStage(ns, threads, sortedServerNames, script, targetServerName) {
    while (threads > 0) {
        const pids = []
        for (const serverName of sortedServerNames) {
            const serverInfo = ns.getServer(serverName)
            // I want to be able to do some basic work on the home server when doing the prepping.
            if (serverInfo.hostname === "home" && serverInfo.maxRam >= 128) {
                serverInfo.maxRam -= 32
            }
            const freeRAM = serverInfo.maxRam - serverInfo.ramUsed
            const maxThreads = Math.floor(freeRAM / script.requiredRAM)
            if (maxThreads <= 0) continue

            const threadsToRun = Math.min(threads, maxThreads)
            if (threadsToRun <= 0) break
            pids.push(ns.exec(
                script.pathAndFileName,
                serverName,
                threadsToRun,
                targetServerName,
                0
            ))
            threads -= threadsToRun
        }
        await waitForAll(ns, pids)
    }
}