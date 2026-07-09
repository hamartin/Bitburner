/*
 * This script was literally copy pasted from this video: https://www.youtube.com/watch?v=85-A4rOJr5A&t=87s
 * I added some more stuff to it, but all the logic that makes this script nice, comes from that video.
 * The user account on Youtube: https://www.youtube.com/@theblackhat5473
 */

import { Server } from "../src/server";


/**
 * @typedef {{
 *  help: Boolean,
 *  sleepTime: Number,
 *  _: String[],
 * }} MyFlags
 */

/** @param {NS} ns */
export async function main(ns) {
  const flags = /** @type {MyFlags} */ (ns.flags([
    ["help", false],
    ["sleepTime", 1000],
  ]));

  if (flags._.length === 0 || flags.help) {
    ns.tprint("This script helps visualize the money and security information for a host.");
    ns.tprint(`Usage: run ${ns.getScriptName()} TARGETHOST --help <BOOLEAN> --sleeptime <TIME>`);
    ns.tprint("\t--help -> Shows this help screen.");
    ns.tprint("\t--sleepTime -> How long for the script to sleep between iterations. Defaults to 1000 equalling 1 second.");
    ns.tprint("\tExample:");
    ns.tprint(`\t> run ${ns.getScriptName()} joesguns`);
    return
  }

  const targetHost = new Server(ns, String(flags._[0]));

  // We prepare the logging.
  ns.ui.openTail();
  ns.disableLog('ALL');

  while (true) {
    const hostStats = targetHost.getCurrentInfo();
    ns.clearLog();
    ns.print(`${targetHost.hostName}:`);
    ns.print(` $_______: ${ns.format.number(hostStats.currentMoney, 3)} / ${ns.format.number(hostStats.maxMoney, 3)} (${(hostStats.currentMoney / hostStats.maxMoney * 100).toFixed(2)})`);
    ns.print(` security: +${(hostStats.currentSecurity - hostStats.minSecurity).toFixed(2)}`);
    ns.print(` hack____: ${ns.format.time(ns.getHackTime(targetHost.hostName))} (t=${Math.ceil(ns.hackAnalyzeThreads(targetHost.hostName, hostStats.currentMoney))})`);
    ns.print(` grow____: ${ns.format.time(ns.getGrowTime(targetHost.hostName))} (t=${Math.ceil(ns.growthAnalyze(targetHost.hostName, hostStats.maxMoney / hostStats.currentMoney))})`);
    ns.print(` weaken__: ${ns.format.time(ns.getWeakenTime(targetHost.hostName))} (t=${Math.ceil((hostStats.currentSecurity - hostStats.minSecurity) * 20)})`);
    await ns.sleep(flags.sleepTime);
  }
}

export function autocomplete(data, args) {
  return data.servers;
}