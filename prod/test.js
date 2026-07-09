import { Controller } from "./src/controller";

/** @param {NS} ns */
export async function main(ns) {
    // Disable all logging from Netscript and open a tail window.
    ns.ui.openTail();
    ns.disableLog("ALL");
    ns.clearLog();

    const controller = new Controller(ns);
    await controller.run();
}