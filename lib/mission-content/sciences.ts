import { mission as m, pack as p, sequence as q, sort as s, balance as b, machine as f, experiment as e, plot as g, network as n, schedule as t, transform as x, proof as d, route as r } from './builders'

export const physicsMissions = [
  m('phy-motion','Drone on the measuring track','Physics','7th–8th grade','Explore the movement, set up the navigator and fly the drone through the measurement point.','After calibration, less charge remains; shorten the route.',[
    e('Uniform movement','Model s = v·t: speed is constant in each experiment. Change v at the same time.','Speed, m/s','Time, s','m','product',1,[3,4]),
    f('Distance recalculation','For v = 3 m/s, find the distance for each time.',[1,2,4],[3,6,12],[['×3','multiply',3],['+3','add',3],['÷3','divide',3]],2),
    r('Control track','Visit the measuring station ● before the finish line. Each team is one cell.',2)]),
  m('phy-density','Cargo for floating station','Physics','7th–8th grade','Study a lot of materials, sort samples and select a balanced load.','The cargo consignment is limited to two indicators at the same time.',[
    e('Mass and volume','Model m = ρV. Save the density and compare the two volumes.','Volume, l','Density, kg/l','kg','product',1,[4,2]),
    s('What is the sample made of?','Compare m/V densities. We use conditional materials A and B.',['Density 2','Density 3','Insufficient data'],[['Mass 6, volume 3',0,'6/3 = 2.'],['Mass 9, volume 3',1,'9/3 = 3.'],['Only mass 8',2,'Without volume, density cannot be determined.']]),
    p('Cargo compartment','Collect 12 kg in a volume of 6 liters.',['Weight, kg','Volume, l'],[12,6],[['Material A',[2,1],6],['Material B',[3,1],4],['Empty container',[0,1],3]])]),
  m('phy-electric','Bringing light back to the workshop','Physics','8–9 grade','Assemble the communication network, check the current dependence and prepare to start the equipment.','The stand cannot be launched simultaneously with the control measurement.',[
    n('Control channels','This is a controller communication diagram, not an electrical diagram of resistors. Tie all the knots.',['Remote control','Sensor','Relay','Signal'],6),
    e('Ohm\'s law on the stand','Ideal model I = U/R. Change the voltage at one resistance.','Voltage, V','Resistance, Ohm','A','ratio',1,[4,2]),
    t('Checks of one team','Inspection before measurement, measurement before launch.',[['Inspection',2,[]],['Measurement',2,[0]],['Launch',1,[1]]],8)]),
  m('phy-energy','Energy Park','Physics','8–10 grade','Measure kinetic energy, take into account its transformations and design a training area.','The platform must fit into the remaining fence material.',[
    e('Energy of movement','Ideal model E = mv²/2. The speed changes first, the mass remains constant.','Speed, m/s','Weight, kg','J','square',0.5,[4,2]),
    p('Distribute energy','In the conditional model, after descent, 16 J are distributed between useful movement and heating. Collect exactly 16 J; the energy does not disappear.',['Energy, J'],[16],[['Movement: 3 J portion',[3],5],['Heating: 2 J portion',[2],8]]),
    g('Experience platform','You need 6 connected cells with a border no longer than 10.',6,10)]),
  m('phy-spring','Spring Sorter','Physics','7–9 grade','Examine elastic deformation, tune the signal and check the conclusions.','The device must undergo a documented test before release.',[
    e('Hooke\'s law within the model','For small elastic deformations F = kx. Here x is in conventional units, k is the stand coefficient.','Extension x','Hardness k','units strength','product',1,[3,3]),
    f('Strength scale','For k=2 the counter converts the extension into force.',[1,3,4],[2,6,8],[['×2','multiply',2],['+2','add',2],['÷2','divide',2]],2),
    d('Output limits','The conclusion applies to the given spring and the tested deformation range.',['Same spring tested','Range limited'],[['Sample number','All experiments were performed with sample P1.',[0],2],['Range','Only small elastic elongations were used in the experiments.',[1],2],['Assumption','This is how any body behaves under any stretch.',[],1]])]),
  m('phy-power','Charging shift','Physics','8–9 grade','Compare power, distribute storage and coordinate access to the charging station.','Maintenance breaks the station\'s working window.',[
    e('Work for time','Power P = A/t. Change jobs at the same time.','Work, J','Time, s','W','ratio',1,[4,2]),
    p('Drives','You need exactly 12 conventional units of energy and 4 connectors.',['Energy','Connectors'],[12,4],[['Block 3',[3,1],4],['Block 6',[6,1],2],['Blank adapter',[0,1],4]]),
    t('Charging in turns','Diagnostics before charging; check after. Interval 2–3 is occupied by the service.',[['Diagnostics',2,[]],['Charging',3,[0]],['Check',1,[1]]],10,[2])]),
  m('phy-sound','Sound laboratory','Physics','8–9 grade','Separate frequency from loudness, examine the vibrations and collect the recording order.','The last entry requires the same measurement conditions.',[
    s('What are we measuring?','Frequency - the number of oscillations per second; amplitude - maximum deviation.',['Frequency','Amplitude','Time'],[['400 vibrations per second',0,'This is the frequency in hertz.'],['Maximum deviation 2 mm',1,'This is amplitude.'],['Recording lasts 3 s',2,'This is the duration of the recording.']]),
    e('Oscillation counting','Model f = N/t. The first number is the number of vibrations, the second is the time.','Fluctuations N','Time t','Hz','ratio',1,[4,2]),
    q('Comparable records','First, the conditions are fixed, then the first sound is recorded, then the second under the same conditions, then compared.',['Fix the conditions','Record sound A','Record sound B','Compare entries'])]),
  m('phy-optics','Optical pavilion','Physics','7th–8th grade','Prepare the panel orientation, distribute observations and conduct a control walk.','The passage to the control point goes around a closed sector.',[
    x('Mounting panel','This is the task of the geometry of the fastenings: align the panel with the contour. The beam path is not modeled here.'),
    s('Phenomena of light','Distribute observations according to the main phenomenon.',['Reflection','refraction','Absorption'],[['Image in a plane mirror',0,'The mirror reflects the light.'],['The pencil seems broken at the edge of the water',1,'The direction of light changes at the boundary of the media.'],['Dark surface heats up in the light',2,'Some of the light energy is absorbed.']]),
    r('Walking around the pavilion','Visit the inspection point ● and go to the stand.',3)]),
  m('phy-heat','Station thermal log','Physics','8–9 grade','Check the readings, assemble a processing program and restore the sensor network.','After the measurement, one communication channel was closed.',[
    d('Heating result','In the experiment, the temperature changed from 20°C to 26°C in 3 minutes.',['Start 20°C','End 26°C','Duration 3 minutes'],[['Initial shot','Thermometer: 20°C; hours 10:00.',[0],1],['Final shot','Thermometer: 26°C; the clock is 10:03.',[1,2],2],['Hand feeling','It seems warmer.',[],1]]),
    f('Temperature rise in the training model','For this model T = 20 + 2t. We do not consider it a universal law of heating.',[0,1,3],[20,22,26],[['×2','multiply',2],['+20','add',20],['−20','add',-20]],2),
    n('Sensor communication','Restore the transfer of results between nodes.',['Magazine','Sensor A','Sensor B','Remote control'],7,[1])]),
  m('phy-units','Units service','Physics','7–9 grade','Sort out the quantities, set up the conversion of units and complete the measuring kit.','Only the exact set of instruments is allowed for departure.',[
    s('Metrology departments','Distribute the symbols of units by magnitude.',['Length','Time','Weight'],[['cm',0,'Centimeter is a unit of length.'],['min',1,'A minute is a unit of time.'],['kg',2,'A kilogram is a unit of mass.'],['mm',0,'Millimeter is a unit of length.']]),
    f('Meters to centimeters','There are 100 centimeters in one meter.',[1,2,4],[100,200,400],[['×100','multiply',100],['÷100','divide',100],['+100','add',100]],2),
    p('Set of measurements','You need 4 rulers and 2 stopwatches.',['Rulers','Stopwatches'],[4,2],[['Pair set',[2,1],2],['Ruler',[1,0],4],['Stopwatch',[0,1],2]])]),
]

export const chemistryMissions = [
  m('chem-water','Atomic water workshop','Chemistry','8–9 grade','Complete an atomic balance, form molecular sets, and check the reaction record.','Substance indices cannot be changed in the final journal.',[
    b('Save atoms','Paper model of the reaction H₂ + O₂ → H₂O. Just change the odds.',['H','O'],[['H₂',[2,0],1],['O₂',[0,2],1],['H₂O',[2,1],-1]]),
    p('Sets of atoms','Four H₂O models require 8 H atoms and 4 O atoms.',['H','O'],[8,4],[['Pair H',[2,0],4],['Pair O',[0,2],2],['H₂O set',[2,1],4]]),
    q('Check equation','First, write down the formulas, then select the coefficients, count the atoms and reduce the common factor.',['Write formulas','Select odds','Count the atoms','Reduce odds'])]),
  m('chem-iron','Archive of iron samples','Chemistry','8–9 grade','Distribute the formulas, equalize the reaction and prove the conservation of the composition.','The archive only accepts confirmed entries.',[
    s('Types of substances','In this set we distinguish between simple substances and compounds according to the composition of the formula.',['Simple substance','Connection'],[['Fe',0,'Contains only the element Fe.'],['O₂',0,'Two atoms of one element.'],['Fe₂O₃',1,'Contains Fe and O.']]),
    b('Oxide balance','Model Fe + O₂ → Fe₂O₃. The indexes do not change.',['Fe','O'],[['Fe',[1,0],1],['O₂',[0,2],1],['Fe₂O₃',[2,3],-1]]),
    d('Checking the composition','The notation Fe₂O₃ contains two Fe atoms and three O atoms in the formula unit.',['Fe: 2','O: 3'],[['Fe index','After Fe there is an index 2.',[0],1],['Index O','After O there is an index 3.',[1],1],['Sample color','The red-brown color itself does not determine the exact formula.',[],1]])]),
  m('chem-carbon','Carbon accounting','Chemistry','8–9 grade','Check the combustion balance on the cards, set up the recalculation and complete the models.','For the last batch, three elements are important at once.',[
    b('Methane balance','Sign model only: CH₄ + O₂ → CO₂ + H₂O.',['C','H','O'],[['CH₄',[1,4,0],1],['O₂',[0,0,2],1],['CO₂',[1,0,2],-1],['H₂O',[0,2,1],-1]]),
    f('Number of H atoms','Each CH₄ molecule contains 4 hydrogen atoms.',[1,2,3],[4,8,12],[['×4','multiply',4],['+4','add',4],['÷4','divide',4]],2),
    p('Product Models','Collect the composition of two CO₂ and four H₂O: C=2, H=8, O=8.',['C','H','O'],[2,8,8],[['CO₂',[1,0,2],2],['H₂O',[0,2,1],4],['Separate O',[0,0,1],2]])]),
  m('chem-solution','Solution at a given proportion','Chemistry','8–9 grade','Examine the mass fraction, select the composition of the solution and confirm the result with notes.','The archive requires confirmation of both the mass of the substance and the total mass of the solution.',[
    e('Component share','Training model of fraction: m substance / m solution. The forecast is expressed as a number, not a percentage.','Mass of substance','Weight of solution','fraction','ratio',1,[2,4]),
    p('Composition by weight','You need 2 conventional units of substance and 8 water; final mass fraction 2/10.',['Substance','Water'],[2,8],[['Substance',[1,0],3],['Water',[0,2],4],['Mixture 1+4',[1,4],2]]),
    d('Confirm mass fraction','In the training solution there are 2 units of substance out of 10 total mass: fraction 0.2.',['Mass of substance 2','Total weight 10'],[['List of substances','2 units of the substance are added to the mixture.',[0],2],['General statement','Substances 2 and water 8, total mass 10.',[1],2],['Vessel volume','The size of the vessel itself does not determine the mass fraction.',[],1]])]),
  m('chem-salt','Catalog of salt models','Chemistry','8–9 grade','Make an atomic notation, sort the formulas and restore the order of verification.','The archive rejected a record with changed indexes; correct the procedure.',[
    b('Record balance','Sign model HCl + NaOH → NaCl + H₂O.',['H','Cl','Na','O'],[['HCl',[1,1,0,0],1],['NaOH',[1,0,1,1],1],['NaCl',[0,1,1,0],-1],['H₂O',[2,0,0,1],-1]]),
    s('Number of elements','Count different chemical elements, not atoms.',['Two elements','Three elements'],[['HCl',0,'H and Cl are two elements.'],['NaOH',1,'Na, O, H are three elements.'],['H₂O',0,'H and O are two elements.']]),
    q('Archive check','First, the formulas are checked, then the coefficients, then the atomic sums, then the record is published.',['Check formulas','Check odds','Compare atomic sums','Post a post'])]),
  m('chem-atoms','Mail of chemical symbols','Chemistry','Grade 8','Disassemble the symbols, assemble a set of atoms, and deliver the model to the correct department.','The control point requires a preliminary stamp.',[
    q('Read the formula','When reading H₂O, first identify the symbols H and O, then the indices, then the number of atoms of each element.',['Highlight H and O symbols','Read indexes 2 and 1','Write H: 2, O: 1','Prepare a set of atoms']),
    p('Composition of molecular models','Collect 6 H and 3 O for three water models.',['H','O'],[6,3],[['Water set',[2,1],3],['Atom H',[1,0],6],['Atom O',[0,1],3]]),
    r('Delivery of models','First the inspection point ● then the molecule department.',1)]),
  m('chem-co2','Carbon dioxide station','Chemistry','8–9 grade','Confirm the formula, equalize the formation model and set up the atom counter.','The counter must work for several batch sizes.',[
    d('CO₂ composition','One CO₂ molecule contains one C and two O.',['One C','Two O'],[['Record C','The symbol C has no index: it is one atom.',[0],1],['Record O₂','Index 2 refers to O only.',[1],1],['General index','Assumption: Index 2 refers to the entire formula.',[],1]]),
    b('Atomic balance','Model C + O₂ → CO₂.',['C','O'],[['C',[1,0],1],['O₂',[0,2],1],['CO₂',[1,2],-1]]),
    f('Oxygen meter','Number of O atoms in n CO₂ molecules.',[1,3,5],[2,6,10],[['×2','multiply',2],['+2','add',2],['Square','power',2]],2)]),
  m('chem-lab-plan','Laboratory on paper','Chemistry','8–9 grade','Coordinate data processing stages, form models and link workspaces.','One communication channel is busy; the log must receive data via a different path.',[
    t('Working with a recording','Counting atoms after entering formulas, review after calculation.',[['Entering formulas',2,[]],['Counting atoms',3,[0]],['Review',2,[1]]],10),
    p('Set of cards','You need 8 H cards and 4 O cards.',['H','O'],[8,4],[['Package 2H+O',[2,1],4],['Pair H',[2,0],4],['Pair O',[0,2],2]]),
    n('Data exchange','Connect log, input, check and archive.',['Magazine','Enter','Check','Archive'],7,[1])]),
]

export const biologyMissions = [
  m('bio-greenhouse','Researchers\' Greenhouse','Biology','6–8 grade','Separate the experimental conditions, plan the observations and prepare the site.','After setting up, a reserve was needed for the control bed.',[
    s('Honest comparison','Checking the influence of light. Which conditions do we change and which do we keep?',['We change','Save'],[['Illumination',0,'This is the variable being studied.'],['Plant type',1,'Another view will prevent you from highlighting the effect of light.'],['Watering',1,'The amount of water must be the same.'],['Soil type',1,'Soil is an additional factor.']]),
    t('Order of experience','Marking before measurement; recording results after measurement.',[['Group marking',2,[]],['Measurement',3,[0]],['Record',2,[1]]],10),
    g('Control bed','The curriculum requires 6 connected cells with a compact border.',6,10)]),
  m('bio-herbarium','Herbarium without confusion','Biology','5th–7th grade','Collect observations, check signs and deliver a sample with documents.','The sample is accepted only after control registration.',[
    q('Sample description','First, inspection, then recording of features, then comparison with the determinant, then recording of the version.',['Inspect the sample','Write down the signs','Compare with determinant','Write version']),
    d('Confirm training sample','In the training card, the specimen has parallel veins and a narrow leaf blade.',['Parallel veins','Narrow plate'],[['Close-up shot','The veins run approximately parallel along the leaf.',[0],2],['Measurement','The plate is noticeably longer than its width.',[1],2],['Location of discovery','Specimen found near the road; the species is not determined by this.',[],1]]),
    r('Donate the herbarium','Visit registration ● before delivery to the archive.',3)]),
  m('bio-food','Pond food connections','Biology','6–8 grade','Analyze the roles, restore the direction of transfer of matter and prepare an observation.','The test requires distinguishing the direction of the arrow from the location of the organism.',[
    s('Roles in the ecosystem','In a simplified example, we consider grass, a grasshopper, and a frog.',['Manufacturer','First order consumer','Next order consumer'],[['Grass',0,'The plant creates organic matter through photosynthesis.'],['Grasshopper eating grass',1,'In this example, it eats the producer.'],['A frog that ate a grasshopper',2,'In this example, it eats the consumer.']]),
    q('Training chain','The arrow shows the transfer of matter and energy from food to the person who eats it.',['Grass','Grasshopper','frog']),
    t('Pond observation','Select a point before observation, record after observation.',[['Select point',1,[]],['Observe',4,[0]],['Record connections',2,[1]]],10)]),
  m('bio-cell','Cell Museum','Biology','6–8 grade','Check the functions of the structures, distribute the captions and assemble the exposition.','The last stand only accepts the full set of signatures and images.',[
    d('Plant cell model','The model presented has a cell wall and a chloroplast.',['Cell wall','Chloroplast'],[['Model legend','The outer hard shell is designated as the cell wall.',[0],2],['Organoid signature','The green organelle is labeled “chloroplast”.',[1],2],['Background color','The green background itself does not prove the presence of an organoid.',[],1]]),
    s('Functions of structures','Distribute the signatures within the school model of the cell.',['Core','Membrane','Chloroplast'],[['Contains the bulk of the genetic information of a eukaryotic cell',0,'This is the core; there are also DNA organelles.'],['Separates the cell and participates in metabolism with the environment',1,'This is the cell membrane.'],['Photosynthesis occurs in it',2,'This is a chloroplast.']]),
    p('Exhibition kits','Requires 6 images and 6 captions.',['Images','Signatures'],[6,6],[['Couple',[1,1],6],['Images of 3',[3,0],2],['Signatures of 3',[0,3],2]])]),
  m('bio-migration','Flight diary','Biology','6–8 grade','Go through observation points, collect route evidence, and organize your notes.','Unconfirmed messages cannot be included in the log as observations.',[
    r('Observation network','Visit the location ● and transfer the data to the station. This is an educational map, not the actual route of the species.',2),
    d('Same label','A bird with the K7 tag was recorded at two locations on different days.',['Mark K7 in the first paragraph','Mark K7 in the second paragraph'],[['Magazine A','Day 1: K7 tag photographed.',[0],2],['Magazine B','Day 3: K7 tag photographed.',[1],2],['Rumor','Someone saw a similar bird without a legible mark.',[],1]]),
    q('Field day timeline','Sort your entries by time.',['08:00 - check the camera','10:00 - watch the mark','12:00 - compare photos','16:00 - send report'])]),
  m('bio-seeds','Seed bank','Biology','6–8 grade','Distribute samples, collect control lots, and schedule observations.','The microscope is only available to one group at a time.',[
    s('Experiment groups','In a learning experience, only the presence of light changes; other conditions are equal.',['Light','Darkness','Not suitable for comparison'],[['Same batch, same water, in the light',0,'This is a light group.'],['Same party, same water, in the dark',1,'This is a group without light.'],['Different view and different watering',2,'Several factors have changed.']]),
    p('Equal games','Collect 12 seeds from batch A and 12 from batch B for counting.',['A','B'],[12,12],[['A couple of packages',[3,3],4],['A by 4',[4,0],3],['B 4 each',[0,4],3]]),
    t('Observation','Marking before inspection; recording after inspection. At 3–4 the equipment is occupied.',[['Marking',2,[]],['Inspection',2,[0]],['Record',1,[1]]],9,[3])]),
  m('bio-habitat','Shelters in the school yard','Biology','5th–7th grade','Choose a site, set up a surveillance network, and separate conclusions from guesswork.','The new report should confirm the visit to the shelter, not just its presence.',[
    g('Observation site','Conditional map: 6 adjacent cells, the central one is required; forbidden cells are paths.',6,12),
    n('Transfer of observations','This is an information network of sensors, not a food web.',['Magazine','Camera A','Chamber B','Remote control'],7),
    d('Who visited the shelter?','The training camera recorded the visit on Day 2 and Day 4.',['Visit on day 2','Visit on day 4'],[['Frame 2','Reading date: day 2; animal at the entrance.',[0],2],['Frame 4','Reading date: day 4; animal at the entrance.',[1],2],['Shelter size','Large size does not prove attendance.',[],1]])]),
  m('bio-digestion','The Journey of the Teaching Model','Biology','7th–8th grade','Restore the path of food, distribute functions and give a tour of the model.','The guide must first enter the control room.',[
    q('Path along the digestive tract','Arrange the listed main areas; There are additional structures between them in a real organism.',['Oral cavity','Esophagus','Stomach','Small intestine','Large intestine']),
    s('Functions in the school model','Choose the main one from the listed areas for each action.',['Oral cavity','Stomach','Small intestine'],[['Mechanical grinding with teeth',0,'Teeth are located in the oral cavity.'],['Acidic environment and the action of pepsin',1,'This is typical for the stomach.'],['Basic nutrient absorption',2,'It occurs mainly in the small intestine.']]),
    r('Excursion route','This is a diagram of the hall with a model, not an anatomical map. Visit control ● and exit.',0)]),
]
