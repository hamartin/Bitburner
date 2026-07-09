/*
 * This script was literally copy pasted from this video: https://www.youtube.com/watch?v=85-A4rOJr5A&t=87s
 * I added some more stuff to it, but all the logic that makes this script nice, comes from that video.
 * The user account on Youtube: https://www.youtube.com/@theblackhat5473
 */

/**
 * @typedef {{
 *  help: Boolean,
 *  sleepTime: Number,
 *  _: String[],
 * }} MyFlags
 */

/** @param {NS} ns */
export async function main(ns) {
  /** @type {MyFlags} */
  const flags = /** @type {MyFlags} */ (ns.flags([
    ["help", false],
    ["sleepTime", 1000],
  ]));

  if (flags._.length === 0 || flags.help) {
    ns.tprint("This script helps visualize the money and security information for a host.");
    ns.tprint(`Usage: run ${ns.getScriptName()} TARGET --help <BOOLEAN> --sleeptime <TIME>`);
    ns.tprint("\t--help -> Shows this help screen.");
    ns.tprint("\t--sleepTime -> How long for the script to sleep between iterations. Defaults to 1000 equalling 1 second.");
    ns.tprint("\tExample:");
    ns.tprint(`\t> run ${ns.getScriptName()} joesguns`);
    return
  }
  const target = String(flags._[0]);

  // We prepare the logging.
  ns.ui.openTail();
  ns.disableLog('ALL');

  while (true) {
    const money = ns.getServerMoneyAvailable(target) === 0 ? 1 : ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    const sec = ns.getServerSecurityLevel(target);
    ns.clearLog();
    ns.print(`${target}:`);
    ns.print(` $_______: ${ns.format.number(money, 3)} / ${ns.format.number(maxMoney, 3)} (${(money / maxMoney * 100).toFixed(2)})`);
    ns.print(` security: +${(sec - minSec).toFixed(2)}`);
    ns.print(` hack____: ${ns.format.time(ns.getHackTime(target))} (t=${Math.ceil(ns.hackAnalyzeThreads(target, money))})`);
    ns.print(` grow____: ${ns.format.time(ns.getGrowTime(target))} (t=${Math.ceil(ns.growthAnalyze(target, maxMoney / money))})`);
    ns.print(` weaken__: ${ns.format.time(ns.getWeakenTime(target))} (t=${Math.ceil((sec - minSec) * 20)})`);
    await ns.sleep(flags.sleepTime);
  }
}

export function autocomplete(data, args) {
  return data.servers;
}