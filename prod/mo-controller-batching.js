import { Logger } from "./src/logger";
import { MyPlayer } from "./src/player";
import { Payloads } from "./src/payloads";
import { Server } from "./src/server";

import { HACK_PERCENTAGE } from "./src/constants";


/**
 * @typedef {{
 *     help?: Boolean,
 *     _?: number[],
 * }} MyFlags
 */

/**
 * Controller script. This will focus on batching for the time being.
 * 
 * @param {NS} ns - Netscript context
 * @returns
 */
export async function main(ns) {
    const flags = /** @type {MyFlags} */ (ns.flags([
        ["help", false],
    ]));

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const payloads = new Payloads(ns);
    const player = new MyPlayer(ns);
    const logger = new Logger(ns);

    let batchDelay = 500;
    if (flags._ && flags._.length !== 0) { 
        batchDelay = Number(flags._[0]);
    }

    if (flags.help) {
        logger.write(logger.INFO, `Usage: run ${ns.getScriptName()} <BATCH DELAY> --help`)
        logger.write(logger.INFO, "\t--help -> Shows this message.");
        return;
    }

    const attackingHost = new Server(ns, ns.getHostname());
    let targetHost = new Server(ns, player.getBestHostToAttack());
    await targetHost.prepHost();

    while (true) {
        const newTargetHost = new Server(ns, player.getBestHostToAttack());
        if (newTargetHost.hostName != targetHost.hostName) {
            targetHost = newTargetHost;
            logger.write(logger.INFO, `New optimal host to attack found ${targetHost.hostName}.`);
            // Prepare the host, so we can get the required information to enable us to do batching.
            await targetHost.prepHost();
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
        await ns.sleep(batchDelay);
    }
}