import { algebraMissions, geometryMissions, mathematicsMissions } from './mathematics'
import { biologyMissions, chemistryMissions, physicsMissions } from './sciences'
import { englishMissions, languageArtsMissions } from './languages'
import { computingMissions, geographyMissions, historyMissions } from './world-and-code'

export const workshopMissions = [...mathematicsMissions, ...algebraMissions, ...geometryMissions, ...englishMissions, ...languageArtsMissions, ...physicsMissions, ...chemistryMissions, ...biologyMissions, ...geographyMissions, ...computingMissions, ...historyMissions]
