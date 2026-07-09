import { MyPlayer } from "../src/classes/player";
import { Payloads } from "../src/classes/payloads";
import { Server } from "../src/classes/server";

import { HACK_PERCENTAGE } from "../src/constants";


/** @param {NS} ns */
export async function main(ns) {
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    const player = new MyPlayer(ns);
    const payloads = new Payloads(ns);

    // Find the best host to attack
    const server = new Server(ns, player.getBestHostToAttack(), payloads);
    const threads = server.getHackThreads(HACK_PERCENTAGE);

    const hackRequiredRam = payloads.getRamRequirements(payloads.hackFileNameFull, threads.hack);
    const weakenHackRequiredRam = payloads.getRamRequirements(payloads.weakenFileNameFull, threads.weakenHack);
    const growRequiredRam = payloads.getRamRequirements(payloads.growFileNameFull, threads.grow);
    const weakenGrowRequiredRam = payloads.getRamRequirements(payloads.weakenFileNameFull, threads.weakenGrow);
    const totalRequiredRam = hackRequiredRam + weakenHackRequiredRam + growRequiredRam + weakenGrowRequiredRam;

    ns.print(`Best target host: ${server.hostName}\n\n`);
    ns.print(`Hacking:`);
    ns.print(`\tThreads: ${threads.hack}`);
    ns.print(`\tMin RAM required: ${hackRequiredRam}`);
    ns.print(`Growing:`);
    ns.print(`\tThreads: ${threads.grow}`);
    ns.print(`\tMin RAM required: ${growRequiredRam}`);
    ns.print(`Weaken - Hack:`);
    ns.print(`\tThreads: ${threads.weakenHack}`);
    ns.print(`\tMin RAM required: ${weakenHackRequiredRam}`);
    ns.print(`Weaken - Growing:`);
    ns.print(`\tThreads: ${threads.weakenGrow}`);
    ns.print(`\tMin RAM required: ${weakenGrowRequiredRam}`);
    ns.print(`\nTotals:`);
    ns.print(`\t Threads required: ${threads.total}`);
    ns.print(`\t RAM required: ${totalRequiredRam}`);
}