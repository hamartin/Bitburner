import {
    STEAL_PERCENTAGE,
    PAYLOADS,
} from "../src/constants.js";
import {
    getNetworkHostNames,
    getBestHostToAttack,
} from "../src/utility.js"


/** @param {NS} ns */
export async function main(ns) {
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    // Find the best host to attack
    const hostName = getBestHostToAttack(ns);

    // We need to know what hack/weaken will achieve with 1 thread
    const hackPercent = ns.hackAnalyze(hostName);
    const weakenPower = ns.weakenAnalyze(1);

    // Calculate the number of threads we need in each stage
    const hackThreads = Math.floor(STEAL_PERCENTAGE / hackPercent);
    const growThreads = Math.ceil(ns.growthAnalyze(hostName, 1 / (1 - STEAL_PERCENTAGE)));
    const weakenThreadsHack = Math.ceil((hackThreads * 0.002) / weakenPower);
    const weakenThreadsGrow = Math.ceil((growThreads * 0.004) / weakenPower);
    const totalThreads = hackThreads + growThreads + weakenThreadsHack + weakenThreadsGrow;

    const hackReqRam = ns.getScriptRam(PAYLOADS.HACK, "home") * hackThreads; 
    const growReqRam = ns.getScriptRam(PAYLOADS.GROW, "home") * growThreads;
    const weakenReqRamHacking = ns.getScriptRam(PAYLOADS.WEAKEN, "home") * weakenThreadsHack;
    const weakenReqRamGrow = ns.getScriptRam(PAYLOADS.GROW, "home") * weakenThreadsGrow;
    const totalReqRam = hackReqRam + growReqRam + weakenReqRamHacking + weakenReqRamGrow;

    // We create a map between hack/grow/weaken hack/weaken grow and needed
    // values. Note this should only be done when the targetHost is in a
    // known state, meaning you calculate this once and reuse if for all batches.
    const data = new Map();
    data.set("hack", [hackThreads, hackReqRam]);
    data.set("grow", [growThreads, growReqRam]);
    data.set("weaken hack", [weakenThreadsHack, weakenReqRamHacking]);
    data.set("weaken grow", [weakenThreadsGrow, weakenReqRamGrow]);
    data.set("total", [totalThreads, totalReqRam]);

    ns.print(`Best target host: ${hostName}\n\n`);
    ns.print(`Hacking:`);
    ns.print(`\tThreads: ${data.get("hack")[0]}`);
    ns.print(`\tMin RAM required: ${data.get("hack")[1]}`);
    ns.print(`Growing:`);
    ns.print(`\tThreads: ${data.get("grow")[0]}`);
    ns.print(`\tMin RAM required: ${data.get("grow")[1]}`);
    ns.print(`Weaken - Hack:`);
    ns.print(`\tThreads: ${data.get("weaken hack")[0]}`);
    ns.print(`\tMin RAM required: ${data.get("weaken hack")[1]}`);
    ns.print(`Weaken - Growing:`);
    ns.print(`\tThreads: ${data.get("weaken grow")[0]}`);
    ns.print(`\tMin RAM required: ${data.get("weaken grow")[1]}`);
    ns.print(`\nTotals:`);
    ns.print(`\t Threads required: ${data.get("total")[0]}`);
    ns.print(`\t RAM required: ${data.get("total")[1]}`);
}
