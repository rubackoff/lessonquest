import { mission as m, pack as p, sequence as q, sort as s, machine as f, experiment as e, plot as g, network as n, schedule as t, transform as x, proof as d, route as r } from './builders'

export const geographyMissions = [
  m('geo-map-scale','Rescue Team Map','Geography','6–8 grade','Change the scale, go through the points on the training map and prove that the route has been verified.','Two independent confirmations are required before the card can be transferred.',[
    e('Map scale','On the stand, the distance is equal to the length on the map multiplied by the number of kilometers in a centimeter. Compare two lengths on the same scale.','Length, cm','Kilometers in 1 cm','km','product',1,[3,2]),
    r('Field tour','The map is conditional: each team is one cell. Visit the point ● and the station.',2),
    d('Accept route','The route passes the checkpoint and ends at the station.',['Control visited','Station reached'],[['Field Journal','A mark has been made at the control point.',[0],2],['Finish record','The team checked in at the station.',[1],2],['Beautiful drawing','Beautiful design does not confirm the passage.',[],1]])]),
  m('geo-water','Water for the valley','Geography','6–8 grade','Restore the circulation, design water conduits and set up an observation station.','The final kit should take into account both sensors and mounts.',[
    q('Simplified circulation','Start with the water at the surface and trace one of the branches of the gyre.',['Evaporation','Condensation','Precipitation','Drain to the reservoir']),
    n('Water pipelines of the training valley','Connect the source, the village, the fields and the reservoir. This is an infrastructure diagram.',['Source','Village','Fields','Reservoir'],7),
    p('Set of observations','You need 4 sensors and 8 mounts.',['Sensors','Fastenings'],[4,8],[['Complete set',[1,2],4],['Sensor',[1,0],4],['Mounts 4 each',[0,4],2]])]),
  m('geo-weather','School Island Weather Office','Geography','6–8 grade','Separate weather from climate, evaluate records and link observation posts.','The direct channel to one post is closed; find the data path.',[
    s('Weather or climate?','One day does not determine the climate.',['weather','Climate'],[['It was raining today at 12:00',0,'This is the state of the atmosphere at a specific time.'],['Average precipitation over 30 years',1,'This is a characteristic of a long-term regime.'],['Wind is expected tomorrow',0,'This is the weather forecast for a specific day.']]),
    d('Comparable observations','Two series were measured by one instrument at one local time of day.',['One device','One time of day'],[['Device number','In both series the sensor is M4.',[0],2],['Magazine','Both series were held at 12:00.',[1],2],['Photos of the sky','Similar clouds do not support the same methodology.',[],1]]),
    n('Meteorological data transmission','After checking the methodology, restore the connection between the posts and the journal. Direct channel 0–2 is closed.',['Magazine','Post A','Post B','Remote control'],7,[1])]),
  m('geo-clock','Communication across time zones','Geography','7–9 grade','Set up clock recalculation, create a communication schedule and connect stations.','The direct channel is not available; messages go through an intermediate node.',[
    f('Study time zones','Station B has a time 5 hours ahead of A. The hours are 0 to 23; consider the transition through midnight.',[18,20,23],[23,1,4],[['+5','add',5],['mod 24','mod',24],['−5','add',-5]],2),
    t('One transmitter','Preparation before the session, confirmation after it.',[['Preparation',2,[]],['Session',3,[0]],['Confirmation',1,[1]]],9),
    n('Station communication','Connect A, B, repeater and archive without direct channel A–archive.',['A','B','Repeater','Archive'],7,[5])]),
  m('geo-soil','Soil Monitoring Plan','Geography','6–8 grade','Designate an area, plan sampling, and check the log for accuracy.','For the last step, you cannot replace the coordinates with an approximate description.',[
    g('Selection site','The training grid requires 6 connected cells, the central point is required.',6,12),
    t('One group work','Marking of points before sampling, signature of samples after sampling.',[['Marking',2,[]],['Sampling',3,[0]],['Signature',2,[1]]],10),
    d('Sample traceability','For each sample, the place and time of collection are recorded.',['Place','Time'],[['Coordinate sheet','For all samples, the cell number is indicated.',[0],2],['Time log','Each sample has a sampling time.',[1],2],['General photo','The signatures of individual samples are not visible in the image.',[],1]])]),
  m('geo-compass','Cartographer\'s Compass','Geography','5th–7th grade','Align the map sheet, draw a route and check directions.','The traveler must distinguish between the direction of movement and his own turn.',[
    x('Combine sheets','The grid is conditional; align the map fragment with the outline of the adjacent sheet.'),
    r('By oriented map','North is at the top of the field, east is on the right. Visit control ●.',0),
    s('Sides of the horizon','On this map, north is at the top.',['North','East','South','West'],[['Up the map',0,'This is north on an oriented field.'],['Right on the map',1,'This is the east.'],['Down the map',2,'This is the south.'],['Left on the map',3,'This is the west.']])]),
  m('geo-demography','School City Census','Geography','8–9 grade','Check the population of districts, distribute questionnaires and prepare a data collection network.','One communication channel is busy; collection must continue through a neighboring point.',[
    d('Agreed report','In the educational city, 12 houses in the northern region and 8 in the southern region were examined.',['North: 12','South: 8'],[['Northern magazine','12 different addresses; repetitions have been removed.',[0],2],['Southern Magazine','8 different addresses.',[1],2],['Sum of photos','40 photos may include repeat shots of houses.',[],1]]),
    p('Questionnaires by region','Prepare exactly 12 northern and 8 southern questionnaires.',['Northern','Southern'],[12,8],[['General package',[3,2],4],['North by 6',[6,0],2],['South by 4',[0,4],2]]),
    n('Collection of reports','Connect the center with the districts and the archive.',['Center','North','South','Archive'],7,[1])]),
  m('geo-field','Data Expedition','Geography','7–9 grade','Research resource consumption, collect an expedition kit and connect field teams.','The groups dispersed to different areas; we need to reconnect with each one.',[
    e('Consumption on the way','Training model: flow rate is equal to the path length multiplied by the flow rate per unit distance.','Path length','Consumption per unit','units','product',1,[4,3]),
    p('Expedition kit','Need 6 containers and 12 labels.',['Containers','Shortcuts'],[6,12],[['Sample set',[1,2],6],['Containers of 3',[3,0],2],['Labels of 4',[0,4],3]]),
    n('Expedition communications','After completing the set, connect the camp with two groups and an archive.',['Camp','Group A','Group B','Archive'],6)]),
]

export const computingMissions = [
  m('code-robot','Warehouse robot','Computer Science','5th–8th grade','Write the route, lay out the data types and set up the labeling of the boxes.','The marker must treat all input numbers with the same rule.',[
    r('Robot program','Visit the scanner ● and go to unloading. Correct a specific wrong step.',1),
    s('Data Types','We consider strings, integers and booleans.',['Number','String','Boolean'],[['42',0,'An entry without quotes represents a number.'],['"42"',1,'Quotes denote a string.'],['true',2,'This is a boolean value.']]),
    f('Marker','The box code is 2n + 1.',[1,3,4],[3,7,9],[['×2','multiply',2],['+1','add',1],['mod 2','mod',2]],2)]),
  m('code-backup','Save the school archive','Computer Science','7–9 grade','Review your backup, plan your recovery, and build a cohesive network.','The direct channel to the archive is not available; need a bypass.',[
    d('Copy is good','The backup copy is fresh and has passed integrity control.',['Required date','Integrity control'],[['Copy log','The copy was created after the last change.',[0],2],['Hash check','The hash of the copy matches the recorded reference value.',[1],2],['File name','The name final in itself does not confirm anything.',[],1]]),
    t('Recovery','Checking the copy before restoring; test after recovery.',[['Check copy',2,[]],['Restore',3,[0]],['Test',2,[1]]],10),
    n('Transmission network','Link the server, backup, workplace and archive; direct channel 0–3 is closed.',['Server','Reserve','Workplace','Archive'],7,[5])]),
  m('code-pipeline','Data Factory','Computer Science','7–9 grade','Build login processing, arrange checks, and complete transmission packages.','The network accepts only packets with the required amount of data and service blocks.',[
    f('Converter','The output should be (x + 1)².',[0,2,3],[1,9,16],[['+1','add',1],['Square','power',2],['×2','multiply',2]],2),
    q('Processing order','First read, then check the format, then calculate, then write the result.',['Read entry','Check format','Calculate result','Record output']),
    p('Packages','12 data blocks and 4 control blocks are needed.',['Data','Control'],[12,4],[['Package',[3,1],4],['Data for 6',[6,0],2],['Control by 2',[0,2],2]])]),
  m('code-network','Network after a break','Computer Science','7–9 grade','Build a network, conduct a test route and prove data delivery.','The fact of sending is not enough in the report; confirmation of receipt is required.',[
    n('Network connectivity','One channel is closed. All nodes must remain connected to the server.',['Server','Node A','Node B','Client'],7,[1]),
    r('Inspection robot','Go through the checkpoint to the client terminal.',2),
    d('Data delivered','The package was accepted by the client and passed content control.',['Client reception','Content Integrity'],[['Receipt','The client confirmed receipt of the P8 package.',[0],2],['Control','The hash of the received P8 coincided with the hash of the sent one.',[1],2],['Dispatch','The “sent” entry does not, by itself, prove receipt.',[],1]])]),
  m('code-debug','Debug Bureau','Computer Science','7–9 grade','Find the error class, assemble the correct processing and conduct an experiment with the inputs.','Before release, the dependency needs to be checked on new values.',[
    s('Where is the mistake?','Distinguish between incorrect order, incorrect operation and incorrect type.',['Order','Operation','Type'],[['First write down the result, then calculate it',0,'Actions have been rearranged.'],['Addition instead of multiplication',1,'Invalid operator selected.'],['An operation for numbers without conversion was applied to a string',2,'Data types are incompatible.']]),
    f('Corrected pipeline','We need y = 2(x − 1).',[1,3,5],[0,4,8],[['−1','add',-1],['×2','multiply',2],['+1','add',1]],2),
    e('Model verification','The bench calculates the product of two numeric inputs. Change just one input and predict a new outcome.','A','B','units','product',1,[4,3])]),
  m('code-scheduler','Task Scheduler','Computer Science','8–10 grade','Create a processor schedule, configure the calculation of memory addresses, and connect worker nodes.','There was a limited channel budget left to transmit the results.',[
    t('One performer','Load before calculation, save after calculation. At 3–4, the performer is busy with the system.',[['Loading',2,[]],['Calculation',3,[0]],['Saving',1,[1]]],10,[3]),
    f('Memory addresses','Blocks start at address 2, the size of each block is 4. For number n, calculate address 4n+2.',[0,1,3],[2,6,14],[['×4','multiply',4],['+2','add',2],['−2','add',-2]],2),
    n('Processing nodes','Link executor, memory, output and log.',['Performer','Memory','Conclusion','Magazine'],6)]),
  m('code-vector','Vector editor','Computer Science','6–9 grade','Transform the object, organize the layers and prepare the export area.','After rearranging the layers, the export area should retain the desired area.',[
    x('Transformation Matrix','Align the object with the target path by translation, rotation or reflection.'),
    q('Export preparation','Check the geometry first, then the layers, then the export area, then save the file.',['Check geometry','Check layers','Select area','Save file']),
    g('Export area','Select a connected area of 6 cells, the border is no more than 10.',6,10)]),
  m('code-protocol','Delivery protocol','Computer Science','7–9 grade','Collect your messaging, schedule your session, and check your confirmation log.','The session is considered completed only after receiving confirmation.',[
    q('Protocol order','Establishment of connection precedes data; confirmation follows acceptance.',['Establish connection','Send data','Accept data','Confirm appointment']),
    t('One channel','Setup before shipping, testing after shipping.',[['Settings',1,[]],['Dispatch',3,[0]],['Check',2,[1]]],9),
    d('Ended session','The acknowledgment ID matches the sent packet and is worth a later time.',['Same ID','Confirmation later than dispatch'],[['Identifiers','Sent P4; confirmed by P4.',[0],2],['Clock','Dispatch 10:00, confirmation 10:01.',[1],2],['Someone else\'s package','P3 also received confirmation.',[],1]])]),
]

export const historyMissions = [
  m('hist-archive','Archive of the old city','History','6–9 grade','Explore a fictional city archive: verify the provenance of documents, reconstruct the sequence and prepare an exhibition.','The showcase must be based on verifiable documents.',[
    d('Origin of record','The educational document was created by an eyewitness and dated to the year of the event.',['The author is an eyewitness','The date coincides with the event'],[['Signature','The author writes: “I was present at the opening.”',[0],2],['Date','The document and the discovery in the teaching condition are dated 1880.',[1],2],['Late retelling','The retelling is written without reference to the original document.',[],1]]),
    q('Chronology of the educational city','Arrange dated events in order of time.',['1850 - bridge project','1860 - construction','1880 - opening of the market','1900 - renovation of the square']),
    g('Exhibition location','Place a connected showcase with an area of 4 cells with a border of no more than 8.',4,8)]),
  m('hist-century','Guardian of Ages','History','5th–7th grade','Sort out the dates by century, put them in order and deliver the documents to the archive.','Archival registration is at an intermediate point.',[
    s('Borders of centuries','All dates AD. I century – years 1–100, II – 101–200 and onwards.',['16th century','XVIII century','XX century'],[['1580',0,'1501–1600 - 16th century.'],['1703',1,'1701–1800 - XVIII century.'],['1901',2,'1901–2000 - 20th century.']]),
    q('Series of dates','Arrange the cards from early date to late date.',['1580','1703','1800','1901']),
    r('Archive route','Once you have received the registration mark, ● deliver the dates to the storage facility.',3)]),
  m('hist-dig','Archaeological square','History','6–9 grade','Mark the excavation in the training model, create a recording order and check the context of the find.','The find cannot be described without the layer and location of discovery.',[
    g('Educational markup','Select 6 connected cells; the central cell is the reference point. This is a training outline, not a field excavation protocol.',6,12),
    q('Documenting the find','First, the position is fixed, then a number is given, then it is described, then it is associated with the layer record.',['Lock position','Assign a number','Describe the find','Link to layer']),
    d('Context of the find','The study find F2 has a square and a layer.',['Square indicated','Layer specified'],[['Map','F2 is marked in square C.',[0],2],['Layer log','F2 belongs to layer 3.',[1],2],['Photo without caption','Without a scale and signature, the place and layer cannot be established.',[],1]])]),
  m('hist-trade','Training City Trade Route','History','6–8 grade','Design a conditional exchange route, collect the cargo according to the invoice and check the source of information.','You can only accept documents confirming this particular cargo.',[
    n('Exchange path','Training scheme: connect the city, the pier, the market and the warehouse. It does not depict a specific historical route.',['City','Marina','Market','Warehouse'],7),
    p('Invoice','According to the fictitious invoice, 12 bags of grain and 4 rolls of fabric are needed.',['Grain','Fabric'],[12,4],[['Mixed cargo',[3,1],4],['Grain 6 each',[6,0],2],['Fabric 2',[0,2],2]]),
    d('Check cargo','The documents confirm the grain and fabric in the R5 shipment.',['Grain R5','Fabric R5'],[['grain leaf','Shipment R5 contains 12 bags of grain.',[0],2],['Textile sheet','R5 stores 4 rolls of fabric.',[1],2],['Other shipment','The R4 also had fabric.',[],1]])]),
  m('hist-sources','Two witnesses','History','7–10 grade','Compare educational evidence, separate observation from evaluation, and formulate a cautious conclusion.','In the final conclusion, the boundary between evidence and assumption must be maintained.',[
    d('Matching information','Both training witnesses describe a meeting in the square in the morning. Both records need to be verified.',['Record A','Record B'],[['Witness A','In the morning I came to the square for the meeting.',[0],2],['Witness B','The meeting in the square began before noon.',[1],2],['Late Legend','The event is described without place or time.',[],1]]),
    s('Observation and attitude','In the testimony, distinguish between a description of the action and evaluative words.',['Observation','Evaluation'],[['People gathered in the square.',0,'The action being tested is described.'],['It was a great event.',1,'Magnificent expresses the attitude of the author.'],['The speech began in the morning.',0,'The duration of action is indicated.']]),
    q('Cautious Conclusion','State only what the comparison confirms. Coincidence itself does not prove the independence of witnesses.',['Both entries','converge','in the place description','and meeting time.'])]),
  m('hist-museum','One Piece Museum','History','6–9 grade','Compose a biography of a fictional subject, check its foundations and assemble a museum kit.','The kit should include both the subject card and the source of its information.',[
    q('Item biography','Arrange the dated events of the conditional subject.',['1820 - production','1840 - donation','1900 - transfer to the assembly','1950 - admission to the museum']),
    d('Confirm receipt','The K2 item was accepted by the museum in 1950.',['K2 ID','Year 1950'],[['Inventory card','K2 subject accepted.',[0],2],['Acceptance certificate','The corresponding act has a date of 1950.',[1],2],['Similar item','The K3 item has a different story.',[],1]]),
    p('Museum set','You need 6 item cards and 6 copies of sources.',['Cards','Copies'],[6,6],[['Complete pair',[1,1],6],['Cards of 3',[3,0],2],['Copies of 3',[0,3],2]])]),
  m('hist-exhibition','Open historical exhibition','History','7–10 grade','Make a work schedule, pass the exposure check and restore the logic of the historical explanation.','The final signature should distinguish between prerequisite, event and consequence.',[
    t('Preparation of the exhibition','Checking the text before installation; opening after installation.',[['Text checking',2,[]],['Installation',3,[0]],['Opening',1,[1]]],9),
    r('Exposure control','Visit the control window ● and go to the entrance.',1),
    q('Causal chain','A fictitious example: a bridge is needed to connect two banks.',['There was a need for a crossing.','The city approved the bridge project.','The bridge was built.','A permanent transition has appeared.'])]),
]
