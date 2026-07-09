import { Logger } from "./classes/logger.js";
import { Payloads } from "./classes/payloads.js";


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
export async function prepHost(ns, targetHost) {
    const payloads = new Payloads(ns);
    const logger = new Logger(ns);

    const growMem = payloads.getRamRequirements(payloads.growFileNameFull);
    const weakenMem = payloads.getRamRequirements(payloads.weakenFileNameFull);

    logger.write(logger.INFO, `Starting to prepare host ${targetHost}.`);
    logger.write(logger.INFO, `This might take some time. You can see the progress doing > run ./utilities/monitor.js ${targetHost}`);
    while (true) {
        const freeMem = ns.getServerMaxRam(ns.getHostname()) - ns.getServerUsedRam(ns.getHostname());
        // Checking if the host is at minimum security level, if not we weaken it.
        if (ns.getServerSecurityLevel(targetHost) > ns.getServerMinSecurityLevel(targetHost)) {
            const threads = Math.floor(freeMem / weakenMem);
            if (threads <= 0) {
                ns.alert("Not enough memory to run the weaken script for prepping.");
                ns.exit();
            }
            const pid = ns.run(payloads.weakenFileNameFull, threads, targetHost, 0);
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
            const pid = ns.run(payloads.growFileNameFull, threads, targetHost, 0);
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
            logger.write(logger.INFO, `Finished preparing host ${targetHost}.`);
            break;
        }

        await ns.sleep(200);
    }
}

/**
 * This helper allows you to call one function and get the growth time. If
 * Formulas are available, then it will use that instead of the default one.
 * 
 * @param {NS} ns       - Netscript context 
 * @param {string} host - Hostname of the host we are calculating the growth time for
 * @returns {number}
 */
export function getGrowTime(ns, host) {
    if (ns.fileExists("Formulas.exe", "home")) {
        const server = ns.getServer(host);
        const player = ns.getPlayer();
        return ns.formulas.hacking.growTime(server, player);
    }

    return ns.getGrowTime(host);
}