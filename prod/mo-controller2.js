import { prepHost } from "./src/hacking.js";
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
    ns.alert(`Remember that you have forced the code to use ${targetHost} so you can controll the devel of this script.`);

    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    // This gives us a tail window to monitor the situation around the targetHost.
    ns.run("./utilities/monitor.js", 1, targetHost);
    // Prepare the host, so we can get the required information to enable us to do batching.
    await prepHost(ns, targetHost);
}