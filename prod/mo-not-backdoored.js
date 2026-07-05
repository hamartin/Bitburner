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
    ns.ui.openTail(); // open tail window

    const hackingLevel = ns.getHackingLevel();

    // Build full network tree
    const tree = await buildTree(ns, "home");

    // Collect servers that:
    // - are NOT purchased
    // - are rooted
    // - do NOT have a backdoor
    // - CAN be backdoored (hacking level high enough)
    const pending = [];
    collectPending(tree, ns, hackingLevel, pending);

    if (pending.length === 0) {
        ns.print("✔ All eligible hosts have a backdoor installed.");
        return;
    }

    // Sort alphabetically by path and print.
    const lines = pending.map(node => buildFullPath(node).join(" → "));
    lines.sort();
    ns.print("⛔ Hosts that still need a backdoor:\n");
    for (const line of lines) ns.print(line);
}

/**
 * @typedef {{ host: string, parent: TreeNode | null, children: TreeNode[] }} TreeNode
 */

/**
 * @param {NS} ns
 * @param {string} host
 * @param {TreeNode | null} parent
 * @param {Set<string>} visited
 * @returns {Promise<TreeNode>}
 */
async function buildTree(ns, host, parent = null, visited = new Set()) {
    /** Build tree structure, storing real parent nodes */
    visited.add(host);

    /** @type {TreeNode} */
    const node = { host, parent, children: [] };

    for (const neighbor of ns.scan(host)) {
        if (visited.has(neighbor)) continue;

        const details = ns.getServer(neighbor);
        if (details.purchasedByPlayer) continue; // exclude purchased servers

        const child = await buildTree(ns, neighbor, node, visited);
        node.children.push(child);
    }

    return node;
}

function collectPending(node, ns, hackingLevel, list) {
    /** Collect nodes that are rooted, backdoor‑eligible, and not yet backdoored */
    const details = ns.getServer(node.host);

    const rooted = details.hasAdminRights;
    const needsBackdoor = !details.backdoorInstalled;
    const canBackdoor = hackingLevel >= details.requiredHackingSkill;

    if (rooted && needsBackdoor && canBackdoor && node.host !== "home") {
        list.push(node);
    }

    for (const child of node.children) {
        collectPending(child, ns, hackingLevel, list);
    }
}

function buildFullPath(node) {
    /** Build full path from home to this node */
    const path = [];
    let current = node;

    while (current) {
        path.unshift(current.host);
        current = current.parent;
    }

    return path;
}