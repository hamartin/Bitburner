import {
    LOG_LEVEL,
    PAYLOADS,
} from "./src/constants.js";
import { LogMessage } from "./src/logging.js";
//import { getBestHostToAttack } from "./src/utility.js";


/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns
 */
export async function main(ns) {
    //const targetHost = getBestHostToAttack(ns);
    // We force the host while writing the code.
    const targetHost = "omega-net";

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    ns.run("./utilities/monitor.js", 1, targetHost);
    LogMessage(ns, LOG_LEVEL.INFO, `Starting to prepare host ${targetHost}.`);
    await prepHost(ns, targetHost);
    LogMessage(ns, LOG_LEVEL.INFO, `Finished preparing host ${targetHost}.`);
}

/**
 * Prepares the host before putting batches on it. The function simply
 * maximizes money and minimizes the security on the host.
 * 
 * If there is not enough RAM to execute the prepping, then the script
 * quits and an alert will be shown on screen.
 * 
 * @param {NS} ns             - Netscript context
 * @param {string} targetHost - The host name to prepare
 */
async function prepHost(ns, targetHost) {
    const growMem = ns.getScriptRam(PAYLOADS.GROW);
    const weakenMem = ns.getScriptRam(PAYLOADS.WEAKEN);

    while (true) {
        const freeMem = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());
        // Checking if the host is at minimum security level, if not we weaken it.
        if (ns.getServerSecurityLevel(targetHost) > ns.getServerMinSecurityLevel(targetHost)) {
            const threads = Math.floor(freeMem / weakenMem);
            if (threads <= 0) {
                ns.alert("Not enough memory to run the weaken script for prepping.");
                ns.exit();
            }
            const pid = ns.run(PAYLOADS.WEAKEN, threads, targetHost);
            while (ns.isRunning(pid, ns.getHostname())) {
                await ns.sleep(200);
            }
        // Checking if the host has the most amount of money it can have, if not we grow it.
        } else if (ns.getServerMoneyAvailable(targetHost) < ns.getServerMaxMoney(targetHost)) {
            const threads = Math.floor(freeMem / growMem);
            if (threads <= 0) {
                ns.alert("Not enough memory to run the grow script for prepping.");
                ns.exit();
            }
            const pid = ns.run(PAYLOADS.GROW, threads, targetHost);
            while (ns.isRunning(pid, ns.getHostname())) {
                await ns.sleep(200);
            }
        }

        // Checking if host has the least amount of security it can have, and
        // that it has the most amount of money it can have. If both is true, we
        // break out of the loop and return.
        if (ns.getServerSecurityLevel(targetHost) <= ns.getServerMinSecurityLevel(targetHost) 
            && ns.getServerMoneyAvailable(targetHost) >= ns.getServerMaxMoney(targetHost)
        ) {
            break;
        }

        await ns.sleep(200);
    }
}