import type { Activity } from './mission-workshop'
type Proof = Extract<Activity, { kind: 'proof' }>
export const investigationCases: Record<string, { proof: Pick<Proof, 'claim' | 'facts' | 'sources' | 'budget'>; choices: string[]; answer: number; why: string; outcome: string }> = {
  'eng-news': {
    proof: { claim: 'Which update can the neighbourhood newsletter publish?', facts: ['What actually happened yesterday?', 'Where will the next meeting take place?'], budget: 4, sources: [
      { name: 'Email · Monday 18:00', text: 'We planned to open in the library on Monday, but the building was closed. The opening moved to the park and went ahead there at five.', supports: [0], cost: 2 },
      { name: 'Notice · Tuesday 08:00', text: 'The library is open again. Our next club meeting will be here on Thursday. Yesterday’s opening was outdoors.', supports: [1], cost: 2 },
      { name: 'Poster · printed last week', text: 'Grand opening: Monday, 5 pm, library. Everyone welcome!', supports: [], cost: 1 },
    ] },
    choices: ['The club opened in the library on Monday.', 'The club opened in the park. The next meeting will be in the library.', 'The club will open in the park on Thursday.'], answer: 1,
    why: 'Compare the dates. The old poster describes a plan; the later email reports a change. Thursday is the next meeting, not the opening.',
    outcome: 'The newspaper came out with a clarification: the opening took place in the park, the next meeting will be in the library. Readers are directed to the right place.',
  },
  'hist-sources': {
    proof: { claim: 'What do the records of the fictitious town meeting suggest?', facts: ['Direct participant observation', 'Origin of the second entry'], budget: 4, sources: [
      { name: 'Master\'s Diary · Meeting Day', text: 'After the morning bell rang, I went out to the square. The new order was already being read at the town hall. I stood there until noon.', supports: [0], cost: 2 },
      { name: 'Scribe\'s notebook · one year later', text: 'We learn about the meeting on the square from the master’s diary. Below I rewrite his story almost verbatim. I myself was in another city that day.', supports: [1], cost: 2 },
      { name: 'Holiday legend · a century later', text: 'They say that all the residents came to the magnificent meeting. Who started this story is no longer known.', supports: [], cost: 1 },
    ] },
    choices: ['Two independent eyewitnesses confirm that all residents came.', 'The place and time of the morning are described by an eyewitness; the second entry depends on his diary.', 'The later legend is more accurate because it contains more details.'], answer: 1,
    why: 'The scribe directly names the diary as his source and was not present in person. The coincidence of texts does not yet provide two independent pieces of evidence.',
    outcome: 'The council signed a certificate indicating one eyewitness and a dependent paraphrase. The unconfirmed claim about all residents has been ruled out.',
  },
  'ela-quote': {
    proof: { claim: 'How to sign the phrase “Let’s start with observation” in a school publication?', facts: ['Who owns the replica in the primary record?', 'What event does the entry refer to?'], budget: 4, sources: [
      { name: 'Transcript sheet 3', text: 'Boris: “What should we do first?” Anna: “Let’s start with observation.” Boris: “Okay, I’ll write down the results.”', supports: [0], cost: 2 },
      { name: 'Folder cover March 12', text: 'Research Club. Transcript of the meeting, sheets 1–4. Secretary: Boris.', supports: [1], cost: 2 },
      { name: 'Post without link', text: 'Our secretary Boris said an excellent phrase: “Let\'s start with observation”! It seems like it was on the school line.', supports: [], cost: 1 },
    ] },
    choices: ['Boris said on the line: “Let’s start with observation.”', 'This is the best phrase Anna said at the club meeting.', 'Anna said at a research club meeting: “Let’s start with observation.”'], answer: 2,
    why: 'The secretary writes down someone else\'s remarks: his name on the cover does not make him the author. The “best” rating is not confirmed by sources.',
    outcome: 'The publication included Anna\'s exact signature with the context of the meeting. The erroneous retelling was not published.',
  },
}
