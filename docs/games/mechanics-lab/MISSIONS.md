# Scenario games laboratory

8 October 2026. Route `/lab/missions`. These are six independent game drafts plus eight previous simulators on a separate page, not “14 identically finished games.”

The catalog has been expanded to [100 game scenarios](CATALOG_100.md). This document describes the six original missions; the new document fixes the composition of the 94 added ones, their stages, general rules and implementation boundaries.

## General rule

Learning action changes the game world. The calculation determines the design, the understanding of the replica determines the accessible route, the geometry determines the price, and the reconstructed event determines the search location. One multiple choice question is not enough for a new game.

Each mission contains 3-4 stages with several types of actions. The stock and decisions made are not reset during the transition. There are unexpected circumstances, but they can be calmly dealt with without a mandatory timer. Checking does not destroy progress. Actual duration and interest for different ages have not yet been measured.

Buttons and cells from 44 px, regular DOM and one SVG for the network, without 3D and a constant rendering cycle. Saving: separate keys `corgi.missions.v1.<id>`, the entire course on this device. There is no access to avatar keys, pets, previous games or reviews of simulators. The mark of interest at the end of the mission is currently only valid until the exit; the interface explicitly states this. Shared island, AI content, online co-op and long campaign are not included here.

## 1. Crossing after the storm

Purpose: sum of lengths, expression of carrying capacity, estimate and distribution of indivisible cargo. Game actions: route selection, construction, packing, repair/transplant after the event.

1. Reconnaissance suggests a lowland with a span of 6 m or a pass with a span of 8 m. The forecast indicates in advance the risk: in the lowland the bridge will need to be extended by 2 m, at the pass there will be a transfer to three carts of 5 kg each. The choice is confirmed by the “Select route” button.
2. Warehouse: two beams of 2, 3, 4 m. Clicking adds a beam; pressing the installed one removes it. Mounts 0–2; a meter of beam costs 1, fastening costs 2, budget 14. The student calculates the limit `2 + 2 × mounts`. The "Test Bridge" button tests length, storage, budget and the ability to transport 12 kg with two trolleys.
3. Four boxes: water 4, food 3, tools 3, walkie-talkie 2 kg. The selectors distribute the boxes, the fields compile a weight list. Missing box, incorrect amount, overload return specific reason. Before the flight, you can return to the design.
4. The state is saved. Lowland: the original beams remain; The bridge must be brought to 8 m, then the load must be confirmed. Pass: the bridge is ready, but the previous 6/6 distribution is no longer suitable; you need to place the boxes on three carts with a limit of 5.

Examples of passage: bridge 2+4, two fastenings, loads (4+2)/(3+3); after the flood add 2. Or bridge 4+4 and transfer 4/(3+2)/3. Other valid assemblies and permutations are suitable. The early choice changes exactly the last game task.

## 2. Last reserve

Purpose: order of operations, function on several inputs, energy balance, flow planning by moves. Game actions: program assembly, signal diagnostics, launch/network selection, reserve distribution.

1. The reactor performed `y = 3(x + 2)`. There are two sockets and modules +2, ×3, −2, ×2. You can remove any installed module. The table immediately shows tests at inputs 2, 4, 6; the check does not accept a match of only one output.
2. There are 8 cells on board. The student chooses to start at 4 or 6, then the network: the direct line loses 4 energy, the stabilizer loses 2 and eats another fuel cell. Minimum supply for launching compartments: oxygen 6, communications 4, shield 4. The excess is consumed; the remaining energy and unused fuel, 4 each, are converted into emergency reserves.
3. The storm forecast is visible in its entirety. Oxygen requires 2 each turn, shield 1/3/2. The “Make a move” button checks the current need and the sufficiency of the balance for future moves. Success deducts energy, clears the current turn's input, and changes the active momentum. An unsuccessful test does not write off the resource.

Four startup/network strategies give reserves of 16, 14, 14, 12 at minimum supply; all are passable. Minimum costs for moves 3, 5, 4. A weak strategy has less rights to overfeed. You can recalculate the start before turning on the compartments. More output does not mean more final reserve.

## 3. Meet me after the rain

Goal: extract restrictions from an English conversation, understand an announcement, agree on a change of plans; related arithmetic of time and budget.

1. In the conversation, Maya says the deadline is 15:10, a heavy cart with no access to stairs and £12 for the whole journey. The student himself asks the necessary questions. There is an optional question about paintings. The collected remarks go into the opened correspondence.
2. Start 14:00. Bus: £3/30 minutes, Taxi: £8/15 minutes, Metro: £2/20 minutes, but the lift is broken. The travel sheet requires you to calculate the remainder and duration. Getting the arithmetic right doesn't make metro suitable for Maya.
3. It takes 15 minutes to receive the box, then the ad reschedules the appointment. Library Hall is accessible without steps, Roof Café is accessible only by stairs. Transfer: flat path 20 minutes free or Shuttle 5 minutes/£5. Slots 15:00, 15:05, 15:10.
4. The first transport determines a new choice: bus + walk does not arrive in time by 15:00, but is in time by 15:05; After a taxi there is no money for Shuttle, but on foot you can get there by 15:00. From the fragments a message is assembled with a new place, confirmed by time and reason. Both natural orders of circumstances of place and time are accepted. Maya then asks a question about entering; The student confirms the available entrance at the new address.

Mistakes don't reset the conversation. There is no penalty for slow reading. Branching changes time, money and the text of the final message. We do not yet implement free speech, voice recognition and free English assessment.

## 4. Quarter by the river

Goal: area, outer perimeter, estimate and path connectivity. Game actions: drawing a plan, budgeting, building paths, choosing a defense/bypass.

1. Field 5x5, cage 1 m². You cannot build on the rocks and the entrance; The cells adjacent to the entrance are left for the path. The clinic needs 6 side-connected cells. The student enters the area and outer perimeter himself. The form is free, properties are checked, it does not match the template.
2. The floor costs 2 per square, the wall costs 1 per meter. Total budget 42. After the construction permit, paths are marked, 2 per square. There must be a path from the entrance to the clinic side. Excess cells can be removed with a refund.
3. A rainstorm floods a cell on the actually used path found by traversing the graph; This is not a random decorative cage. The structure of the clinic and the entire network are preserved. You can buy a drainage system for 4 or conduct a dry bypass. Taking the second route in advance also works.

Example: a 2x3 rectangle has an area of ​​6, a perimeter of 10, a price of 22. There are 2 more entrance paths. After flooding, a drainage system or a bypass of two cells is suitable. A less compact form is more expensive, changes the geography of approaches and the remaining budget.

## 5. Museum: The Lost Route

Purpose: English reading, checking evidence, time correction, evidentiary version, coordinates and debugging of the program.

1. The camera shows Leo entering with the box at 2:15 p.m. The caretaker closed the hall at 14:12, but saw Leo already come out with the box. The invoice gives the address of the restoration and the northern corridor. The note about Mia is additional evidence that is not necessary for the conclusion.
2. The partner's directory says: the camera is in a hurry for five minutes; Leo came out a minute before closing. The student enters the chronology 14:10 → 14:11 → 14:12. The visible directory hides the student controls. Alone, it can be read as a hint.
3. Of the three versions, you need to choose the restoration one and exactly two pieces of evidence: the caretaker and the invoice. A guessed address alone is not enough. The camera itself does not prove the exit from the hall.
4. Now the courier goes from (0;0) to (4;4). The partner knows the wet cells (1;2), (2;2), (3;2). The student writes a program N/E/S/W up to 12 steps; Removing any step allows you to repair the location of the error. The test run shows the actual distance traveled and stops in front of the wall/water. Jumping over the edge of a line is prohibited.

Local co-op: one screen, role switching. There is no second network client and no technical hiding of data from the person who opened the directory himself. The tutor conveys the conditions and helps interpret the evidence, and the student performs the actions.

## 6. A city on two lines

Goal: graph connectivity, overall infrastructure cost, capacity and schedule. Game actions: network design, redistribution of cars, launch of a flight, restructuring after an event.

1. A connects the depot, school and park. B - depot, market and house. Each road has a cost of 2 or 3. The network shares a budget of 9; the road used by both lines is paid once. The buttons select the active line and turn on/off lines. The map shows the choice.
2. Total stock 5 cars, capacity 2. Queues A/B - 4/6: 2/3 cars needed. If there is a common route, the departures are separated by 2 minutes. Separate lines can depart simultaneously.
3. After the first flight, the Market-House closes, B must connect the clinic, the queues change to 6/4. The budget increases to 13. The old network remains, the closed section needs to be removed and a detour made.
4. Before the second departure, you need to move the car from B to A. If a common section appears, the old simultaneous departure is no longer suitable. Connectivity, budget, capacity, and schedule are all checked.

The network allows for branches - this is a training diagram of connectivity, not a physical simulation of trains. The 2 minute dilution rule is a clear game simplification. Common stages are marked in two colors, closed ones are marked with a red dotted line. Animation of moving trains is not yet needed to test solutions.

## Sources of inspiration

The primary pages of developers/publishers were studied, October 8, 2026. This is a sample, not a review of all games and not a rating of the current online game. Below are the declared properties of the original and our adaptation. The code, characters, levels and visual materials of the originals were not carried over.

| Source | What the page confirms | Our interpretation for learning |
| --- | --- | --- |
| [Human Resource Machine](https://tomorrowcorporation.com/humanresourcemachine) | Employee programming, sequence of commands, tasks with additional optimization | Build the program → observe several outputs → correct the order; link output to station resources |
| [Mini Metro](https://dinopoloclub.com/games/mini-metro/) | Construction of lines, new stations and redistribution of limited resources | Learning Network with Total Budget, Capacity and Demand Changing Event |
| [Build A Boat For Treasure](https://www.roblox.com/games/537413528/Build-A-Boat-For-Treasure) | Build a boat and go on an adventure | Design before travel, then test under new conditions; we do not attribute our bridge/load mechanics to the original |
| [DOORS](https://www.roblox.com/games/6516141723/DOORS) | Exploring and learning from failures in the door game | Hypothesis → verification → new attempt without losing the entire mission; the current museum uses this as a general principle, does not copy horror |
| [Keep Talking and Nobody Explodes](https://keeptalkinggame.com/) | Different information from the operator and the reader of the instructions, the need for communication | The partner knows the reference book, the student acts; common goal without competition with a tutor |
| [Euclidea](https://www.euclidea.xyz/) | Geometric constructions, automatic verification, search for a more economical solution | Accept different designs based on mathematical properties; compact shape leaves more resources |
| [DragonBox Algebra 12+](https://dragonbox.com/products/algebra-12) | Operations with expressions, signs, parentheses, fractions and substitution | The algebraic action should control the system within the mission, and not be a separate pass after a random battle |

Roblox without JavaScript does not provide a reliable assessment of current players; numerical popularity statements were not used.

## What to watch for when testing

- Does the student understand why he is performing the calculation before prompting from an adult?
- Does he want to change his first choice and try a different route, design, or network?
- Does he notice the consequences of his actions at the next stage?
- Is there interest in the world between learning activities, or is there still a sense of sequence of tasks?
- What percentage of the time is spent reading the rules and what percentage of the time is spent making decisions?
- Should I shorten the mission for the lesson or make a separate continuation for the remote control?

Automatic completion confirms the rules and interface, but does not prove the child’s interest or educational effect. Based on the results of the live test, we choose which scenarios to deepen; We do not make further graphics until this selection.
