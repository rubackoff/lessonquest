export type SubjectOption = {
  id: string
  label: string
  group: 'school' | 'languages' | 'adult'
}

export const subjectOptions: SubjectOption[] = [
  { id: 'preschool', label: 'School Readiness', group: 'school' },
  { id: 'speech-therapy', label: 'Speech therapy', group: 'school' },
  { id: 'primary', label: 'Primary School', group: 'school' },
  { id: 'world-around', label: 'Our World', group: 'school' },
  { id: 'math', label: 'Mathematics', group: 'school' },
  { id: 'algebra', label: 'Algebra', group: 'school' },
  { id: 'geometry', label: 'Geometry', group: 'school' },
  { id: 'language-arts', label: 'Language Arts', group: 'school' },
  { id: 'literature', label: 'Literature', group: 'school' },
  { id: 'physics', label: 'Physics', group: 'school' },
  { id: 'chemistry', label: 'Chemistry', group: 'school' },
  { id: 'biology', label: 'Biology', group: 'school' },
  { id: 'ecology', label: 'Ecology', group: 'school' },
  { id: 'astronomy', label: 'Astronomy', group: 'school' },
  { id: 'geography', label: 'Geography', group: 'school' },
  { id: 'history', label: 'History', group: 'school' },
  { id: 'social-studies', label: 'Social Studies', group: 'school' },
  { id: 'computer-science', label: 'Computer Science', group: 'school' },
  { id: 'art', label: 'fine arts', group: 'school' },
  { id: 'music', label: 'Music', group: 'school' },
  { id: 'english', label: 'English', group: 'languages' },
  { id: 'german', label: 'German language', group: 'languages' },
  { id: 'french', label: 'French language', group: 'languages' },
  { id: 'spanish', label: 'Spanish language', group: 'languages' },
  { id: 'chinese', label: 'Chinese language', group: 'languages' },
  { id: 'other-language', label: 'Other foreign language', group: 'languages' },
  { id: 'economics', label: 'Economics', group: 'adult' },
  { id: 'law', label: 'Right', group: 'adult' },
  { id: 'programming', label: 'Programming', group: 'adult' },
  { id: 'exam-prep', label: 'Preparation for the OGE and the Unified State Exam', group: 'adult' },
  { id: 'professional', label: 'Professional skills', group: 'adult' },
  { id: 'other', label: 'Other item', group: 'adult' },
]
