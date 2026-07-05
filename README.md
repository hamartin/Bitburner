# Bitburner
This is my attempt to beat the game Bitburner. I had miniscule
experience with Javascript and no experience with the
Netscript Javascript API which Bitburner uses.

All of the code is my interpretation of code found on forums, Youtube
and asking AI basic questions on how Javascript does things I know
how to do in Python.

Also, the goal is not to make super efficient code, only to beat the game in a
way I can understand it. So my choices might not make sense for someone who
actually knows how to code.

As I am writing more and more code and I am starting to learn a bit, I see that
I am taking doing a lot in the code which is unnecessary, but I do it anyway to
get a feel for the language and working my self through each challenge I see in
front of me.


## Scripts
Currently there are 4 main scripts. The `mo-controller.js`,
`mo-cloudservers.js`, `mo-wse.js` and `mo-wse-stock-cleanup.js`.

The rest of the files are payloads to be uploaded to servers at need.


### Controller
The controller script runs "forever", meaning it runs a loop, where it collects
information about all the visible hosts on the network, checks if we are able to
hack it and if we are able, the script hacks it automatically. Since the process
goes in a loop, at a later time if a server we were not able to hack is now
hackable, then it will hack the server.

When a server is hacked, the payloads are also copied to the server and then the
controller starts a process on the remote server, making sure to use as many
threads as possible to max out the available RAM.


### Cloud servers
The cloud server script loops forever until the script no longer can buy/upgrade
cloud servers anymore.

The script starts by automatically buying cloud servers with the lowest tier RAM
until it has maxed out the number of cloud servers one can own. When the number
of servers are maxed out, it starts upgrading each server until it no longer can
upgrade a server because there are no more upgrade options. At this time, the
script will exit with a message.


### World Stock Exchange
The file `mo-wse.js` will run forever, buying longs and shorts when the
forecast show signs that we can earn money on it. It also closes the position
when there are signs that it will not be profitable any more.

At some point, you might want to kill the script which will leave you with a set
of positions not being closed. The script `mo-wse-stock-cleanup.js` simply
iterates over all symbols, checks if you have a position on that symbol and
closes it, with no regards to if it is proffitables or not.


### Payload scripts
There are currently 4 payloads scripts. `mo-payload.js` which is the `ETH` script
from the documentation with some minor adjustments. Then you have the `mo-{hack,
grow, weaken}.js` scripts, which is planned to be used together with bactching,
which is code I am currently working on.

So right now in this commit, only `mo-payload.js` is being used.


### Utility scripts
There is a set of utility scripts which I made to simplify things for my self
when debugging or when I have to kill processes and there are stuff left behind
around the game.

- mo-not-backdoored.js
  Prints the path to all servers you are able to backdoor on your current level
  in a sorted manner.
- mo-sell-cloudservers.js
  Kills all processes running on all player bought cloud servers and then
  deletes them.
- mo-wse-stock-cleanup.js
  If the `mo-wse.js` script dies or you kill it, there will be a set of
  longs/shorts  which is just sitting there without supervision. This script
  will simply close every long/short, not caring if you make money or loose
  money.
- mo-read-literature.js
  On the different servers, you might find a `.lit` file. It contains
  information/storyline/hints maybe to the game. You can read the content using
  this script.
- mo-find-contracts.js
  Another utility scripts very similar to `mo-not-backdoored.js`. It goes
  through every single server on the network and prints the full path and
  filename to any contract on any host on the network.
- mo-contract.js
  I tried creating something that could solve a problem. I will keep on adding
  them as I find the desire to solve more problems. These are the contacts you
  find around on the different servers.


## Credits
Below you can find a list of urls and Youtubers and other sources which
I have read and watched to get get ideas and understanding on how to
beat the game.

  - [Javascript tutorial - Geeks for geeks](https://www.geeksforgeeks.org/javascript/javascript-tutorial/)
  - [Casually Silent - Youtube](https://www.youtube.com/@casuallysilent)
  - Heavy use of the in game documentation
  - Copilot has answered every single dumb question I have with satisfaction