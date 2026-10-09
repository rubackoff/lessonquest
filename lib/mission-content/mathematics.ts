import { mission as m, pack as p, sequence as q, sort as s, balance as b, machine as f, experiment as e, plot as g, network as n, schedule as t, transform as x, proof as d, route as r } from './builders'

export const mathematicsMissions = [
  m('math-market','Fair without change','Mathematics','5th–6th grade','Open a fair booth: collect kits, set up a cash register and deliver orders before closing.','The supplier closed the short passage. The courier needs the last supply.',[
    p('Buyer kits','You need exactly 12 apples and 8 pears; sets are indivisible. Select the contents of your order.',['Apples','Pears'],[12,8],[['Basket A',[3,2],4],['Basket B',[6,0],2],['Basket B',[0,4],2]]),
    f('Discount box office','Price after coupon: double the number of tokens and subtract 3. Check several receipts.',[4,6,9],[5,9,15],[['×2','multiply',2],['−3','add',-3],['+3','add',3]],2),
    r('Delivery to the square','Collect the receipt at the ● location, then deliver all baskets to the buyer. Shorten the program so that there is enough reserve.',0)]),
  m('math-bakery','Bakery for opening','Mathematics','5th–7th grade','Coordinate batches, baking and delivery for morning opening.','Checking equipment took away part of the working reserve.',[
    b('Equal batches','The box on the left contains 2 buns, the box on the right contains 3. Match the minimum number of boxes with the same quantity.',['Buns'],[['Box 2',[2],1],['Box 3',[3],-1]]),
    t('One oven','Kneading before baking, baking before packaging. The oven is checked at intervals of 3–4.',[['Kneading',2,[]],['Baking',3,[0]],['Packaging',1,[1]]],10,[3]),
    p('Latest orders','Make 10 buns and 6 pies from the remaining packages.',['Buns','Pies'],[10,6],[['Mixed',[2,2],3],['Buns',[3,0],3],['Pies',[0,2],3]])]),
  m('math-fractions','Fractional garden','Mathematics','5th–6th grade','Select the beds, distribute the shares and extend the watering.','One old water main lost its seal; choose another connection.',[
    g('Garden marking','The six squares of the garden must be connected by sides; the central cell is required.',6,12),
    p('Harvest shares','All quantities are given in twelfths of the basket. Collect exactly 8/12 berries and 4/12 fruits.',['Berries, 1/12','Fruit, 1/12'],[8,4],[['Serving 1/3 berries',[4,0],3],['Serving 1/6 berries',[2,0],4],['Serving 1/6 fruit',[0,2],3]]),
    n('General watering','Connect the tank to all areas; channel 0–2 is closed.',['Buck','beds','Flowerbed','Greenhouse'],7,[1])]),
  m('math-scale','Festival layout','Mathematics','6–7 grade','Convert dimensions to scale, combine stands and distribute installation time.','Installers received additional scrutiny; time reserve has decreased.',[
    f('Scale 1:50','The actual length is given in meters. Convert it to layout centimeters: 1 m corresponds to 2 cm.',[2,3,5],[4,6,10],[['×100','multiply',100],['÷50','divide',50],['÷2','divide',2]],2),
    x('Stand rotation','Align the figure of the stand with the marked outline. Translations, rotations and reflections are allowed.'),
    t('Installation one by one','First the floor, then the stand; check only after installation. One team is working.',[['Gender',2,[]],['Stand',3,[0]],['Check',1,[1]]],9)]),
  m('math-census','Census of the reserve','Mathematics','6–8 grade','Check the observation data, clear the table and put together a walkthrough plan.','Repeated reconciliation took away part of the expedition\'s reserve.',[
    d('Which account is reliable?','12 different birds were recorded on the site in the morning and 8 in the evening.',['12 unique in the morning','In the evening 8 unique'],[['Morning log','12 different marks, duplicate frames removed.',[0],2],['Evening magazine','8 different marks per evening.',[1],2],['Shot counter','There are 80 photos on the camera. Some of the birds were filmed multiple times.',[],1]]),
    s('Clear entries','Leave unique observations. The snowstorm is the reason for missing, not a zero result.',['Number','Pass','Repeat'],[['12 marks in the morning',0,'This is a measured quantity.'],['Camera is turned off',1,'There was no measurement; zero would state the absence of birds.'],['Repeat shot of mark A',2,'We don\'t count one animal twice.']]),
    r('Bypassing cameras','Visit the control chamber ● and reach the station, avoiding the closed cells.',2)]),
  m('math-ratio','Paint workshop','Mathematics','6–7 grade','Research flow rates, assemble batches and open a mixing line.','There is less stock left to release the batch: reduce unnecessary actions.',[
    e('Paint consumption','Training model: consumption is proportional to the area and number of layers. Change the area while maintaining the number of layers.','Area','Layers','servings','product',2,[3,2]),
    p('Signature shade','For two identical jars you only need 6 red and 4 blue measures.',['Reds','Blue'],[6,4],[['Red measure',[1,0],8],['Blue measure',[0,1],6],['Mix 3:2',[3,2],2]]),
    q('Mixing line','First, measure out the components, then mix, then check the shade and only then close the jar.',['Measure components','Stir','Check shade','Close the jar'])]),
  m('math-probability','Honest slot machine','Mathematics','7th–8th grade','Check the conditions for issuing, make a bag of tokens and connect control.','The inspector requested that a reserve be maintained for an independent audit.',[
    s('Probability of event','There are 2 red and 4 blue tokens in the bag. One token is chosen randomly.',['Impossible','Possibly','Reliably'],[['Green token',0,'There are no green ones in the bag.'],['Red token',1,'Red happens, but not with every choice.'],['Red or blue',2,'There are no other colors.']]),
    p('Customize bag','You need 6 tokens, 2 of them are red: the probability of red is 1/3.',['Total','Reds'],[6,2],[['Red',[1,1],6],['Blue',[1,0],6],['A couple of different',[2,1],3]]),
    n('Independent control','Connect the machine, counter, log and scoreboard; use the budget for the overall path.',['Automatic','Counter','Magazine','Scoreboard'],6)]),
  m('math-courier','Courier shift','Mathematics','6–8 grade','Build a connection between warehouses, coordinate flights and set delivery rates.','The last shift is shorter: the tariff must be checked on all three orders.',[
    n('Issue network','All points must be connected to the central warehouse.',['Warehouse','Port','Park','Area'],6),
    t('One car flights','Loading before flight, return packaging after delivery. Between 4 and 5 the warehouse is closed.',[['Loading',2,[]],['Flight',2,[0]],['Tara',1,[1]]],9,[4]),
    f('Fair tariff','Delivery costs 3 per kilometer and 2 for order processing.',[1,3,5],[5,11,17],[['×3','multiply',3],['+2','add',2],['−2','add',-2]],2)]),
]

export const algebraMissions = [
  m('alg-factory','Transformation Factory','Algebra','7th–8th grade','Find the dependence of the sensor, assemble a computer and equalize the output of the two lines.','The control line received limited supply; excess coefficients need to be reduced.',[
    e('Amount sensor','On a test bench, the output depends on the sum of the two inputs. Determine how the reading changes when you first enter.','Input A','Input B','units','sum',3,[4,2]),
    f('Regulator','The transformation required is y = 3(x + 2).',[1,2,4],[9,12,18],[['+2','add',2],['×3','multiply',3],['−2','add',-2]],2),
    b('Two lines','One line produces 3 parts per cycle, the other 5. Find the minimum number of cycles with equal output.',['Details'],[['Line A',[3],1],['Line B',[5],-1]])]),
  m('alg-tram','Tram with the unknown','Algebra','7th–8th grade','Restore the ticket rule, prove it with receipts and coordinate flights.','A service window has arisen before departure: flights cannot be overlapped.',[
    f('Ticket Rule','According to the tariff y = 2x + 5, where x is the number of zones. Collect a chain.',[1,2,4],[7,9,13],[['×2','multiply',2],['+5','add',5],['−5','add',-5]],2),
    d('Tariff check','The tariff includes a flat fee of 5 and 2 per zone.',['Landing fee 5','Zone 2 fee'],[['Rules','Landing costs 5.',[0],1],['Payment check','The surcharge for each zone is 2.',[1],2],['Advertising','The cheapest trips!',[],1]]),
    t('Flights','Pre-flight inspection; cleaning up after it. One team handles everything.',[['Inspection',1,[]],['Flight',4,[0]],['Cleaning',2,[1]]],10)]),
  m('alg-signs','Cold warehouse','Algebra','6–8 grade','Disassemble the signs, set up a recalculation of sensors and guide the inspector through the warehouse.','One passage became icy; the route will have to be drawn up again.',[
    s('Reading below zero','Distribute the calculation results by sign.',['Negative','Zero','Positive'],[['−3 + 5',2,'It turns out 2.'],['−4 × 2',0,'Negative for positive gives negative.'],['7 − 7',1,'The difference between equal numbers is zero.'],['−2 × (−3)',2,'The product of two negatives is positive.']]),
    f('Sensor correction','The correct temperature is y = x − 4.',[-2,0,5],[-6,-4,1],[['−4','add',-4],['×2','multiply',2],['+4','add',4]],2),
    r('Checking freezers','Go to the control point and lead the inspector to the exit. Closed passages are marked.',3)]),
  m('alg-square','Square signal','Algebra','8–9 grade','Examine the nonlinear sensor, assemble the quadrator and prepare the measuring section.','The reserve for fencing has decreased; The compact shape will save material.',[
    e('Nonlinear experience','The training sensor outputs the square of the first input multiplied by the second. Compare x=1 and x=2 at the same gain.','Signal x','Gain','units','square',1,[3,2]),
    f('Quadrator','Construct y = x² + 1. The negative input also needs to be processed.',[-2,0,3],[5,1,10],[['Square','power',2],['+1','add',1],['×2','multiply',2]],2),
    g('Sensor area','Select a connected area of 8 cells with a border of no more than 12. The central point is required.',8,12)]),
  m('alg-brackets','Brackets on the conveyor','Algebra','7th–8th grade','Restore processing order, assemble functional modules and distribute output.','For the last batch, only standard packaging remained.',[
    q('Processing order','For 2(x + 3), first add 3 to x, then double the result and check the output.',['Take x','Add 3','Multiply by 2','Check output']),
    f('Assemble the conveyor','Check 2(x + 3) on three inputs.',[0,2,5],[6,10,16],[['+3','add',3],['×2','multiply',2],['+6','add',6]],2),
    p('Pack issue','Ship exactly 16 parts and 8 gaskets.',['Details','Gaskets'],[16,8],[['Set 4+2',[4,2],4],['Parts of 8',[8,0],2],['Gaskets 4 each',[0,4],2]])]),
  m('alg-inverse','Return code','Algebra','7–9 grade','Restore the input using the encrypted output, go to the terminal and justify the rule.','The last terminal requires confirmation from two independent entries.',[
    f('Inverse function','The transmitter does y = 3x + 6. The decoder receives y: return the original x.',[9,12,18],[1,2,4],[['−6','add',-6],['÷3','divide',3],['+6','add',6]],2),
    r('To the closed terminal','First visit the verification site ● then submit the recovered code.',1),
    d('Justify the reverse move','Subtracting 6 and dividing by 3 restores the original signal.',['Exactly 6 added','After multiplying by 3'],[['Passport','The first block multiplies x by 3.',[1],2],['Output circuit','The second block adds 6.',[0],2],['Similar device','Another device adds 2.',[],1]])]),
  m('alg-modulo','Safe balances','Algebra','7–9 grade','Sort out the remainder, set up the encoder and put the checks into one window.','One stand is available for final control.',[
    s('Residue classes','Distribute the numbers according to the remainder when divided by 3.',['Remaining 0','Remainder 1','Remainder 2'],[['12',0,'12 is divisible by 3 without a remainder.'],['7',1,'7 = 2×3 + 1.'],['11',2,'11 = 3×3 + 2.'],['16',1,'16 = 5×3 + 1.']]),
    f('Encoder','The code is equal to the remainder of the input divided by 3 increased by 1.',[4,6,8],[2,1,3],[['mod 3','mod',3],['+1','add',1],['×3','multiply',3]],2),
    t('Checking the safe','First the power is checked, then the lock, then the result is recorded.',[['Food',2,[]],['Castle',2,[0]],['Magazine',1,[1]]],8,[2])]),
  m('alg-two-lines','Coordinate production','Algebra','8–9 grade','Compare the output of teams, complete a general order and connect the lines to the warehouse.','The direct line to the warehouse has been closed; a common section of the network saves resources.',[
    b('Equal release','Brigade A produces 4 units per shift, B - 6. Equalize the output with a minimum of whole shifts.',['Nodes'],[['A',[4],1],['B',[6],-1]]),
    p('General order','Collect 12 knots and 6 fasteners with no leftovers.',['Nodes','Fasteners'],[12,6],[['Kit',[4,2],4],['Nodes',[6,0],2],['Fasteners',[0,3],2]]),
    n('Warehouse network','Connect the warehouse with both teams and control without using a closed direct channel.',['Warehouse','A','B','Control'],7,[5])]),
]

export const geometryMissions = [
  m('geo-mosaic','Mosaic for a museum','Geometry','5th–7th grade','Combine the fragment, design the panel and create an installation sequence.','Installation has been simplified: first you need to check the entire circuit.',[
    x('Mosaic fragment','Turn and transfer the L-shaped fragment exactly to the marked cells.'),
    g('Panel outline','Assemble a single panel with an area of 6 and a perimeter of no more than 10.',6,10),
    q('Installation without plywood','First, lay out the dry outline, then check the size, apply glue and secure the parts.',['Lay out the outline','Check size','Apply glue','Secure parts'])]),
  m('geo-garden','Garden with common fence','Geometry','5th–7th grade','Save the perimeter, install a gate panel and install irrigation.','The supply to the greenhouse is blocked; connect it through the neighboring area.',[
    g('Compact beds','You need 8 cells and no more than 12 meters of border.',8,12),
    x('Entrance to the garden','After selecting the site, align the mounting base of the gate with the design outline.'),
    n('Irrigation pipes','All beds must be connected to the tank; channel 1–3 is closed.',['Buck','Bed A','Bed B','Greenhouse'],7,[3])]),
  m('geo-symmetry','Scene symmetry','Geometry','6–8 grade','Analyze the transformations, combine the scenery and calculate the installation.','The stage is only accessible to one team at a time.',[
    s('What changes orientation?','Distinguish between rotation, translation and reflection.',['Transfer','Rotate','Reflection'],[['All points are shifted 2 to the right',0,'The same vector for all points - translation.'],['The figure is rotated 90° around the center',1,'The distance to the center is maintained when turning.'],['Right and left changed at the mirror',2,'Mirror transformation is a reflection.']]),
    x('Left decoration','Use a reflection relative to the middle vertical, then match the outline.'),
    t('Installation of decorations','Frame in front of the canvas; lighting after the canvas. One brigade.',[['Frame',3,[]],['Canvas',2,[0]],['Backlight',1,[1]]],9)]),
  m('geo-surveyor','Surveyor on the island','Geometry','6–8 grade','Go through checkpoints, select an area and check border documents.','The site must be confirmed with documents, and not just with a drawing.',[
    r('Bypassing boundary signs','Visit the ● sign, avoid obstacles and finish shooting at the marked point.',2),
    g('Land for a station','You need 6 connected cells, the central point enters the site.',6,12),
    d('Site boundaries','The project includes a central sign and does not extend into the security zone.',['The central sign is taken into account','Security zone excluded'],[['Coordinate plan','The C sign is included in the border.',[0],2],['Inspection report','No entries into the security zone were found.',[1],2],['Photography from a distance','The photo shows an island without markings.',[],1]])]),
  m('geo-box','Exhibit packaging','Geometry','6–8 grade','Select the dimensions, unfold the insert and coordinate the packaging line.','The exhibit can be sealed only after a control inspection.',[
    p('Box materials','Select exactly 12 square panels and 8 corners.',['Panels','Corners'],[12,8],[['Frame set',[3,2],4],['Panels of 4',[4,0],3],['Corners 4 each',[0,4],2]]),
    x('Liner','Place the flat liner on the outline without changing the shape.'),
    q('Safe packaging','First the liner, then the exhibit, then the inspection, then the cover.',['Install liner','Place an exhibit','Conduct an inspection','Close the lid'])]),
  m('geo-cable','Cable yard','Geometry','7–9 grade','Design a network, study the flow dependence and assemble the required cable length.','New connections require precisely measured lengths.',[
    n('Shortest connected network','Connect four nodes while maintaining budget 6.',['Shield','House','Workshop','Warehouse'],6),
    e('Coverage consumption','Rectangular cover model: area equals the product of two sides. Keep one side when comparing.','Length','Width','m²','product',1,[4,3]),
    p('Cable sections','Collect exactly 14 meters of cable and 4 connectors.',['Meters','Connectors'],[14,4],[['3 m cable with connector',[3,1],4],['Cable 2 m',[2,0],4],['Connector',[0,1],4]])]),
  m('geo-window','Stained glass workshop window','Geometry','5th–8th grade','Prove the properties of the sample, draw a contour and combine the decorative element.','The last element must be rotated without changing its area.',[
    d('Rectangle Properties','The sample has four right angles and equal opposite sides.',['Four right angles','Opposite sides are equal'],[['Goniometer','All four dimensions are equal to 90°.',[0],2],['Ruler','The sides take turns 4, 2, 4, 2.',[1],2],['Sample color','All parts are green.',[],1]]),
    g('Window outline','Dial 8 cells; the perimeter does not exceed 12.',8,12),
    x('Stained glass fragment','Maintain the shape of the fragment when moving and rotating.')]),
  m('geo-tiles','Pavilion tiles','Geometry','5th–7th grade','Distribute the shapes, assemble the tiles and create a delivery route.','Delivery goes through warehouse control.',[
    s('Shape Properties','We highlight the square separately: it has four equal sides and four right angles.',['Square','Another rectangle','Not a rectangle'],[['Sides 3,3,3,3; all angles 90°',0,'This is a square.'],['Sides 2,4,2,4; all angles 90°',1,'It\'s a rectangle, but not a square.'],['Triangle',2,'A triangle has three sides.']]),
    p('Order tiles','Deliver 12 light and 6 dark tiles.',['Light','Dark'],[12,6],[['Pattern 2:1',[4,2],3],['Light',[3,0],4],['Dark',[0,3],2]]),
    r('To the pavilion','Take control stamp ● before unloading.',1)]),
  m('geo-lighthouse','Beam for the lighthouse','Geometry','7th–8th grade','Restore the panel orientation, connect the power and prepare the test.','The check is only available after the electrical installation has been completed.',[
    x('Panel orientation','Align the mounting panel with the mount; the reflection changes orientation.'),
    n('Powering the lighthouse','Connect the battery, shield, lamp and backup unit.',['Battery','Shield','Lamp','Reserve'],7),
    t('Beacon input','Panel before wiring, wiring before testing.',[['Panel',2,[]],['Wiring',3,[0]],['Test',2,[1]]],10)]),
]
