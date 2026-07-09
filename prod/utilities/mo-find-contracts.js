/** @param {NS} ns **/
export async function main(ns) {
    // We prepare the logging.
    ns.ui.openTail();
    ns.disableLog('ALL');
    ns.clearLog();

    const tree = buildTree(ns, "home");
    const found = [];
    collectContracts(tree, ns, found);

    if (found.length === 0) {
        ns.print("✔ No coding contracts found on the network.");
        return;
    }

    // Build sorted output
    const lines = [];
    for (const entry of found) {
        const path = buildFullPath(entry.node).join(" → ");
        const files = entry.files.join(", ");
        lines.push(`${path}   [${files}]`);
    }
    lines.sort();

    ns.print("📦 Coding Contracts Found:\n");
    for (const line of lines) ns.print(line);
}

/**
 * Build a tree of the entire network, skipping purchased servers.
 * @param {NS} ns
 * @param {String} host
 * @param {TreeNode | null} parent
 * @param {Set<String>} visited
 * @returns {TreeNode}
 */
function buildTree(ns, host, parent = null, visited = new Set()) {
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
 * Collect all hosts that contain .cct files.
 * @param {TreeNode} node
 * @param {NS} ns
 * @param {{ node: TreeNode, files: String[] }[]} list
 */
function collectContracts(node, ns, list) {
    const files = ns.ls(node.host, ".cct");
    if (files.length > 0) {
        list.push({ node, files });
    }

    for (const child of node.children) {
        collectContracts(child, ns, list);
    }
}

/**
 * Build full path from home to this node.
 * @param {TreeNode} node
 * @returns {String[]}
 */
function buildFullPath(node) {
    const path = [];
    /** @type {TreeNode | null} */
    let current = node;

    while (current) {
        path.unshift(current.host);
        current = current.parent;
    }
    return path;
}