import { prepHost } from "./src/hacking.js";
import { getBestHostToAttack } from "./src/utility.js";
import { getGrowTime } from "./src/hacking.js";
import {
    OFFSET_TIME,
    BATCH_OFFSET_TIME,
    PAYLOADS,
    STEAL_PERCENTAGE,
    LOG_LEVEL,
}from "./src/constants.js";
import { LogMessage } from "./src/logging.js";


/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    let targetHost = getBestHostToAttack(ns);
    await prepHost(ns, targetHost);

    while (true) {
        const newTargetHost = getBestHostToAttack(ns);
        if (newTargetHost != targetHost) {
            targetHost = newTargetHost;
            LogMessage(ns, LOG_LEVEL.INFO, `New optimal host to attack found ${targetHost}.`);
            // Prepare the host, so we can get the required information to enable us to do batching.
            await prepHost(ns, targetHost);
        }

        const delays = getDelay(ns, targetHost);
        const threads = getThreadCounts(ns, targetHost);

        let hackPid = ns.run(PAYLOADS.HACK, threads.hackThreadCount, targetHost, delays.hackDelay);
        let hackWeakenPid = ns.run(PAYLOADS.WEAKEN, threads.weakenHackThreadCount, targetHost, delays.weakenHackDelay);
        let growPid = ns.run(PAYLOADS.GROW, threads.growThreadCount, targetHost, delays.growDelay);
        let growWeakenPid = ns.run(PAYLOADS.WEAKEN, threads.weakenGrowThreadCount, targetHost, delays.weakenGrowDelay);

        if (hackPid == 0 || hackWeakenPid == 0 || growPid == 0 || growWeakenPid == 0) {
            ns.alert("Failed to start the individual batch file hack/weaken/grow/weaken maybe to RAM")
            ns.exit()
        }

        await ns.sleep(BATCH_OFFSET_TIME);
    }
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
 * @param {NS} ns             - Netscript context
 * @param {string} targetHost - The host name of the host to target our attack on
 * @example getDelay(ns, "omega-net");
 * @returns {{hackDelay: number, weakenHackDelay: number, growDelay: number, weakenGrowDelay: number}}
 */
function getDelay(ns, targetHost) {
    const hackTime = ns.getHackTime(targetHost);
    const growTime = getGrowTime(ns, targetHost);
    const weakenTime = ns.getWeakenTime(targetHost);

    const totalHackTime = weakenTime - OFFSET_TIME;
    const totalHackWeakenTime = weakenTime
    const totalGrowTime = weakenTime + OFFSET_TIME;
    const totalGrowWeakenTime = totalGrowTime + OFFSET_TIME;

    const hackDelay = totalHackTime - hackTime;
    const weakenHackDelay = totalHackWeakenTime - weakenTime;
    const growDelay = totalGrowTime - growTime;
    const weakenGrowDelay = totalGrowWeakenTime - weakenTime;

    return {
        hackDelay,
        weakenHackDelay,
        growDelay,
        weakenGrowDelay,
    };
}

/**
 * Returns the calculated thread counts.
 * 
 * @param {NS} ns                 - Netscript context 
 * @param {string} targetHost - The host name of the host you are attacking
 * @example getThreadCounts(ns, "omega-net");
 * @returns {{hackThreadCount: number, weakenHackThreadCount: number, growThreadCount: number, weakenGrowThreadCount: number}}
 */
export function getThreadCounts(ns, targetHost) {
    // Hacking threads
    const hackThreads = Math.floor(STEAL_PERCENTAGE / ns.hackAnalyze(targetHost));

    // Weaken after hack threads
    const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads);
    const hackWeakenThreads = Math.ceil(hackSecIncrease / ns.weakenAnalyze(1));

    // Grow threads
    const growMultiplier = 1 / (1-STEAL_PERCENTAGE);
    const growThreads = Math.ceil(ns.growthAnalyze(targetHost, growMultiplier));

    // Weaken after grow threads
    const growSecIncrease = ns.growthAnalyzeSecurity(growThreads);
    const growWeakenThreads = Math.ceil(growSecIncrease / ns.weakenAnalyze(1));

    return {
        hackThreadCount: hackThreads,
        weakenHackThreadCount: hackWeakenThreads,
        growThreadCount: growThreads,
        weakenGrowThreadCount: growWeakenThreads,
    };
}