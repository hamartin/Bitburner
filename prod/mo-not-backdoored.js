//
// This whole file is created by Copilot in pure vibecoding. I originally had a
// script which just printed the path to all hosts where a backdoor was not
// installed yet, but It was hard to read.
//
// The original code just printed to the terminal, meaning the information got
// lost as you ran connect/analyze/backdoor on the hosts. No you can have the
// tail window open while you move around doing the work you need to do.
//

export async function main(ns) {
    ns.ui.openTail(); // Open tail window for clean output

    const hackingLevel = ns.getHackingLevel();
    const tree = await buildTree(ns, "home");

    // Collect all nodes that still need backdoors
    const pending = [];
    collectPending(tree, ns, hackingLevel, pending);

    if (pending.length === 0) {
        ns.print("✔ All hosts have a backdoor installed.");
        return;
    }

    ns.print("⛔ Hosts that still need a backdoor:\n");
    printPendingTree(ns, tree, hackingLevel);
}

/** Build tree structure, excluding purchased servers */
async function buildTree(ns, host, parent = null, visited = new Set()) {
    visited.add(host);

    const children = [];
    for (const neighbor of ns.scan(host)) {
        if (visited.has(neighbor)) continue;

        const details = ns.getServer(neighbor);

        // Skip purchased servers
        if (details.purchasedByPlayer) continue;

        children.push(await buildTree(ns, neighbor, host, visited));
    }

    return { host, parent, children };
}

/** Collect nodes that still need backdoors */
function collectPending(node, ns, hackingLevel, list) {
    const details = ns.getServer(node.host);

    const reachable = hackingLevel >= details.requiredHackingSkill;
    const needsBackdoor = !details.backdoorInstalled;

    if (reachable && needsBackdoor && node.host !== "home") {
        list.push(node.host);
    }

    for (const child of node.children) {
        collectPending(child, ns, hackingLevel, list);
    }
}

/** Print only nodes that still need backdoors, in tree form */
function printPendingTree(ns, node, hackingLevel, prefix = "", isLast = true) {
    const details = ns.getServer(node.host);

    const reachable = hackingLevel >= details.requiredHackingSkill;
    const needsBackdoor = !details.backdoorInstalled;

    // Only show nodes that need backdoors (except home)
    const showNode = reachable && needsBackdoor && node.host !== "home";

    const connector = prefix.length === 0
        ? ""
        : isLast ? "└─ " : "├─ ";

    if (showNode) {
        const path = buildPath(node);
        ns.print(`${prefix}${connector}${node.host}`);
        ns.print(`${prefix}   Path: ${path}`);
    }

    const newPrefix = prefix + (isLast ? "   " : "│  ");

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        printPendingTree(ns, child, hackingLevel, newPrefix, i === node.children.length - 1);
    }
}

/** Build path from home to this node */
function buildPath(node) {
    const path = [];
    let current = node;
    while (current) {
        path.unshift(current.host);
        current = current.parent ? { host: current.parent, parent: null } : null;
    }
    return path.join(" → ");
}