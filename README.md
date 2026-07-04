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


## Scripts
Currently there are 2 main scripts. The `mo-controller.js` and `mo-cloudservers.js`.


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


### Payload scripts
There are currently 4 payloads scripts. `mo-payload.js` which is the `ETH` script
from the documentation with some minor adjustments. Then you have the `mo-{hack,
grow, weaken}.js` scripts, which is planned to be used together with bactching,
which is code I am currently working on.

So right now in this commit, only `mo-payload.js` is being used.


## Credits
Below you can find a list of urls and Youtubers and other sources which
I have read and watched to get get ideas and understanding on how to
beat the game.

  - [Javascript tutorial - Geeks for geeks](https://www.geeksforgeeks.org/javascript/javascript-tutorial/)
  - [Casually Silent - Youtube](https://www.youtube.com/@casuallysilent)
  - Heavy use of the in game documentation