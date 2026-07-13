import { getNetworkHostNames } from "./utility"


/**
 * A class to help with player relevant things.
 * 
 * @example const player = new MyPlayer(ns)
 */
export class MyPlayer {
    #ns

    /**
     * @param {NS} ns - Netscript context
     * @example const player = new MyPlayer(ns)
     */
    constructor (ns) {
        this.#ns = ns
    }

    /**
     * This helper allows you to call one function and get the growth time. If
     * Formulas are available, then it will use that instead of the default one.
     * 
     * @param {string} hostName - The host name of the host you want to calculate growth time for.
     * @returns {number}
     */
    #getGrowTime(hostName) {
        if (this.#ns.fileExists("Formulas.exe", "home")) {
            const server = this.#ns.getServer(hostName)
            const player = this.#ns.getPlayer()
            return this.#ns.formulas.hacking.growTime(server, player)
        }

        return this.#ns.getGrowTime(hostName)
    }

    /**
     * Returns an object with the different base times for the different
     * stages/types of attacks.
     * 
     * If Formulas has been activated, it uses the formula recipe instead of the
     * standard ns.getGrowTime().
     * 
     * @param {string} targetHost - The host name of the host to get times for.
     * @returns {AttackTimes}     - An object containing attack base times.
     */
    getAttackTimes(targetHost) {
        const hackTime = this.#ns.getHackTime(targetHost)
        const growTime = this.#getGrowTime(targetHost)
        const weakenTime = this.#ns.getWeakenTime(targetHost)

        return {hack: hackTime, grow: growTime, weaken: weakenTime}
    }

    /**
     * Returns the host which is deemed best to attack at the current point in time.
     * The function does this: score = (maxMoney * growth) / hackTime
     * The higher the score, the better the host is.
     * 
     * The function does not use minSecurity directly as that is handled by hackAnalyze.
     * Weaken time is always the time it takes to hack the server times 4. Since the ratio
     * does not change between servers, we don't need to consider it.
     * 
     * The function also takes your hacking level into account through the analyze function.
     * So if you're much lower hack level than the target host, then your score for that host
     * will automatically be lower.
     * 
     * @returns {string} - The hostname of the host which is "best" to attack
     */
    getBestHostToAttack() {
        const hostNames = getNetworkHostNames(this.#ns)
        const rootedHosts = hostNames.filter(s => this.#ns.hasRootAccess(s))

        let best = null
        let bestScore = -Infinity
        for (const hostName of rootedHosts) {
            const maxMoney = this.#ns.getServerMaxMoney(hostName)
            if (maxMoney <= 0) continue
            const requiredHackingSkill = this.#ns.getServerRequiredHackingLevel(hostName)
            // We divide by 3 because when your hacking level is 3 times bigger
            // than the target host required hacking level, then probability of
            // success in all 4 batching stages gets a lot higher.
            if (this.#ns.getHackingLevel() < requiredHackingSkill/3) continue

            const hackPercent = this.#ns.hackAnalyze(hostName)
            const hackTime = this.#ns.getHackTime(hostName)
            const growth = this.#ns.getGrowTime(hostName)
            const score = (maxMoney * hackPercent * growth) / hackTime

            if (score > bestScore) {
                bestScore = score
                best = hostName
            }
        }
        return best ?? "n00dles"
    }

    /**
     * Function returns the delays needed on each of the 3 last steps to get the
     * staggering we need to hack fast.
     * 
     * This is what we are trying to achieve with the delays we are writing here.
     * |------||----| hack
     * |-------------| weaken
     * |---||---------| grow
     * |||-------------| weaken
     * 
     * @param {string} targetHost - The host name of the host to target our attack on
     * @example const delays = player.getDelay("omega-net")
     * @returns {DelayTimes}
     */
    getDelay(targetHost) {
        const OFFSET_TIME = 100
        const attackTimes = this.getAttackTimes(targetHost)

        const totalHackTime = attackTimes.weaken - OFFSET_TIME
        const totalHackWeakenTime = attackTimes.weaken
        const totalGrowTime = attackTimes.weaken + OFFSET_TIME
        const totalGrowWeakenTime = totalGrowTime + OFFSET_TIME

        const hackDelay = totalHackTime - attackTimes.hack
        const weakenHackDelay = totalHackWeakenTime - attackTimes.weaken
        const growDelay = totalGrowTime - attackTimes.grow
        const weakenGrowDelay = totalGrowWeakenTime - attackTimes.weaken

        return {
            hack: hackDelay,
            weakenHack: weakenHackDelay,
            grow: growDelay,
            weakenGrow: weakenGrowDelay,
        }
    }
}