import { Logger } from "./src/logger";
import { MyPlayer } from "./src/player";
import { Payloads } from "./src/payloads";
import { Server } from "./src/server";

import {
    HACK_PERCENTAGE,
}from "./src/constants";


/**
 * @typedef {{ 
 *     _: String[]
 * }} MyFlags
 */

/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns
 * @property {string[] | undefined} _[0] - Positional argument (same as ns.args[0]). The host name of the host to run the payload on. This effectively override the automatic host choosing.
 */
export async function main(ns) {
    /** @type {MyFlags} */
    const flags = /** @type {MyFlags} */ (ns.flags([]));
    const fixedHost = String(flags._[0]);

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const payloads = new Payloads(ns);
    const player = new MyPlayer(ns);
    const logger = new Logger(ns);

    const BATCH_OFFSET_TIME = 500;

    const attackingHost = new Server(ns, ns.getHostname(), payloads, logger);
    let targetHost;
    if (fixedHost === "undefined") {
        targetHost = new Server(ns, player.getBestHostToAttack(), payloads, logger);
    } else {
        targetHost = new Server(ns, fixedHost, payloads, logger);
    }
    await targetHost.prepHost();

    while (true) {
        if (fixedHost === "undefined") {
            const newTargetHost = new Server(ns, player.getBestHostToAttack(), payloads, logger);
            if (newTargetHost.hostName != targetHost.hostName) {
                targetHost = newTargetHost;
                logger.write(logger.INFO, `New optimal host to attack found ${targetHost}.`);
                // Prepare the host, so we can get the required information to enable us to do batching.
                await targetHost.prepHost();
            }
        }

        const threads = targetHost.getHackThreads(HACK_PERCENTAGE);
        if (attackingHost.getAvailableRam() > threads.totalRequiredRam) {
            const delays = player.getDelay(targetHost.hostName);

            const hackPid = ns.run(payloads.hackFileNameFull, threads.hack, targetHost.hostName, delays.hack);
            const hackWeakenPid = ns.run(payloads.weakenFileNameFull, threads.weakenHack, targetHost.hostName, delays.weakenHack);
            const growPid = ns.run(payloads.growFileNameFull, threads.grow, targetHost.hostName, delays.grow);
            const growWeakenPid = ns.run(payloads.weakenFileNameFull, threads.weakenGrow, targetHost.hostName, delays.weakenGrow);

            if (hackPid == 0 || hackWeakenPid == 0 || growPid == 0 || growWeakenPid == 0) {
                ns.alert("Failed to start the individual batch file hack/weaken/grow/weaken maybe to RAM")
                ns.exit()
            }
        }

        await ns.sleep(BATCH_OFFSET_TIME);
    }
}