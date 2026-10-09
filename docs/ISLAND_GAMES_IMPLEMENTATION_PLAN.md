# Island sequential game development plan

Updated October 9, 2026. The user changed the priority: first, more simplified games to test interest in the mechanics. We simplify only the appearance; We save the scenario, goal, limitations, solutions, consequences of errors and completion. The development of graphics, a common island and large game implementations are postponed until the selection.

User clarification: the game should not consist of one repeatable mechanic. The current development unit is a completed mission with several associated activities. A decision at one stage changes the resources, conditions, or available paths at the next.

New clarification: we need gamification, the principle of “showing action and consequences” and three formats - single, presentation and joint. By presentation format in the current plan we mean a controlled game on a common screen: the tutor leads the rounds, the student makes decisions, and the field plays out the result. The “show” includes a visual disclosure of the result and development of the situation; a question with a button to open the answer itself does not meet this criterion. This is a working interpretation, not a requirement to copy a television quiz show.

Current batch - [100 game scenarios](games/mechanics-lab/CATALOG_100.md) on `/lab/missions`: [six original missions](games/mechanics-lab/MISSIONS.md) with separate rules and 94 new missions in 11 subject areas. Of the 94 new missions, 61 retain three stages based on common mechanics, and 33 have been reworked into continuous games with a persistent field. That's 100 scenarios on general gaming systems. The unfinished move is saved in the browser. [The previous eight mechanics](games/mechanics-lab/SCENARIOS.md) are left on `/lab/mechanics` as separate short simulators they are not included in the hundred.

Next: user sample of the catalog → selection of interesting combinations → deepening of the selected games. In the 61 original missions, the three actions are linked by a common supply and scenario; in 33 reworked ones, existing objects, tracks, documents and line design are preserved. Decisions with refunds can be reconsidered. For selected missions, we deepen the subject consequences, branches and repeat tasks. Reworked scenarios already keep decisions within the game loop; We apply the same requirements to the remaining ones. The number of screens or questions should not be passed off as the number of different mechanics.

After the new clarification, the priority has been changed: first check and rework weak scenarios according to [gameplay criteria](#gameplay criteria), then submit them for selection as games. The maneuverability of 100 prototypes has been confirmed; The quality of 100 full-fledged games has not been confirmed. Do not replace this stage with new names and rearrangements of previous exercises.

## Gameplay criteria

1. The student acts with objects and rules: builds, directs, distributes, explores, negotiates. The state of the field exists between actions and changes as a result of a decision.
2. Study skill is necessary for game performance. The dependence being studied determines the behavior of the system: the calculation changes the load capacity, the angle changes the direction, the meaning of the English replica changes the action of the interlocutor. Points for an individual question do not replace such a connection.
3. The check shows the result on the field: the cargo arrives or gets stuck, the flow is divided, the mechanism is triggered, the visitor goes to the selected place. A short explanation completes the observation. Simple shapes, lines and short transitions are sufficient; heavy graphics are not needed.
4. The decision affects the next move in a meaningful way: the constructed path, the composition of the cargo, the promise to the character, or the selected evidence are saved. One general stock counter is not enough.
5. There is a task with a choice, an obstacle, a trial and a correction. Changing the situation affects the actual object or rule, and not just the text and an arbitrary penalty.
6. The finish shows the game goal achieved and the knowledge contribution. Rewards and achievements can complement the result, but are not proof of interesting mechanics.
7. Cards, reading and sorting are acceptable as part of the game if their content changes the action or the world. The text itself is not considered a flaw; no consequences are considered.

### Formats

| Format | Who acts | Desired behavior | What is not considered a ready-made format |
| --- | --- | --- | --- |
| Single | Student | Independent short mission; the system plays out the consequences, helps to understand, maintains progress | Chain “read → choose → next text” |
| Presentation | The student makes the decisions, the tutor controls the presentation and pace | General field, preparation of a solution, separate test launch, visual disclosure, pause for discussion, new conditions for the next round | Regular quest page via screen sharing |
| Joint | Student and partner with different roles | Additional information or actions, common purpose, need to explain and agree; the key educational decision remains with the student | The teacher knows the answer and competes for speed; hint button named co-op |

There is no need to add all three modes to each template. The format is chosen based on mechanics. Network connection, separate screen and information security are described separately; Local role changes do not count as online play.

### Audit of the current hundred and the nearest queue

- Structural check of 94 new missions: 33 contain at least two stage types `sequence`, `sort`, `proof`; among them, 3 consist only of such stages. This is a list of risks for recycling, not an automatic conclusion that any reading is boring.
- Three first candidates: `eng-news` — The neighbourhood newsletter, `ela-quote` - Whose quote is this? `hist-sources` - Two witnesses. Currently, the cards do not change the individual active game scene.
- For all 94 new missions, the connection between stages is mainly budgetary. Check the transfer of solutions between stages; independent exercises do not become different games from a single name.
- Presentation mode has not yet been implemented. In the original museum there is a local division of information; 94 new missions have hint discussion, but no stand-alone co-op mechanic.
- First make one compelling example of each format, then use proven solutions to redesign the catalogue. The number of prototypes is maintained, the quality status is not overestimated.

| First example for recycling | Format | Learning action → observed result | Communication of next moves |
| --- | --- | --- | --- |
| English city delivery | Single | The student identifies limitations and gives instructions; the visitor moves, the load and time change; a misunderstood remark causes clarification | This promise, the chosen transport and the delivered cargo determine the next order |
| Crossing test | Presentation | The student selects the structure and distributes the load; the host starts the test, the load and progress are visible on the field | The completed bridge remains; a new load or rising water requires reasonable modification |
| Station with two remote controls | Joint | The student sees the instruments, the partner sees the rules and diagram; after the exchange of information, the setting includes a specific section of the station | The included areas open further devices and change the available resource |

The audit above records the condition before reprocessing. Based on the following user request, all 33 marked scenarios were redone: 19 stations with routes, 11 active lines and 3 field investigations. They maintain a common field, decisions change further actions; single, presentation and local collaborative formats have been added. Full rules and list are in [catalog](games/mechanics-lab/CATALOG_100.md#reworking-33-scenarios). Verification: 426 automated tests; All 33 scenarios were completed in the browser, roles, mobile size, pause and save were additionally checked. The following user test assesses interest, not just walkability.

### Review of ready-made solutions before corrections - October 9

The user specified the main reference point: **Wordwall**. Additionally, official descriptions of educational products, Roblox and mobile games were studied. This is a review of published mechanics and instructions, not a walkthrough of all commercial games. Current places in ratings and online were not recorded: the dynamic Roblox Charts page did not provide a suitable rating. [Official Roblox 2025 Review](https://about.roblox.com/newsroom/2025/12/roblox-replay-decoded-search-style) was used for context of popularity rather than fictitious current positions.

**Wordwall.** The [official description](https://wordwall.net/features) claims 34 interactive templates, work on personal devices and a shared screen, switching compatible templates with saving material, pace settings and tasks with results. Not every data set converts to every game. For our templates, this means: first defining the learning activity and structure of the material, then choosing the appropriate mechanics. The editor and creation of tasks through AI remain a separate future stage.

| Learned Solution | Essential mechanics from the source | Our adaptation/limitation |
| --- | --- | --- |
| [Wordwall Maze Chase](https://wordwall.zendesk.com/hc/en-gb/articles/360015881938--How-to-create-a-Maze-Chase-activity) | Movement to the response zone, patrols, consequences of a wrong choice | Short path between meaningful decisions; movement should not displace exercise |
| [Wordwall Gameshow Quiz](https://wordwall.zendesk.com/hc/en-gb/articles/360015808837--How-to-create-a-Gameshow-Quiz-activity) | Rounds, help, result reveal, customizable timer | The presenter controls the show, the student predicts the result; You can play during the lesson without a timer |
| [Wordwall Speed ​​Sorting](https://wordwall.zendesk.com/hc/en-gb/articles/360015911837--How-to-create-a-Speed-Sorting-activity) | Training classification directly controls objects on the ribbon | Reduce technical steps between classifications; speed is set according to the student |
| [Wordwall Labelled Diagram](https://wordwall.zendesk.com/hc/en-gb/articles/360015809077--How-to-create-a-Labelled-Diagram-activity) | Connecting the name with the place in the image, checking and repeating | Words and geometric concepts are tied to visible objects; new task tests knowledge transfer |
| [Wordwall Win or Lose Quiz](https://wordwall.zendesk.com/hc/en-gb/articles/47562416855697--How-to-create-a-Win-or-Lose-Quiz-activity) | Choice to accept or reject an object, game risk | Use reasonable confidence in the decision; random luck does not replace educational results |
| [DragonBox Algebra 12+](https://dragonbox.com/products/algebra-12) | Actions with algebraic expressions inside the game | The transformation itself should change the mechanism, and not just issue currency |
| [DragonBox Geometry](https://dragonbox.com/) and [Euclidea](https://www.euclidea.xyz/) | Geometric relations, proofs and constructions | Build a task object, see boundaries and check the design |
| [PhET Area Builder](https://phet.colorado.edu/en/simulations/area-builder) and [Polypad](https://polypad.amplify.com/p) | Manipulating Mathematical Objects and Measurements | The quarter has a connected figure and outer walls; the answer in the estimate appears after the forecast |
| [Lightbot](https://www.lightbot.com/) | Programming actions and procedures | Drawing up a route is justified when the algorithm is studied. An already solved route is executed with one command |
| [Duolingo Adventures](https://blog.duolingo.com/adventures/) | Short everyday tasks with character actions and lines | The English request determines the preparation of the room and the guest's reaction |
| [Noun Town](https://noun.town/language-learning-game/) and [Influent](https://playinfluent.com/about-influent-language-learning-game/) | Words related to objects and space exploration | A room with a wardrobe, mugs, a window and a lamp; words are needed to change the situation. Speech and audio are not yet implemented in our draft |
| [Minecraft: English Adventures with Cambridge](https://education.minecraft.net/pt-br/blog/english-adventures-with-cambridge-language-learning-with-minecraft) | History and language tasks inside the game world | Short, saveable chapters. Read the available indexed official announcement; the page returned 503 when opened |
| [Welcome to Bloxburg](https://www.roblox.com/games/185655149/Welcome-to-Bloxburg) and [Adopt Me - Homes](https://www.playadopt.me/news/expandable-houses-update) | Arrangement of space and interaction with it | Maintain your own environment, give several suitable solutions |
| [Grow a Garden](https://www.roblox.com/games/126884695634066/Grow-a-Garden) | Development of your own site, accumulated results | The saved world as a reason to continue; Expectation of growth is not included in the short teaching episode |
| [99 Nights in the Forest](https://www.roblox.com/games/79546208627805/99-Nights-in-the-Forest) | Building a camp together | General purpose and preparation for the event; convert a long session into short chapters |
| [Dress To Impress](https://www.roblox.com/games/15101393044/Dress-To-Impress) | Own assembly and display of results | First your plan, then its visible test; the result is assessed according to educational conditions |
| [DOORS by LSPLASH](https://www.roblox.com/games/6516141723/DOORS) | Exploring and learning from consequences | Readable feedback and a new try; gaming experience suggests a new solution |
| [Roblox Learning Hub](https://about.roblox.com/newsroom/2025/07/roblox-learning-hub-for-educational-experiences), [Words of Power](https://www.roblox.com/games/11399271177/Words-of-Power), [Math Tower Race](https://www.roblox.com/games/17571821642/Math-Tower-Race) | Vocabulary and math exercises inside game formats | A quick trainer is useful for repetition; We check subject depth separately from game points |
| [Toca Boca World](https://www.tocaboca.com/toca-boca-world) | Stories, characters and actions with objects in locations | Subject English room with its own arrangement and a new guest |
| [Mini Metro](https://dinopoloclub.com/games/mini-metro/) and [Mini Motorways](https://dinopoloclub.com/games/mini-motorways/) | The player builds a network, then changes it to suit new conditions | The constructed system executes the plan itself; student is engaged in a new solution |
| [Good Pizza, Great Pizza](https://www.goodpizzagreatpizza.com/) | Customer order → preparation → result and development of the establishment | Understand the request → change items → get a specific reaction from the character |
| [Cut the Rope](https://www.zeptolab.com/games/cut-the-rope) | Short physical problem with observable result of action | Quick hypothesis testing, correcting the cause of the error, no long idle time |
| [Monument Valley](https://ustwogames.co.uk/mv10/) and [Assemble with Care](https://ustwogames.co.uk/our-games/assemble-with-care/) | Manipulating space and restoring objects | Clear objects, results directly on the field; visual simplicity allows for a meaningful task |
| [Keep Talking and Nobody Explodes](https://keeptalkinggame.com/) | Participants have different information and are forced to explain | The tutor receives information from the guest or source, the student asks and acts. There is no competition with the teacher |

Our conclusions from the review, and not the developers’ statements: separate the useful duration of reflection from unnecessary clicks; give the player authorship of the decision; build the next episode on the saved result; assess knowledge on a modified task after assistance. The template is chosen according to the content: the room cannot be filled with an arbitrary table of questions without developing a script.

### Corrections after review and re-feedback - October 9

The next iteration was implemented on `/lab/missions`. The directory still contains 100 scripts. Of the 33 previously converted, there are now 19 stations, 10 lines, 3 investigations and 1 subject English room. The number of scenarios did not increase; Improved activities and learning solutions within existing games.

| Note | Change in working prototype | Checking the result |
| --- | --- | --- |
| The quarter issued the perimeter through a ready-made estimate | The cost is revealed after checking the forecast; connected cells show the outer outline. Area and perimeter errors are explained separately | Wrong area → correct area with wrong perimeter → correct estimate → clinic and downpour |
| The crossing explained the load only in text | On the stand you can see two trolleys, a cargo composition and an overload. Before weighing you need a forecast. Changing the composition hides the new weight and resets the forecast; previous sample remains for discussion | Forecast 6/6 with actual 7/5 → composition correction → new forecast → flight, bridge extension and delivery |
| Empty returns took more actions than the training task | Returning the cart and sending it over the already built network is performed by one command. An unknown path must be built; collapse and incorrect port continue to affect the result | Re-delivery on rails, track closure, wrong port failure, return to warehouse |
| There was little math in the census | The six entries differentiate between result, repeat, and skip. After sorting, you need to count the different marks of the birds and point the backup camera to where there is no measurement. Zero of a working camera is not considered a pass | Incorrect sum 5 instead of 4 and incorrect section are separately rejected; the right plan completes the shift |
| Investigations boiled down to obvious signatures | Sources require distinguishing between a change of plan and another event, independent evidence and a copy, the author of the words and the compiler of the record. After the connections, you need to sign a justified final conclusion | Incorrect output saves documents and allows correction; the final corresponds to the editor, historical council or publishing house |
| The hotel was a conveyor belt | The late check-in is replaced by a room: approaching an object, a window, a closet, carrying mugs, connecting and turning on a lamp, clearing the passage. The guest walks to the table and reacts to the actual state | The night meeting and morning continuation are completed through the interface; checked for cable error, unsuitable floor, re-entry and item saving |
| Game scene started too low on phone | The room has shortened the service cap and secured the guest's request. The plan starts at approximately 441 px on a 360x800 screen | The scene is visible on the first screen; no horizontal overflow |

The room has two remaining rooms and two visits: Maya needs silence and a lamp; Alex needs the first floor, fresh air and a different arrangement of mugs. For a night visit, different solutions are acceptable: close the street window or choose a room facing the courtyard, use any of the two tables. After the guest approaches, the student sees the situation and ends the visit himself. The morning chapter can be opened separately as a continuation. There is a single-player mode, turn-based guest movement for the shared screen, and a local guest tutor role. This is a test of understanding requests in actions; audio, free dialogue and a big world have not yet been realized.

Repeated review by simulated raters: math tutor confirmed the suitability of the block and crossing for a short discussion; The adult student rated the room higher than the previous assembly line (6/10 vs. 2/10), but this morning's episode still needs a more independent story. The teenager noted a reduction in unnecessary movements and a more meaningful conclusion from the investigation, but there is no desire to return regularly. After their repeated comments, the leak of the new weight was additionally closed, the mobile screen was condensed, the visiting guest was shown, and the census was strengthened. This last part was checked by the main agent; There was no repeat user interest rating.

Tests of the current iteration: 450 automated tests in 34 files in the final full run; lint, TypeScript and production build are running. Via Playwright on the production address `http://127.0.0.1:3000/lab/missions` covered night and morning, quarter, crossing, complete census, Newsletter and citation, including errors and corrections. The room additionally has both formats: frame-by-frame movement of the guest on the general screen and transfer of the role to the tutor with return of control to the student. There are no console errors in these passes; 1365x900 and 360x800 tested. Three raters additionally checked Two Witnesses, local roles, and the 390 × 844 size. Physical weakness of the device and network interaction were not tested. New investigation and census rules use clues `play-v3-…`, room - `room-v1-eng-hotel`; old attempts, avatars and pets are not deleted.

Next product test: give these specific missions to real students, separately look at the desire to continue and the application of knowledge in the modified task. There are still weak points: the same structure of several lines, a small amount of subject content, similar actions of the two English visits. Reviewing Wordwall and other games does not automatically remove these restrictions.

### Second iteration: household solutions in English - October 9

Based on the "continue" request, two existing scenarios have been improved. The quantity in the catalog remains 100; 33 redesigned scenarios now have 19 stations, 9 lines, 3 investigations, a room and a baggage office. The script counter is not used as a cross-engine counter.

**The late check-in — video interview in the morning.** The previous room layout is retained. Alex asks to first ventilate, then remove street noise, connect the laptop and keep the drink away from it. The student must tie `before / then`, `plug in / turn off / unplug`, `away from` with different actions. An open window provides fresh air, but interferes with calls; The switched off lamp continues to occupy the only socket. A large table is needed for a laptop, a small one for a blue mug. The guest comes to the table; A separate ring test shows power and microphone status. After changing the room, a successful test must be repeated. Tonight's Maya episode preserves the alternative solutions. Additional morning fields are optional in the old save `room-v1-eng-hotel`, so the previous room is not reset.

**Whose suitcase? - baggage desk.** The procedure conveyor is replaced by a stage with five suitcases, a conveyor belt, an inspection table, a comparison shelf and delivery. Size, color and belt are immediately visible; turning reveals the wheels and the sticker. In the first two cases, the owner describes the contents of the pocket, and the student checks the description and selects evidence. The objects themselves and the parts found are stored on the shelf. An incorrect item or recipient will not void the inspection.

| Case | New Student Solution | Aftermath on the field |
| --- | --- | --- |
| Maya | Find a small blue suitcase by appearance and contents of the pocket | The correct item goes through the issue and disappears from the feed; there remains a record of the received suitcase |
| Sam | Compare a similar large suitcase with one already issued; trust description and observation when the tag is mixed up | The required suitcase is rejected until the name on the tag is corrected; printed name visible on items |
| Leo, continuation of the house | The gift cannot be opened. Check the two wheels and the moon sticker; clarify who will pick up the item | The pocket remains closed. The owner on the tag is Leo, the recipient is Noor; these fields are checked separately |

The first two issues make up a short shift. The third is available via a separate button after the final, uses the remaining items and corrected tags. In presentation mode, the output proceeds in steps and remains stopped when re-entering. In local co-op mode, a student's question passes the turn to the owner tutor; the response returns control. The student selects a suitcase, evidence, and recipient. There is no network room.

On the mobile screen, the workplace is divided into tabs “Feed”, “Inspection”, “Issue”, without resetting items and solutions. This is a correction to the evaluator's repeated comment about the long page. The same evaluator completed the preliminary version of the baggage, reported no blockers and conditional interest in one more case (6/10). Following comments, added shelf information and a different procedure for a sealed gift; the latest version has been re-run by the main agent. This is a simulation of the adult learner's perspective, not a study of effectiveness.

Checked through the interface: similar incorrect suitcase, lack of prior clarification, incorrect tag and recipient, prohibition from opening a gift, giving to a friend, deferred items, all three formats, saving and reloading. The room was checked for evening, ventilation order, occupied socket, wrong place of the mug, ring test and re-check after changing the window. Dimensions - 1365x900 and 360x800; There are no console errors or horizontal overflows in these passes. Automatic checks cover the same limitations. New luggage key - `luggage-v1-eng-luggage`; old `play-v2-eng-luggage` and character repositories are preserved.

Re-evaluation of the room: the appraiser went through the night and the video call was completely at 360x800; noted that the new goal connects the window, noise, food and arrangement, and would prefer to continue this story. I didn't encounter any blockers or console errors. As a note, a condition has been added to the inaccessible button: first invite Alex to the table. The appraiser checked the new mobile luggage tabs at the first delivery; updated closed gift case was rechecked by the primary agent. Full automatic launch: 461 tests in 35 files; lint, TypeScript and production build are running. All listed branches of the main agent were re-run on the compiled version `http://127.0.0.1:3000/lab/missions`, including single shift, both additional formats, closed gift and video call; no console errors.

Remaining limitations: fixed set of cases, lack of audio and own text of the replica; the current tape is not a timed task. For the next batch, it is more important to develop different subject solutions in algebra and geometry than to add new names for similar everyday tasks.

### Initial inspection by three appraisers - October 9

At the user's request, independent reviews of running games were carried out by subagents in three roles. This is a simulation of the perspectives of an adolescent, a teacher, and an adult student, rather than a study with actual participants. Views do not indicate interest in the entire catalogue. The production version was checked `/lab/missions` via interface; The game code was not changed as part of this evaluation.

| Perspective | Verified selection | Conclusion about the current version |
| --- | --- | --- |
| Teenager, 13 years old, loves Roblox and short videos | In full: “Reserve Census”, The late check-in, “Two Witnesses” | I would go through with a teacher; I don’t want to go back on my own just yet. Subjective ratings: 5/10, 3/10, 4/10. The persistence field is useful, but long cart returns, pre-disclosed procedures, and obvious connections of evidence inhibit self-selection. |
| Math tutor | In full: “Crossing after the storm”, “Quarter by the river”; in the “Census” - roles, erroneous port and correction of up to 1/3 of cargo | I would take the crossing and the quarter as a fragment of a 5th-6th grade lesson with discussion. The census requires significant improvement: there is little mathematics regarding navigation. For grades 7–9, the content of the proven crossing is too easy. |
| Adult student about 20 years old, conditional level A2–B1 | In full: Meet me after the rain, The late check-in, The neighborhood newsletter; the last one with a width of 360 px | I would try the everyday history myself; hotel and transportation of documents do not motivate to return. Subjective ratings: 5/10, 2/10, 3/10. English is needed for some decisions, but often gives way to Russian instructions and field maintenance. |

Confirmed comments at the time of the initial review (corrections for the next iteration are recorded above):

- In a block with an area of 6 and an incorrect perimeter of 24 entered, the header already shows the correct estimate of 22/42. At floor price 2 you can get the perimeter `22 − 12 = 10` from the finished result. The check also does not distinguish between a valid area and an incorrect perimeter.
- In the crossing there is a usefully related formula `2 + 2k`, budget, workload and changing conditions. But the test is predominantly textual; The message when the bridge is empty indicates a supply of beams, and the limit on two bogies is not noticeable enough in advance.
- In transportation, the main training solution is much shorter than the manual route and empty return. The teen passage required 34 directional presses and 7 starts on three loads, including an intentional error. After the last delivery, a message remains about the next shipment.
- At the hotel, the correct order is given in the introductory note; the second release requires adding a worker to an explicitly specified station. The production line poorly corresponds to the guest's check-in.
- In investigations, matching signatures that are too obvious and confirming with a partner does not create meaningful discussion. In the Newsletter, the ending about the exposition diverges from what the district newspaper promised.
- In the English sample there is no speaking, listening and own text of the message. On the mobile field, investigations and management require scrolling; This is a test of the size of the browser, not the performance of a weak physical phone. Fixed control of the running line works, but does not solve the spacing of the field and actions.

Priorities adopted after the initial assessment:

1. In training scenes, remove the output of the result before making an independent forecast and distinguish between the causes of errors. Maintain the opportunity to correct your plan.
2. Develop a block and a crossing: show the geometric boundary, the load and consequences of your own decision. Lesson example: two figures with an area of ​​six cells → comparison of perimeter and price → path to the clinic → choice after flooding. The 5-8 minute guideline has not yet been measured with students.
3. Reduce maintenance of an already solved problem: return along a proven path with one command. Leave manual movement when it requires a new solution.
4. Rework the hotel and investigations around the actions of your story: booking, conversation, issuing a key, checking conflicting evidence. Teacher and student receive complementary information and a common goal; the student makes the key decision.
5. Test the English rooms with a separate small prototype using the scenario below. The complete world is expanded after checking interest in one episode.

Conditions for voluntary interest from a teenage evaluator: a clear goal and a noticeable change in the world in the first minute; at least two meaningful decisions; visible consequences of a mistake and correction of your plan; new task in the second episode; the desire to choose to continue without the promise of a reward for entering. His formulation: “I want to do something of my own here and see if it works. If I was told all the steps in advance, I just follow the instructions.” These are criteria for a future test, and not an already achieved result.

### Development concept: English rooms and a small world

The user suggested virtual rooms and worlds where you can walk, learn words and interact with the environment, focusing on the freedom of action of Minecraft and The Sims. The extended concept is retained below. The first limited prototype has already been implemented in The late check-in, its composition is described above; telephone, explanation of address, moving furniture, kettle, refrigerator and subsequent locations remain the plan. A big world and heavy graphics are not needed to test the first cycle.

The learning goal of the first episode: understand a short request and a description of the location, choose the appropriate action, clarify what is not clear. Main content: `next to / behind / under / near`, `take / put / open / close / plug in / turn on`, quantities and requests `Could you…? / Do you mean…?`. Things remain in the selected places; understanding the language changes the state of the room and the behavior of the guest. Russian explanation available upon request. Simply opening a translation of an item does not count as a complete mechanic.

Episode “First evening in a new apartment”: prepare a place for the guest and help him find an apartment. The short part of the lesson is preparing the room and meeting; home continuation - tea and joint plans. Design guidelines: 4–6 minutes and a total of 8–12 minutes, respectively, with conservation between parts; Duration requires verification.

| Subject | Action and language condition | Observable Consequence |
| --- | --- | --- |
| Phone | Read the request; specify a quiet place, drink or desired table | The answer determines the conditions of preparation and is saved in correspondence |
| Door | Provide number and explain location | The guest arrives at the selected door; if there is an error, it asks again |
| Box or suitcase | `Move it beside the wardrobe. Keep the doorway clear.` | The object moves; the passage is opened or blocked |
| Window | Understand requests for silence and decide what to change | The noise changes after closing; you can choose another room |
| Table | Choose a place according to the guest's wishes | Can accommodate a laptop or drink; multiple valid plans |
| Chair | Place next to the selected location | The guest can come and sit down |
| Lamp | Distinguish `plug in` and `turn on` | An unconnected lamp does not light; doing the right thing lights up the table |
| Kettle | `Fill → boil → pour` depending on the condition of the item | The water is heated, then you can prepare the drink |
| Mugs | Understand Color, Quantity and Location | Selected mugs appear in hand and on table |
| Refrigerator | Take into account `without milk` or choice of lemon | The composition of the drink changes, the guest reacts to it |

The first 90 seconds are a projected entrance: the student is already in the room, receives a short request, clears the passage and carries one object. The arriving character tries to pass and reacts to the actual situation. For the teenage version, the goal is to prepare a meeting of friends; for an adult - receive a neighbor and discuss the trip. Age and gender do not set mandatory tastes: the context can be chosen.

Cycle: understand the wish → examine the available items → clarify → choose your own plan → change the room → see the reaction → correct a specific solution. One request can be satisfied in different ways: closing a noisy window, moving a table, or offering another room. An error triggers an action-related reaction and the possibility of correction. Items are not locked behind individual tests on each click.

Repetition changes the conditions, the arrangement of objects and the wishes of the guest, while maintaining the furnished room. Next short chapters: take a delivery, go to the store, help a neighbor, plan a trip. Familiar words are needed in a new situation. Walking takes seconds; interactions should require more language decisions than empty transitions.

Collaborative version: the tutor plays a guest with a specific need or additional information, the student arranges the space, asks and explains. This is a shared task without competition with the teacher. First, we check short remarks and meaningful answer choices; audio, entering your own text and speaking are separate capabilities for testing that have not yet been implemented.

Prototype testing: observe whether the player understands the goal without a long instruction, whether he can suggest another acceptable plan, whether he corrects the cause of the error and whether he chooses the next episode. Separately check the use of words in a changed situation after help. The simulated person's positive opinion of the concept does not replace these observations with real students.

The previous queue of four big games and [detailed specification](ISLAND_GAMES_SPEC.md) are saved below as a backlog. Previous pages, profiles and skins remain available. The expedition already has a working draft with four themes, but further visual polish is not a priority right now.

This plan sets the current food queue instead of the previous sequence “Pairs → Groups → Blitz Quiz”. Old architectural documents remain for reference. The new queue does not require a massive engine replacement or rewrite of running games.

## Accepted boundaries

- The learning objective determines the game mechanics. The student performs basic actions; the tutor helps or plays a partner with other information.
- For grades 5-8, we reinforce strategy, exploration, building, and changing the world. For grades 9–11, we maintain quick access to practice and more complex content. Age does not prohibit you from choosing a different mode.
- An adult learning English experiences meaningful history and natural communication. The main candidates are investigation and shared adventure.
- During the lesson, one completed mission takes approximately 4–6 minutes. The DZ consists of short, saveable chapters. Time is a design reference, not a validated measurement.
- The character, existing skins, pets and progress received are saved between games.
- We save the agreed visual direction for subsequent refinement of the selected games. In the laboratory - the usual DOM, text, tables and simple training fields; without generating images and loading 3D.
- We take weak phones into account from the first stage: light graphics, stable camera, large elements, controls without necessarily precise dragging.
- We consider success in the game and independent mastery of a skill separately. Help allows you to complete the mission, but is not presented as an independent decision.
- The tutor selects a goal and a ready-made template. The map editor and the free creation of new game rules are not included in this queue.
- The educational vertical strip has been postponed at the request of the user.
- Based on the latest user request, hundreds of simplified selection scenarios have been implemented. We develop graphics and large game worlds after checking interest.

## Starting point

The project found existing files for protecting the base, runner, labyrinth, general character profile and graphics settings. Their presence does not mean compliance with the new specification: this is checked in step 0.

| Region | Support in the project | Action |
| --- | --- | --- |
| Base defense | `lib/tower-defense/`, `components/games/tower-defense/`, `app/lab/tower-defense/` | Compare the current mechanics with the new scenario and refine it |
| Character and Profile | `lib/avatar/`, `components/avatar/`, `components/avatar-profile/` | Reuse, save selected models and skins |
| Graphics | `lib/graphics.ts`, `components/games/graphics-toggle.tsx` | Save quality selection and check on new scenes |
| Runner and maze | `lib/orbital-runner/`, `lib/space-maze/` and related components | Maintain accessibility, check for regressions of common changes |
| Current protection scenario | [SCENARIO.md](games/tower-defense/SCENARIO.md) | Use as a description of the original draft, take into account the differences in the new plan |
| Visual reference | [Coordinated Base Defense Direction](games/tower-defense/concept-reference-simplified-v2.png) | Save composition and art direction |

## Queue and statuses

| Stage | Result | Status |
| --- | --- | --- |
| Fixation | Plan and detailed specification in the project | Done |
| 0 | Verified original version and list of differences | Done |
| 1 | Completed base protection | Draft ready, browser verification passed |
| Laboratory | 8 mechanics × 3 stages, reviews and choice of direction | The first batch is ready for user testing; all 24 stages completed in the browser |
| Script Lab | 6 missions with interconnected mechanics, branches and progress saving | Ready to try; all 6 were completed in the production build, both crossing and saving branches were checked; 287 tests, build, lint and types pass |
| Catalog 100 | 94 new three-stage missions + 6 original ones; 11 items, search, filters and more | Implemented; all 94 new missions are completed through the interface, all 12 types of interactions are tested on mobile size. General automatic check: 387 tests |
| Recycling | 33 weak scripts with persisting field and three formats | Implemented; tested continuous game loops, roles and state recovery |
| 2 | Completed expedition with construction | Working draft; polishing postponed under new priority |
| 3 | Completed investigation | First we check the mechanics in the laboratory |
| 4 | Two-Party Co-op Adventure | First a local sample with different information |
| 5 | Tutor setup and tested options with AI | Waiting |
| 6 | General Island Map and Associated Home Progression | Waiting |

General elements are added according to the needs of the current game. We do not build in advance a universal system for all possible future mechanics. Each game from the first completed playthrough uses a saved character and its own continue points; unification on a large map occurs after four proven game cycles.

## Step 0 Check original version

- [x] Run the project and record a reproducible method for opening work pages.
- [x] Check initial formation, preparation, first wave and reload; after revision, go through to the result and go to the remote control.
- [x] Map existing placement, upgrade, energy, hint and outcome rules to the new specification.
- [x] Check saved skins, loading of three models, running/stopping in the profile and pets at the base; do not change the model.
- [x] Check current pause, state recovery and graphics quality switching.
- [x] Record what is actually being reused, what needs to be changed, and what problems are blocking the first game.

Audit 08.10: original reboot lost formation and round; passing bubbles did not reduce strength and could not lead to damage; it was necessary to install one tower of each type. These three limitations have been fixed. Reused map, long road, tower sprites, GLB characters, pets, general profile and graphics settings. No engine migration was needed.

Ready: there is a short list of differences and faults of the first game; parts that are already working are not rewritten without reason. Architectural decisions are made based on the current code, and not automatically based on the old migration plan.

## Stage 1 Improve base defense

The first mission is “First Watch”. First one proven training package, then more complex wave compositions and a home continuation. The original multiply by 7 package is suitable for testing mechanics; follow it with content for the target audience, such as fractions or short linear equations.

- [x] Save the top view, long route, six sites, existing base and characters.
- [x] Make clear preparation: choice of tower type, range, installation, rearrangement and return of resources between waves.
- [x] Check the difference between laser, cryo and pulse in real combat.
- [x] Implement improvements and priority goals without double deductions or double rewards.
- [x] Show bubbles of different sizes and behavior; The differences are clear not only in color.
- [x] Increase energy consumption, charging of the selected tower for the task and the state of the empty battery.
- [x] Separate quiet mode and practice for a while; pause stops the wave and the associated timer.
- [x] Handle incorrect answer, time expiration, hint and wave completion during solution.
- [x] Add pet assistance without favoring one cosmetic skin over another.
- [x] Realize the result, defeat, repeat the last wave, save and continue.
- [x] Separate independent decisions from assistance; save topics for review. Multi-step prompts remain a further expansion.
- [x] Add a short remote control with new values ​​and a separate save point.
- [x] Go through the full scenario on a computer and in a mobile browser with touch and light graphics (emulation 390x844).

Readiness: the student independently arranges towers, sees the meaning of different types, solves problems for energy and improvements, completes the mission and continues after exiting. Defeat allows for a meaningful change in strategy. The exact values ​​of energy, damage, speed and number of tasks are selected based on playthroughs; preliminary figures from the specification are not considered a verified balance.

After the first full cycle, successively add “Fast Flow”, “Dense Wave”, “Big Bubble” and “Night Watch”. For each new scenario, ensure that the learning activities remain an essential part of the progression.

Result 08.10: all five wave compositions are implemented and passable in the test with a four-second charge solution; a difficult mission without charges and upgrades is lost. Added fractions and linear equations to the original multiplication and English packages. The actual rules and restrictions are in [defense scenario](games/tower-defense/SCENARIO.md).

Check: `npm test` — 224 tests in 26 files, including 30 security checks; `npm run lint`, `npm run typecheck`, `npm run build` completed successfully. Playwright (Browser plugin not available): full path 1440x960 and 390x844 - arrangement → error → parsing → saving in the middle of the task → three waves with charges → result → entering the remote control → repeat with history. Quiet mode, key responses, settings, three skins and profile saving were separately tested. Loading of three existing games, absence of horizontal overflow and reduced graphics mode were tested at 360x800; The protection scene is also tested at CPU slowdown ×4. This is not a replacement for a physical phone.

After changing the panel, the overlay of the counter on the question was eliminated; The final mobile playthrough was performed on a production build to eliminate Fast Refresh. The snapshots are located outside the repository in `C:/Users/rubac/.codex/visualizations/2026/10/06/01a11090-a5d1-78d1-a720-f060e0452e9d/`: `defense-calm-algebra-desktop.png`, `defense-charging-mobile.png`, `defense-finished-mobile.png`, `defense-profile-preserved.png`.

Launch: `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3000`. Open `http://127.0.0.1:3000/lab/tower-defense`; equations - `?lesson=linear`, fractions - `?lesson=fractions`, English - `?lesson=english-s`. The scenario is selected before the start. The current build is running on port 3000.

Draft limitations: saves are local to the browser; There is no cloud synchronization and a network tutor console. There is one analysis with a new similar task; a multi-stage hint system has not yet been implemented. AI and unlocking new skins for achievements are included in subsequent stages. The duration of a lesson with a real student and performance on a weak physical device have not yet been measured.

## Stage 2 Make an expedition with construction

The first mission is “Gorge Crossing”: one completed construction episode. First, pre-prepared conditions and materials, then variations in numbers and supported formations.

- [ ] Set up the stage with a target, obstacle, anchor points, and available materials.
- [ ] Implement the cycle “inspect → select a plan → build → predict → test → carry out the command.”
- [ ] Make a diagram with initial data, select a part, rotate and connect.
- [ ] Add cancel, revert and reset only the current design with the return of materials.
- [ ] Check geometric conditions; make all valid decisions, not just those similar to the picture.
- [ ] Show the specific reason for a failed test and save the project for correction.
- [ ] Distinguish a control error from a confirmed training error.
- [ ] Implement mobile control “select part → select location” along with optional drag.
- [ ] Save a partially built structure when leaving and restore it when returning.
- [ ] Add options for different levels: segments and platform, right triangle, more complex dependencies.
- [ ] Assemble a home route from short obstacles with separate save points.

Willingness: at least two acceptable options where the condition allows freedom; the error is explained through properties; all materials for the solution are available; Finger control does not require the precision of a mouse. Test example 6–8–10 works mathematically correctly.

Next missions: “Campground”, “Mirror Passage”, “Cargo Platform”, “Pack Equipment”, “Restore the Map”. Communication using a split drawing is already described here, and the live connection of the tutor uses the proven solution of stage 4.

## Stage 3 Do an investigation

First up is "The Lighthouse Parcel", an English A2 with simpler supports and a mature presentation. The first version uses given facts and verified cues; free AI dialogues are activated after checking the training scenario.

- [ ] Prepare three research points: port, workshop, lighthouse.
- [ ] Record a consistent history of the L7 parcel and the information of each character.
- [ ] Implement inspection, conversation, choosing the direction of the question and moving between available places.
- [ ] Add a journal with facts, sources, your own version and open questions.
- [ ] Allow the student to compose or enter a replica depending on the level.
- [ ] Accept the provided correct options for questions and answers.
- [ ] Check the final conclusion along with the reasons; distinguish a lucky guess from a justification.
- [ ] Allow replay, text support, hint and return to source.
- [ ] Process the wrong version without losing the facts found and without having to restart completely.
- [ ] Save history, open spaces, current version and state of dialogs.
- [ ] Give a meaningful result of the first chapter and a new case for the home continuation.
- [ ] Check child and adult tone on the same game loop.

Readiness: the case can be resolved in any acceptable order of visiting places; mandatory evidence is not lost; the conclusion is supported by available facts; a replica that is clear in meaning is not rejected for not matching one sample. The text path is completely passable. Voice input, if added, requires confirmation of recognized text and does not replace the text path.

The following cases: “Missing pet”, “Night signal”, “Mixed up orders”, “Last ferry”, “Archive error”, “Broken mechanism”. The witness performed by the tutor is connected through the general mechanism of stage 4.

## Stage 4 Make an adventure together

The first mission is “Launch the Beacon”. The student has the equipment, the tutor has the instructions. Game actions and answers are performed by the student; the result is general.

- [ ] Determine the minimum way to synchronize two participants that is compatible with the current project.
- [ ] Implement room creation, login, roles, readiness and startup.
- [ ] Divide information between student and tutor screens.
- [ ] Implement three devices, request information, enter settings and check the result.
- [ ] Add a general pause, transmission of a fragment of an instruction, and a help mark.
- [ ] Handle incorrect setting, retry and return to operational state.
- [ ] Make a general ending without requiring a synchronized press with precision to the second.
- [ ] Verify reconnection, one party exiting, and restoration of a consistent state.
- [ ] Add a self-contained home continuation with a character with limited instruction.
- [ ] Clearly distinguish between a living partner and an assistant; Regime change should not happen in secret.
- [ ] Test two independent clients, including a combination of computer and phone.
- [ ] After checking the connection, add the tutor role to the expedition and investigation.

Readiness: the two participants actually receive different information and one agreed upon state; the student decides and controls; disabling does not break the passage and does not lose the result. Showing two panels in one browser does not in itself confirm online co-op.

Further scenarios: “Start up the freight elevator”, “Closed observatory”, “Radio communication with the expedition”, “Failure of the marshalling yard”, “Preparing the ferry”. Repair and escape use a common basis of shared information.

## Stage 5 Setting up content and AI

Ready-made, proven packages are available from each game stage. Here we combine the preparation of the lesson and add new testable options. We first check the suitability of existing tools for working with educational content; We do not create a second parallel circuit unnecessarily.

- [ ] Implement the path “subject → topic → goal → suitable game → difficulty → viewing → launch or remote control.”
- [ ] Show the compatibility of the learning task with mechanics; Don't put long proof into quick recharge.
- [ ] Add generation of conditions, answers, solutions, hints and new options after an error.
- [ ] Check math answers, valid options, goal achievability, and story consistency.
- [ ] Let the tutor replace one task and review the full set before starting.
- [ ] Enable limited AI character roles and check the meaning of English lines.
- [ ] Handle invalid validation, generation failure, and service unavailability.
- [ ] Do not change the condition, correct answer, or key facts of an attempted attempt.
- [ ] Save the opportunity to complete the started mission using the prepared content.
- [ ] Combine the result and the assignment of repetition for a specific difficulty.

Readiness: the erroneous set does not reach the student; the teacher sees the content in advance; without AI, what remains is a ready-made set. Demo pieces are clearly marked if actual integration is not yet available.

## Stage 6 Merge Island and Home Progression

- [ ] Place four games in themed locations and add direct entry to the assigned mission.
- [ ] Link the completion of tasks with a visible change in the world: bridge, workshop, lighthouse, restored base.
- [ ] Combine lesson continuation points and PD points, saving the progress of each game.
- [ ] Save the character, selected skin, pets and graphics settings during transitions.
- [ ] Separate the reward for completion and achievement for independent use of the skill.
- [ ] Add unlocking cosmetics for meaningful achievements without losing items already received due to errors.
- [ ] Give the tutor direct access to the desired topic, regardless of the territory explored by the student.
- [ ] Include the existing maze and runner as additional activities without necessarily rewriting.
- [ ] Check the entire route “lesson → exit → DZ → return to the tutor.”

Readiness: the world connects already running missions; moving does not delay the start of practice; changes to the island correspond to the actions performed.

## Check before moving on to the next game

The current base security check is noted below. For the next game the list goes through again.

- [x] There is a completely walkable mission: entry, first action, independent play, error, help, result.
- [x] Repeat, save and continue are available; a partial attempt does not turn into an erroneous completed attempt.
- [x] The main path is completed in the browser; The essential logic of errors, timer, defeat, retry and wave completion is verified by tests.
- [x] Mouse, keyboard and touch tested, including portrait sizes 360–390 px.
- [x] The panel with the question and formulas scrolls, the mobile charger is placed on the screen. The on-screen keyboard is not required for this multiple choice version.
- [x] Light graphics preserve readability and game rules; DPR and rendering frequency are limited, selection saving is checked.
- [ ] The actual weak device is tested separately; Load emulation is not issued for such a test.
- [x] Profile, three skins and loading of existing games have been verified; The general code of the profile and other games did not change.
- [x] The necessary tests of essential logic have been written: transitions, timers, decision checking, saving and protection against double actions.
- [x] Suitable for change completed `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; The results are recorded after the fact.
- [x] A real browser walkthrough was carried out, the necessary pictures and comments were saved.
- [x] A short result has been recorded: what has changed, what has been checked, what restrictions remain.

Tests and assembly are required during implementation. Recording this plan does not mean that the new games or checks listed have already been completed.

## Rule for maintaining a plan

After each completed step, update only the relevant flags and status, add a link to the result or check. Don't mark the entire game as ready based on one working screen. First fix the significant problems of the current game, then move on in turn.

Next Action: Complete the Gorge Crossing Stage 2 mission, starting with a mock design check and a short completed playthrough. Save your general profile and existing games.
