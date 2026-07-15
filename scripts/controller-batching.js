import { Controller } from "../src/controller"


/**
 * Runs the controller for EGH or Batching with automatic target selection.
 * 
 * @param {NS} ns - Netscript context
 */
export async function main(ns) {
    const controller = new Controller(ns)
    await controller.runBatching()
    //await controller.runBatching("n00dles")
}