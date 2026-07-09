//
// This whole file is created by Copilot in pure vibecoding. I originally had a
// script which just printed the path to all hosts where a backdoor was not
// installed yet, but It was hard to read.
//
// The original code just printed to the terminal, meaning the information got
// lost as you ran connect/analyze/backdoor on the hosts. No you can have the
// tail window open while you move around doing the work you need to do.
//

/**
 * 
 * @param {NS} ns 
 * @returns 
 */
export async function main(ns) {
    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    const hackingLevel = ns.getHackingLevel();
    const tree = await buildTree(ns, "home");
    const pending = [];
    collectPending(tree, ns, hackingLevel, pending);

    if (pending.length === 0) {
        ns.print("✔ All eligible hosts have a backdoor installed.");
        return;
    }

    // Sort alphabetically by path and print.
    const lines = pending.map(node => buildConnectCommand(buildFullPath(node)));
    lines.sort();
    ns.print("⛔ Hosts that still need a backdoor:\n");
    for (const line of lines) ns.print(line);
}

/**
 * @param {NS} ns
 * @param {String} host
 * @param {TreeNode | null} parent
 * @param {Set<String>} visited
 * @returns {TreeNode}
 */
function buildTree(ns, host, parent = null, visited = new Set()) {
    /** Build tree structure, storing real parent nodes */
    visited.add(host);

    /** @type {TreeNode} */
    const node = { host, parent, children: [] };

    for (const neighbor of ns.scan(host)) {
        if (visited.has(neighbor)) continue;

        const details = ns.getServer(neighbor);
        if (details.purchasedByPlayer) continue;

        const child = buildTree(ns, neighbor, node, visited);
        node.children.push(child);
    }

    return node;
}

/**
 * 
 * @param {TreeNode} node 
 * @param {NS} ns 
 * @param {Number} hackingLevel 
 * @param {TreeNode[]} list 
 */
function collectPending(node, ns, hackingLevel, list) {
    /** Collect nodes that are rooted, backdoor‑eligible, and not yet backdoored */
    const details = ns.getServer(node.host);

    const rooted = details.hasAdminRights;
    const needsBackdoor = !details.backdoorInstalled;
    const canBackdoor = hackingLevel >= (details.requiredHackingSkill ?? Infinity);

    if (rooted && needsBackdoor && canBackdoor && node.host !== "home") {
        list.push(node);
    }

    for (const child of node.children) {
        collectPending(child, ns, hackingLevel, list);
    }
}

/**
 * 
 * @param {TreeNode} node 
 * @returns {String[]}
 */
function buildFullPath(node) {
    /** Build full path from home to this node */
    const path = [];
    /** @type {TreeNode | null} */
    let current = node;

    while (current) {
        path.unshift(current.host);
        current = current.parent;
    }
    return path;
}

/**
 * Convert ["home","n00dles","foodnstuff"]
 * into "home; connect n00dles; connect foodnstuff"
 * @param {String[]} path
 * @returns {String}
 */
function buildConnectCommand(path) {
    const [first, ...rest] = path;
    let cmd = "  " + first; // always "home"
    for (const host of rest) {
        cmd += `; connect ${host}`;
    }
    cmd += "; backdoor";
    return cmd;
}