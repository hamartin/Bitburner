/**
 *
 * Algorithmic Stock Trader I
 * You are attempting to solve a Coding Contract. You have 5 tries remaining, after which the contract will self-destruct.
 *
 *
 * You are given the following array of stock prices (which are numbers) where the i-th element represents the stock price on day i: 
 * 
 * 174,88,48,83,98,94,176,130,46,187,180,40,42,145,74,159,51,131,33,172,121,55,83,189,172,105,34,109,185,132,197,79,79,200,177,169,181 
 * 
 * Determine the maximum possible profit you can earn using at most one transaction (i.e. you can only buy and sell the stock once). If no profit can be made then the answer should be 0. Note that you have to buy the stock before you can sell it. 
 *
 *
 * If your solution is an empty string, you must leave the text box empty. Do not use "", '', or ``.
 */ 

/**
 * @typedef {{
 *     fileName: String
 *     hostName: String
 *     contractType: String
 *     help: Boolean
 * }} MyFlags
 */

/**
 * @param {NS} ns
 * @returns
 */
export async function main(ns) {
  const flags = /** @type {MyFlags} */ (ns.flags([
    ["fileName", ""],
    ["hostName", ""],
    ["contractType", ""],
    ["help", false],
  ]));

  /** @type {String[]} */
  const contractTypes = ns.codingcontract.getContractTypes();
  if (!flags.fileName || !flags.hostName || !flags.contractType || flags.help) {
    ns.tprint(`Usage: run ${ns.getScriptName()} --fileName <FILENAME> --hostName <NAME> --contractType <TYPE> --help true`);
    ns.tprint("\t--fileName -> The filename to the file that has the contract.");
    ns.tprint("\t--hostName -> The hostname to the server which has the file on it.");
    ns.tprint("\t--contractType -> The type of contract to solve. Type something random to get a list of types.");
    return
  } 

  if (!contractTypes.includes(flags.contractType)) {
    ns.tprint(`Contract type ${flags.contractType} does not exist.`);
    ns.tprint("You can choose between the following contract types:");
    for (const ctype of contractTypes) {
        ns.tprint(`\t${ctype}`);
    }
  }

  // Get the contract data and description. Print the description.
  const data = ns.codingcontract.getData(flags.fileName, flags.hostName);
  const description = ns.codingcontract.getDescription(flags.fileName, flags.hostName);
  ns.tprint(description);

  let reward = undefined;
  if (flags.contractType == "Total Ways to Sum") {
    const solution = solveTotalWaysToSum(ns, data);
    reward = ns.codingcontract.attempt(solution, flags.fileName, flags.hostName);
    ns.tprint(`Total Ways to Sum: ${solution}`);
  } else {
    ns.tprint(`The script does not support the coding contract ${flags.contractType} yet.`);
    return;
  }

  if (reward) {
    ns.tprint(`Contract solved successfully! Reward: ${reward}`);
  } else {
    ns.tprint("Failed to solve contract.");
  }
}

/**
 * 
 * @param {NS} ns 
 * @param {Object} data 
 * @returns {Number}
 */
function solveTotalWaysToSum(ns, data) {
    const target = data[0];
    const dataSet = data[1];

    // Create dp array of size target+1 filled with 0s.
    const dp = [];
    for (let i = 0; i < target+1; i++) {
        dp.push(0);
    }
    // Base case: One way to make 0 (use nothing).
    dp[0] = 1; 

    for (const number of dataSet) {
        for (let i = number; i < target+1; i++) {
            dp[i] += dp[i-number];
        }
    }
    return dp[target];
}