'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileJson,
  Folder,
  Gamepad2,
  LibraryBig,
  Link2,
  Palette,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import { ForceLabCanvas } from '@/components/games/force-lab'
import { GeometryDiagram } from '@/components/geometry-diagram'
import { GroupSortCanvas } from '@/components/games/group-sort'
import { MatchPairsCanvas } from '@/components/match-pairs-canvas'
import { LearningImageField, LearningImageView } from '@/components/learning-image'
import { MistakeArenaCanvas } from '@/components/games/mistake-arena'
import { QuizRushStage } from '@/components/games/quiz-rush'
import { RecallDeckStage } from '@/components/games/recall-deck'
import { activities, getActivityDefinition, type GameId } from '@/lib/activity-runtime'
import { parseGeneratedDraft } from '@/lib/ai-generation'
import { searchContentLibrary, type ContentLibraryItem } from '@/lib/content-library'
import type { SavedAttempt } from '@/lib/attempt-api'
import {
  buildEditableLevel,
  createEditorDrafts,
  mergeEditorDrafts,
  validateEditorDraft,
  type CommonEditorDraft,
  type EditableLevel,
  type ForceEditorDraft,
  type GroupEditorDraft,
  type MatchEditorDraft,
  type MistakeEditorDraft,
  type QuizEditorDraft,
  type RecallEditorDraft,
  type SavedEditorActivity,
} from '@/lib/editor-runtime'
import { getBalanceResult, type ForceLabLevel } from '@/lib/force-lab'
import { transitionMatchPairsAttempt } from '@/lib/game-session/match-pairs-session'
import { getGroupSortResult, type GroupPlacement, type GroupSortLevel } from '@/lib/group-sort'
import { getMatchPairsResult, type MatchConnection, type MatchPairsLevel } from '@/lib/match-pairs'
import type { LearningImage } from '@/lib/learning-media'
import { subjectOptions } from '@/lib/subject-taxonomy'
import { getMistakeArenaResult, type MistakeArenaLevel } from '@/lib/mistake-arena'
import { createEmptyQuizAnswers, getQuizRushResult, type QuizRushLevel } from '@/lib/quiz-rush'
import {
  createEmptyRecallRatings,
  getRecallDeckResult,
  type RecallDeckLevel,
  type RecallRating,
} from '@/lib/recall-deck'
import {
  defaultVisualThemeId,
  visualThemes,
  type VisualThemeId,
} from '@/lib/visual-themes'

const DRAFT_STORAGE_KEY = 'novaclass.editor.drafts.v1'

const AI_PROMPT_EXAMPLES: Record<GameId, string> = {
  'force-lab': 'For example: come up with a physics problem for 7th grade on the balance of forces with a simple linear equation.',
  'mistake-arena': 'For example: do a task for an adult level B1 to find an error in the Present Perfect.',
  'match-pairs': 'For example: do 6 pairs in chemistry for grade 8: the formula of a substance and its name.',
  'group-sort': 'For example: do a biology sorting for 6th grade, animals by class.',
  'quiz-rush': 'For example: make 4 questions for an adult level B1 in English for travel with short explanations.',
  'recall-deck': 'For example: make 5 flashcards for adult B1 using English phrases after a business meeting.',
}

type ActivityEditorProps = {
  activeGame: GameId
  onTestLevel: (gameId: GameId, level: EditableLevel) => void
  onSelectGame: (gameId: GameId) => void
}

export function ActivityEditor({ activeGame, onTestLevel, onSelectGame }: ActivityEditorProps) {
  const [drafts, setDrafts] = useState(createEditorDrafts)
  const [savedActivities, setSavedActivities] = useState<SavedEditorActivity[]>([])
  const [attempts, setAttempts] = useState<SavedAttempt[]>([])
  const [attemptsStatus, setAttemptsStatus] = useState('Loading the results...')
  const [storageReady, setStorageReady] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<VisualThemeId>(defaultVisualThemeId)
  const [aiStatus, setAiStatus] = useState('Describe the exercise in ordinary words. The AI ​​will fill in the fields of the selected template.')
  const [saveStatus, setSaveStatus] = useState('The draft is ready for editing.')
  const [previewForce, setPreviewForce] = useState(5)
  const [previewAngle, setPreviewAngle] = useState(18)
  const [mistakeSelection, setMistakeSelection] = useState<number | null>(null)
  const [matchConnections, setMatchConnections] = useState<MatchConnection[]>([])
  const [matchAttempts, setMatchAttempts] = useState(0)
  const [matchSessionRevision, setMatchSessionRevision] = useState(0)
  const [groupPlacements, setGroupPlacements] = useState<GroupPlacement[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Array<number | null>>([])
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0)
  const [recallRatings, setRecallRatings] = useState<Array<RecallRating | null>>([])
  const [recallCardIndex, setRecallCardIndex] = useState(0)
  const [recallRevealed, setRecallRevealed] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [dataPanelOpen, setDataPanelOpen] = useState(false)

  const activity = getActivityDefinition(activeGame)
  const activeDraft = drafts[activeGame]
  const activeLevel = useMemo(() => buildEditableLevel(activeGame, activeDraft), [activeDraft, activeGame])
  const themedActiveLevel = useMemo(
    () => ({ ...activeLevel, visualThemeId: selectedTheme }),
    [activeLevel, selectedTheme],
  )
  const libraryItems = useMemo(
    () => searchContentLibrary(activeGame, libraryQuery),
    [activeGame, libraryQuery],
  )
  const validationErrors = useMemo(
    () => validateEditorDraft(activeGame, activeDraft),
    [activeDraft, activeGame],
  )
  const activeJson = useMemo(() => JSON.stringify(themedActiveLevel, null, 2), [themedActiveLevel])

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY)

        if (storedDrafts) setDrafts(mergeEditorDrafts(JSON.parse(storedDrafts)))
      } catch {
        setSaveStatus('The local storage was not read, a blank draft was opened.')
      } finally {
        setStorageReady(true)
      }
    })
  }, [])

  const refreshAttempts = useCallback(async () => {
    setAttemptsStatus('Updated results...')

    try {
      const response = await fetch('/api/attempts')
      if (!response.ok) throw new Error('Failed to load results.')

      const payload = (await response.json()) as { attempts?: SavedAttempt[] }
      const nextAttempts = Array.isArray(payload.attempts) ? payload.attempts : []
      setAttempts(nextAttempts)
      setAttemptsStatus(nextAttempts.length > 0 ? `Latest results: ${nextAttempts.length}` : 'No walkthroughs yet.')
    } catch (error) {
      setAttemptsStatus(error instanceof Error ? error.message : 'Failed to load results.')
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void refreshAttempts())
  }, [refreshAttempts])

  useEffect(() => {
    if (!storageReady) return
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
    } catch {
      queueMicrotask(() => {
        setSaveStatus('The draft is too large for local storage. Publish it or delete some of the images.')
      })
    }
  }, [drafts, storageReady])

  useEffect(() => {
    const controller = new AbortController()

    async function loadPublishedActivities() {
      try {
        const response = await fetch('/api/activities', { signal: controller.signal })
        if (!response.ok) throw new Error('Failed to load library.')

        const payload = (await response.json()) as { activities?: SavedEditorActivity[] }
        setSavedActivities(Array.isArray(payload.activities) ? payload.activities : [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSaveStatus('The server library is temporarily unavailable.')
        }
      }
    }

    void loadPublishedActivities()
    return () => controller.abort()
  }, [])

  const updateActiveDraft = (patch: Partial<CommonEditorDraft>) => {
    setDrafts((value) => ({
      ...value,
      [activeGame]: {
        ...value[activeGame],
        ...patch,
      },
    }))
  }

  const updateForceDraft = (patch: Partial<ForceEditorDraft>) => {
    setDrafts((value) => ({ ...value, 'force-lab': { ...value['force-lab'], ...patch } }))
  }

  const updateMistakeDraft = (patch: Partial<MistakeEditorDraft>) => {
    setDrafts((value) => ({ ...value, 'mistake-arena': { ...value['mistake-arena'], ...patch } }))
  }

  const updateMatchDraft = (patch: Partial<MatchEditorDraft>) => {
    setMatchConnections([])
    setMatchAttempts(0)
    setMatchSessionRevision((value) => value + 1)
    setDrafts((value) => ({
      ...value,
      'match-pairs': {
        ...value['match-pairs'],
        ...patch,
      },
    }))
  }

  const updateGroupDraft = (patch: Partial<GroupEditorDraft>) => {
    setDrafts((value) => ({ ...value, 'group-sort': { ...value['group-sort'], ...patch } }))
  }

  const updateQuizDraft = (patch: Partial<QuizEditorDraft>) => {
    setDrafts((value) => ({ ...value, 'quiz-rush': { ...value['quiz-rush'], ...patch } }))
  }

  const updateRecallDraft = (patch: Partial<RecallEditorDraft>) => {
    setDrafts((value) => ({ ...value, 'recall-deck': { ...value['recall-deck'], ...patch } }))
  }

  const resetActiveDraft = () => {
    const defaults = createEditorDrafts()
    setDrafts((value) => ({ ...value, [activeGame]: defaults[activeGame] }))
    setMistakeSelection(null)
    setMatchConnections([])
    setMatchAttempts(0)
    setMatchSessionRevision((value) => value + 1)
    setGroupPlacements([])
    setQuizAnswers([])
    setQuizQuestionIndex(0)
    setRecallRatings([])
    setRecallCardIndex(0)
    setRecallRevealed(false)
    setSaveStatus('The current template is reset to the baseline level.')
  }

  const applyLibraryItem = (item: ContentLibraryItem) => {
    setDrafts((value) => {
      if (item.gameId === 'force-lab') return { ...value, 'force-lab': item.draft as ForceEditorDraft }
      if (item.gameId === 'mistake-arena') return { ...value, 'mistake-arena': item.draft as MistakeEditorDraft }
      if (item.gameId === 'match-pairs') return { ...value, 'match-pairs': item.draft as MatchEditorDraft }
      if (item.gameId === 'group-sort') return { ...value, 'group-sort': item.draft as GroupEditorDraft }
      if (item.gameId === 'quiz-rush') return { ...value, 'quiz-rush': item.draft as QuizEditorDraft }
      return { ...value, 'recall-deck': item.draft as RecallEditorDraft }
    })
    setMistakeSelection(null)
    setMatchConnections([])
    setMatchAttempts(0)
    setMatchSessionRevision((value) => value + 1)
    setGroupPlacements([])
    setQuizAnswers([])
    setQuizQuestionIndex(0)
    setRecallRatings([])
    setRecallCardIndex(0)
    setRecallRevealed(false)
    setSaveStatus(`Ready set loaded "${item.title}" It can be changed before publication.`)
  }

  const generateAiDraft = async () => {
    const prompt = aiPrompt.trim()
    if (prompt.length < 10) {
      setAiStatus('Add some details: subject, topic, age or level of the student.')
      return
    }

    const requestedGame = activeGame
    setAiGenerating(true)
    setAiStatus('We create a draft and check its structure...')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: requestedGame, prompt }),
      })
      const payload = (await response.json()) as { draft?: unknown; error?: string }

      if (!response.ok) throw new Error(payload.error || 'The AI did not create a draft.')

      const generatedDraft = parseGeneratedDraft(requestedGame, payload.draft)
      if (!generatedDraft) throw new Error('The draft does not match the selected game template.')

      setDrafts((value) => {
        if (requestedGame === 'force-lab') {
          return { ...value, 'force-lab': generatedDraft as ForceEditorDraft }
        }
        if (requestedGame === 'mistake-arena') {
          return { ...value, 'mistake-arena': generatedDraft as MistakeEditorDraft }
        }
        if (requestedGame === 'match-pairs') {
          return { ...value, 'match-pairs': generatedDraft as MatchEditorDraft }
        }
        if (requestedGame === 'group-sort') {
          return { ...value, 'group-sort': generatedDraft as GroupEditorDraft }
        }
        if (requestedGame === 'quiz-rush') {
          return { ...value, 'quiz-rush': generatedDraft as QuizEditorDraft }
        }
        return { ...value, 'recall-deck': generatedDraft as RecallEditorDraft }
      })
      setMistakeSelection(null)
      setMatchConnections([])
      setMatchAttempts(0)
      setMatchSessionRevision((value) => value + 1)
      setGroupPlacements([])
      setQuizAnswers([])
      setQuizQuestionIndex(0)
      setRecallRatings([])
      setRecallCardIndex(0)
      setRecallRevealed(false)
      setAiStatus('The draft is ready. Check the fields and preview, then save manually.')
    } catch (error) {
      setAiStatus(error instanceof Error ? error.message : 'Failed to create AI draft.')
    } finally {
      setAiGenerating(false)
    }
  }

  const saveActivity = async () => {
    if (validationErrors.length > 0) {
      setSaveStatus('Correct validation errors before saving.')
      return
    }

    setPublishing(true)
    setSaveStatus('We are publishing an exercise...')

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: activeGame, title: activeLevel.title, level: themedActiveLevel }),
      })
      const payload = (await response.json()) as { activity?: SavedEditorActivity; error?: string }

      if (!response.ok || !payload.activity) {
        throw new Error(payload.error || 'The server did not save the exercise.')
      }

      const saved = payload.activity
      setSavedActivities((value) => [saved, ...value].slice(0, 20))
      setSaveStatus(`Published: ${saved.title}. The student's link is ready.`)
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Failed to publish exercise.')
    } finally {
      setPublishing(false)
    }
  }

  const deleteSavedActivity = async (id: string) => {
    try {
      const response = await fetch(`/api/activities/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('The server did not delete the job.')

      setSavedActivities((value) => value.filter((activity) => activity.id !== id))
      setSaveStatus('The published task has been deleted.')
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Failed to delete task.')
    }
  }

  const testActivity = () => {
    if (validationErrors.length > 0) {
      setSaveStatus('Fix validation errors before launch.')
      return
    }

    onTestLevel(activeGame, themedActiveLevel as EditableLevel)
    setSaveStatus(`Test started: ${activeLevel.title}`)
  }

  const renderSpecificFields = () => {
    if (activeGame === 'force-lab') {
      return <ForceFields draft={drafts['force-lab']} onChange={updateForceDraft} />
    }

    if (activeGame === 'mistake-arena') {
      return <MistakeFields draft={drafts['mistake-arena']} onChange={updateMistakeDraft} />
    }

    if (activeGame === 'match-pairs') {
      return <MatchFields draft={drafts['match-pairs']} onChange={updateMatchDraft} />
    }

    if (activeGame === 'group-sort') {
      return <GroupFields draft={drafts['group-sort']} onChange={updateGroupDraft} />
    }

    if (activeGame === 'quiz-rush') {
      return <QuizFields draft={drafts['quiz-rush']} onChange={updateQuizDraft} />
    }

    return <RecallFields draft={drafts['recall-deck']} onChange={updateRecallDraft} />
  }

  return (
    <section
      className={activeGame === 'match-pairs' ? 'editor-layout is-match-editor' : 'editor-layout'}
      aria-label="Interactive task constructor"
    >
      <header className="editor-command-bar">
        <div className="editor-command-title">
          <Link2 size={21} aria-hidden="true" />
          <strong>{activity.label}</strong>
        </div>
        <div className={validationErrors.length === 0 ? 'editor-save-state is-valid' : 'editor-save-state'} role="status">
          {validationErrors.length === 0 ? <Check size={17} /> : <AlertTriangle size={17} />}
          <span>{publishing ? 'Save changes...' : saveStatus}</span>
        </div>
        <div className="editor-command-actions">
          <button
            type="button"
            className="ghost-button editor-launch-button"
            disabled={validationErrors.length > 0}
            onClick={testActivity}
          >
            <Play size={16} fill="currentColor" />
            Launch
          </button>
          <button
            type="button"
            className="primary-button editor-save-button"
            disabled={validationErrors.length > 0 || publishing}
            onClick={() => void saveActivity()}
          >
            <Save size={16} />
            {publishing ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <nav className="editor-nav" aria-label="Templates and materials">
        <h2>Content</h2>
        <strong className="editor-nav-label">Templates</strong>
        <div className="editor-template-nav">
          {activities.map((game) => (
            <button
              type="button"
              key={game.id}
              className={activeGame === game.id ? 'is-active' : ''}
              onClick={() => onSelectGame(game.id)}
            >
              <span aria-hidden="true"><Gamepad2 size={17} /></span>
              <span>{game.label}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          ))}
        </div>

        <button type="button" className="editor-library-open" onClick={() => setLibraryOpen(true)}>
          <LibraryBig size={17} />
          Ready-made activities
          <span>{libraryItems.length}</span>
        </button>

        <div className="editor-nav-separator" />
        <strong className="editor-nav-label">My activities</strong>
        <div className="editor-folder-list">
          {['Mathematics', 'Language Arts', 'Our World', 'English'].map((folder) => (
            <button type="button" key={folder} onClick={() => {
              setLibraryQuery(folder)
              setLibraryOpen(true)
            }}>
              <Folder size={17} />
              {folder}
            </button>
          ))}
        </div>

        <div className="editor-nav-bottom">
          <button type="button" onClick={() => setDataPanelOpen(true)}>
            <Database size={16} />
            Data and results
          </button>
          <button type="button" className="editor-new-material" onClick={resetActiveDraft}>
            <Plus size={17} />
            New material
          </button>
        </div>
      </nav>

      {libraryOpen ? (
        <ContentLibraryPanel
          activityLabel={activity.label}
          items={libraryItems}
          query={libraryQuery}
          onQueryChange={setLibraryQuery}
          onUse={(item) => {
            applyLibraryItem(item)
            setLibraryOpen(false)
          }}
          onClose={() => setLibraryOpen(false)}
        />
      ) : null}

      <main className="editor-panel" aria-label="Level fields">
        <div className="editor-utility-row">
          <details className="editor-settings-panel">
            <summary>
              <SlidersHorizontal size={16} />
              Title and style
            </summary>
            <div className="editor-settings-body">
              <CommonFields draft={activeDraft} onChange={updateActiveDraft} />
              <VisualThemePicker value={selectedTheme} onChange={setSelectedTheme} />
            </div>
          </details>

          <details className="ai-draft-panel">
            <summary className="ai-draft-heading">
              <span className="ai-draft-icon" aria-hidden="true"><Sparkles size={16} /></span>
              <span>
                <strong>Create with AI</strong>
                <small>The content will be filled in according to the description</small>
              </span>
            </summary>
            <div className="ai-draft-body">
              <textarea
                aria-label="Request for AI"
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder={AI_PROMPT_EXAMPLES[activeGame]}
                disabled={aiGenerating}
                rows={4}
              />
              <button
                type="button"
                className="primary-button ai-draft-button"
                disabled={aiGenerating || aiPrompt.trim().length < 10}
                onClick={() => void generateAiDraft()}
              >
                <Sparkles size={16} />
                {aiGenerating ? 'We create...' : 'Create a draft'}
              </button>
              <p role="status">{aiStatus}</p>
            </div>
          </details>
        </div>

        {renderSpecificFields()}
      </main>

      <section className="editor-preview-column" aria-label="Live preview">
        <div className="editor-preview-toolbar">
          <div>
            <strong>Preview</strong>
            <span>Updated immediately after changing fields</span>
          </div>
        </div>

        <div className="editor-theme-frame" data-game-theme={selectedTheme}>
          <PreviewCanvas
            activeGame={activeGame}
            level={themedActiveLevel as EditableLevel}
          previewForce={previewForce}
          previewAngle={previewAngle}
          mistakeSelection={mistakeSelection}
          matchConnections={matchConnections}
          matchAttempts={matchAttempts}
          matchSessionRevision={matchSessionRevision}
          groupPlacements={groupPlacements}
          quizAnswers={quizAnswers}
          quizQuestionIndex={quizQuestionIndex}
          recallRatings={recallRatings}
          recallCardIndex={recallCardIndex}
          recallRevealed={recallRevealed}
          onForceChange={(force, angle) => {
            setPreviewForce(force)
            setPreviewAngle(angle)
          }}
          onMistakeSelect={setMistakeSelection}
          onMatchConnect={(leftIndex, rightIndex) => {
            const matchLevel = activeLevel as MatchPairsLevel
            const transition = transitionMatchPairsAttempt(
              matchLevel,
              { connections: matchConnections, attempts: matchAttempts },
              leftIndex,
              rightIndex,
            )
            setMatchConnections(transition.state.connections)
            setMatchAttempts(transition.state.attempts)
          }}
          onGroupPlace={(itemId, groupId) => {
            setGroupPlacements((value) => [
              ...value.filter((placement) => placement.itemId !== itemId),
              { itemId, groupId },
            ])
          }}
          onQuizSelect={(optionIndex) => {
            setQuizAnswers((value) => {
              const quizLevel = activeLevel as QuizRushLevel
              const next = value.length === quizLevel.questions.length
                ? [...value]
                : createEmptyQuizAnswers(quizLevel)
              next[quizQuestionIndex] = optionIndex
              return next
            })
          }}
          onQuizAdvance={() => {
            const quizLevel = activeLevel as QuizRushLevel
            setQuizQuestionIndex((value) => Math.min(value + 1, quizLevel.questions.length - 1))
          }}
          onRecallReveal={() => setRecallRevealed(true)}
          onRecallRate={(rating) => {
            const recallLevel = activeLevel as RecallDeckLevel
            setRecallRatings((value) => {
              const next = value.length === recallLevel.cards.length
                ? [...value]
                : createEmptyRecallRatings(recallLevel)
              next[recallCardIndex] = rating
              return next
            })
            if (recallCardIndex < recallLevel.cards.length - 1) {
              setRecallCardIndex((value) => value + 1)
              setRecallRevealed(false)
            }
          }}
          />
        </div>
      </section>

      {dataPanelOpen ? (
      <aside className="editor-data-panel is-open" aria-label="Lesson data">
        <button type="button" className="editor-drawer-close" aria-label="Close data and results" onClick={() => setDataPanelOpen(false)}>
          <X size={18} />
        </button>
        <div className="panel-heading compact">
          <Database size={20} />
          <div>
            <span>data</span>
            <h2>Level JSON</h2>
          </div>
        </div>

        <div className={validationErrors.length === 0 ? 'editor-validation ok' : 'editor-validation'}>
          {validationErrors.length === 0 ? (
            <>
              <Check size={17} />
              <span>Level contract is valid</span>
            </>
          ) : (
            <>
              <AlertTriangle size={17} />
              <span>{validationErrors[0]}</span>
            </>
          )}
        </div>

        {activeGame === 'force-lab' && (
          <ForcePreviewControls
            level={activeLevel as ForceLabLevel}
            force={previewForce}
            angle={previewAngle}
            onForceChange={setPreviewForce}
            onAngleChange={setPreviewAngle}
          />
        )}

        <div className="json-box">
          <div>
            <FileJson size={16} />
            <span>payload</span>
          </div>
          <pre>{activeJson}</pre>
        </div>

        <section className="attempt-list" aria-label="Student results">
          <div className="attempt-list-heading">
            <div>
              <Trophy size={17} />
              <strong>Results</strong>
            </div>
            <button type="button" aria-label="Update results" onClick={() => void refreshAttempts()}>
              <RefreshCw size={15} />
            </button>
          </div>
          <p role="status">{attemptsStatus}</p>
          {attempts.slice(0, 10).map((attempt) => (
            <article className="attempt-row" key={attempt.id}>
              <div>
                <strong>{attempt.studentName}</strong>
                <span>{attempt.activityTitle}</span>
              </div>
              <div>
                <strong>{attempt.accuracy}%</strong>
                <span>{attempt.durationSeconds} sec · {formatAttemptDate(attempt.completedAt)}</span>
              </div>
            </article>
          ))}
        </section>

        <div className="saved-list">
          <div role="status">
            <Eye size={16} />
            <span>{saveStatus}</span>
          </div>
          {savedActivities.length === 0 ? (
            <p>There are no published levels yet.</p>
          ) : (
            savedActivities.map((item) => (
              <article className="saved-row" key={item.id}>
                <button type="button" onClick={() => onTestLevel(item.gameId, item.level)}>
                  <strong>{item.title}</strong>
                  <small>{getActivityDefinition(item.gameId).label}</small>
                </button>
                <div className="saved-actions">
                  <Link href={`/play/${item.id}`}>
                    <ExternalLink size={14} />
                    To the student
                  </Link>
                  <button type="button" onClick={() => void deleteSavedActivity(item.id)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
      ) : null}
    </section>
  )
}

function ContentLibraryPanel({
  activityLabel,
  items,
  query,
  onQueryChange,
  onUse,
  onClose,
}: {
  activityLabel: string
  items: ContentLibraryItem[]
  query: string
  onQueryChange: (value: string) => void
  onUse: (item: ContentLibraryItem) => void
  onClose: () => void
}) {
  const pageSize = 24
  const [pagination, setPagination] = useState({ activityLabel, query, visibleCount: pageSize })
  const visibleCount = pagination.activityLabel === activityLabel && pagination.query === query
    ? pagination.visibleCount
    : pageSize
  const visibleItems = items.slice(0, visibleCount)

  return (
    <section className="content-library-panel" aria-label="Library of ready-made tasks">
      <header className="content-library-heading">
        <div>
          <span className="content-library-icon" aria-hidden="true"><LibraryBig size={19} /></span>
          <div>
            <strong>Ready-made activities</strong>
            <span>Select the basis for the template &quot;{activityLabel}&quot;and customize it for the student</span>
          </div>
        </div>
        <label className="content-library-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="For example: geometry, B1, formulas"
            aria-label="Search by ready-made tasks"
          />
          <span>{items.length}</span>
        </label>
        <button type="button" className="content-library-close" aria-label="Close library" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      {items.length > 0 ? (
        <>
          <div className="content-library-grid">
            {visibleItems.map((item) => (
              <article className="content-library-card" key={item.id}>
                <div className={item.preview ? 'library-card-preview has-diagram' : 'library-card-preview'}>
                  {item.preview ? (
                    <GeometryDiagram spec={item.preview} compact />
                  ) : (
                    <span>{item.subject.slice(0, 2).toLocaleUpperCase('ru')}</span>
                  )}
                </div>
                <div className="library-card-copy">
                  <div className="library-card-meta">
                    <span>{item.subject}</span>
                    <span>{item.grade}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <button type="button" onClick={() => onUse(item)}>Use</button>
              </article>
            ))}
          </div>
          {visibleItems.length < items.length ? (
            <div className="content-library-more-row">
              <span>Shown {visibleItems.length} from {items.length}</span>
              <button
                type="button"
                onClick={() => setPagination({ activityLabel, query, visibleCount: visibleCount + pageSize })}
              >
                Show more {Math.min(pageSize, items.length - visibleItems.length)}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="content-library-empty">
          <Search size={20} />
          <div>
            <strong>Nothing found in this template</strong>
            <span>Try a subject, class, or topic shorter.</span>
          </div>
        </div>
      )}
    </section>
  )
}

function VisualThemePicker({
  value,
  onChange,
}: {
  value: VisualThemeId
  onChange: (value: VisualThemeId) => void
}) {
  return (
    <section className="theme-picker" aria-label="Game Scene Style">
      <div className="theme-picker-heading">
        <Palette size={17} />
        <div>
          <strong>Game world</strong>
          <span>Changes background, light, cards and atmosphere</span>
        </div>
      </div>
      <div className="theme-picker-list">
        {visualThemes.map((theme) => (
          <button
            type="button"
            key={theme.id}
            className={value === theme.id ? 'theme-choice is-active' : 'theme-choice'}
            data-theme-swatch={theme.id}
            aria-pressed={value === theme.id}
            title={theme.description}
            onClick={() => onChange(theme.id)}
          >
            <span aria-hidden="true"><i /></span>
            <strong>{theme.label}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}

function formatAttemptDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'now'

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function CommonFields({
  draft,
  onChange,
}: {
  draft: CommonEditorDraft
  onChange: (patch: Partial<CommonEditorDraft>) => void
}) {
  return (
    <div className="editor-fields">
      <label>
        <span>Title</span>
        <input value={draft.title} onChange={(event) => onChange({ title: event.target.value })} />
      </label>
      <div className="field-grid">
        <label>
          <span>Subject</span>
          <input
            list="editor-subject-options"
            value={draft.subject}
            onChange={(event) => onChange({ subject: event.target.value })}
          />
          <datalist id="editor-subject-options">
            {subjectOptions.map((subject) => (
              <option key={subject.id} value={subject.label} />
            ))}
          </datalist>
        </label>
        <label>
          <span>Class</span>
          <input value={draft.grade} onChange={(event) => onChange({ grade: event.target.value })} />
        </label>
      </div>
      <label>
        <span>Methodology</span>
        <textarea value={draft.teacherNote} onChange={(event) => onChange({ teacherNote: event.target.value })} rows={3} />
      </label>
    </div>
  )
}

function ForceFields({
  draft,
  onChange,
}: {
  draft: ForceEditorDraft
  onChange: (patch: Partial<ForceEditorDraft>) => void
}) {
  return (
    <div className="editor-fields">
      <label>
        <span>Quest</span>
        <textarea value={draft.lesson} onChange={(event) => onChange({ lesson: event.target.value })} rows={3} />
      </label>
      <div className="field-grid">
        <label>
          <span>Equation</span>
          <input value={draft.equation} onChange={(event) => onChange({ equation: event.target.value })} />
        </label>
        <label>
          <span>Answer</span>
          <input value={draft.answer} onChange={(event) => onChange({ answer: event.target.value })} />
        </label>
      </div>
      <div className="field-grid compact">
        <label>
          <span>F2</span>
          <input value={draft.targetForce} onChange={(event) => onChange({ targetForce: event.target.value })} />
        </label>
        <label>
          <span>Angle</span>
          <input value={draft.targetAngle} onChange={(event) => onChange({ targetAngle: event.target.value })} />
        </label>
        <label>
          <span>Weight</span>
          <input value={draft.mass} onChange={(event) => onChange({ mass: event.target.value })} />
        </label>
        <label>
          <span>Friction</span>
          <input value={draft.friction} onChange={(event) => onChange({ friction: event.target.value })} />
        </label>
      </div>
    </div>
  )
}

function MistakeFields({
  draft,
  onChange,
}: {
  draft: MistakeEditorDraft
  onChange: (patch: Partial<MistakeEditorDraft>) => void
}) {
  return (
    <div className="editor-fields">
      <label>
        <span>Instructions</span>
        <textarea value={draft.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} />
      </label>
      <label>
        <span>Recording with spaces</span>
        <textarea value={draft.tokensText} onChange={(event) => onChange({ tokensText: event.target.value })} rows={3} />
      </label>
      <div className="field-grid">
        <label>
          <span>Error number</span>
          <input value={draft.correctIndex} onChange={(event) => onChange({ correctIndex: event.target.value })} />
        </label>
        <label>
          <span>Replacement</span>
          <input value={draft.correctToken} onChange={(event) => onChange({ correctToken: event.target.value })} />
        </label>
      </div>
      <label>
        <span>Rule</span>
        <textarea value={draft.rule} onChange={(event) => onChange({ rule: event.target.value })} rows={2} />
      </label>
      <label>
        <span>Explanation</span>
        <textarea value={draft.explanation} onChange={(event) => onChange({ explanation: event.target.value })} rows={3} />
      </label>
    </div>
  )
}

function MatchFields({
  draft,
  onChange,
}: {
  draft: MatchEditorDraft
  onChange: (patch: Partial<MatchEditorDraft>) => void
}) {
  const rows = readMatchEditorRows(draft.pairsText)
  const mediaRows = rows.map((_, index) => ({ ...draft.pairMedia?.[index] }))
  const visualRows = rows.map((_, index) => draft.pairVisuals?.[index] ?? null)

  const commitRows = (
    nextRows: Array<{ left: string; right: string }>,
    nextMedia = mediaRows,
    nextVisuals = visualRows,
  ) => {
    onChange({
      pairsText: writeMatchEditorRows(nextRows),
      pairMedia: nextMedia,
      pairVisuals: nextVisuals,
    })
  }

  const updateRow = (index: number, side: 'left' | 'right', value: string) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? { ...row, [side]: value } : row)
    onChange({ pairsText: writeMatchEditorRows(next) })
  }

  const updateMedia = (index: number, side: 'left' | 'right', value: LearningImage | undefined) => {
    const next = mediaRows.map((media) => ({ ...media }))
    if (value) next[index][side] = value
    else delete next[index][side]
    onChange({ pairMedia: next })
  }

  const removePair = (index: number) => {
    if (rows.length <= 2) return
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
    const nextMedia = mediaRows.filter((_, rowIndex) => rowIndex !== index)
    const nextVisuals = visualRows.filter((_, rowIndex) => rowIndex !== index)
    commitRows(nextRows, nextMedia, nextVisuals)
  }

  const removeLibraryVisual = (index: number) => {
    const next = [...visualRows]
    next[index] = null
    onChange({ pairVisuals: next })
  }

  const addPair = () => {
    if (rows.length >= 8) return
    commitRows(
      [...rows, { left: '', right: '' }],
      [...mediaRows, {}],
      [...visualRows, null],
    )
  }

  const movePair = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= rows.length) return
    commitRows(
      moveEditorItem(rows, index, target),
      moveEditorItem(mediaRows, index, target),
      moveEditorItem(visualRows, index, target),
    )
  }

  const duplicatePair = (index: number) => {
    if (rows.length >= 8) return
    const target = index + 1
    const nextRows = [...rows]
    const nextMedia = [...mediaRows]
    const nextVisuals = [...visualRows]
    nextRows.splice(target, 0, { ...rows[index] })
    nextMedia.splice(target, 0, { ...mediaRows[index] })
    nextVisuals.splice(target, 0, visualRows[index])
    commitRows(nextRows, nextMedia, nextVisuals)
  }

  return (
    <div className="editor-fields match-pair-editor">
      <label className="match-pair-instruction">
        <span>Instructions</span>
        <textarea value={draft.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} />
      </label>

      <div className="match-pair-editor-heading">
        <div>
          <strong>Content</strong>
          <span>Text and image can be used together or separately.</span>
        </div>
        <small>{rows.length} of 8 pairs</small>
      </div>

      <div className="match-pair-column-headings" aria-hidden="true">
        <strong>Left side</strong>
        <span />
        <strong>Right side</strong>
      </div>

      <div className="match-pair-editor-rows">
        {rows.map((row, index) => (
          <article className="match-pair-editor-row" key={`editor-pair-${index + 1}`}>
            <header>
              <strong aria-label={`Couple ${index + 1}`}>{index + 1}</strong>
              <div className="match-pair-row-actions">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => movePair(index, -1)}
                  aria-label={`Raise a couple ${index + 1}`}
                  title="Raise"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  disabled={index === rows.length - 1}
                  onClick={() => movePair(index, 1)}
                  aria-label={`Drop a couple ${index + 1}`}
                  title="Lower"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  disabled={rows.length >= 8}
                  onClick={() => duplicatePair(index)}
                  aria-label={`Duplicate pair ${index + 1}`}
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  className="match-pair-remove"
                  disabled={rows.length <= 2}
                  onClick={() => removePair(index)}
                  aria-label={`Remove pair ${index + 1}`}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </header>

            <div className="match-pair-content-grid">
              <section className={draft.pairVisuals?.[index] && !draft.pairMedia?.[index]?.left ? 'match-pair-content-cell has-library-visual' : 'match-pair-content-cell'}>
                <label>
                  <input
                    value={row.left}
                    aria-label={`Left side text of the pair ${index + 1}`}
                    placeholder="Enter text"
                    onChange={(event) => updateRow(index, 'left', event.target.value)}
                  />
                </label>
                {draft.pairVisuals?.[index] && !draft.pairMedia?.[index]?.left ? (
                  <div className="match-pair-library-visual">
                    <GeometryDiagram spec={draft.pairVisuals[index]!} compact decorative />
                    <button type="button" onClick={() => removeLibraryVisual(index)}>
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                ) : null}
                <LearningImageField
                  value={draft.pairMedia?.[index]?.left}
                  label={`Image of the left side of the couple ${index + 1}`}
                  fallbackAlt={row.left || `Left side of the pair ${index + 1}`}
                  compact
                  emptyLabel={draft.pairVisuals?.[index] ? 'Replace' : 'Add an image'}
                  hideEmptyPreview={Boolean(draft.pairVisuals?.[index])}
                  onChange={(value) => updateMedia(index, 'left', value)}
                />
              </section>

              <span className="match-pair-link" aria-hidden="true">↔</span>

              <section className="match-pair-content-cell">
                <label>
                  <input
                    value={row.right}
                    aria-label={`Right side pair text ${index + 1}`}
                    placeholder="Enter text"
                    onChange={(event) => updateRow(index, 'right', event.target.value)}
                  />
                </label>
                <LearningImageField
                  value={draft.pairMedia?.[index]?.right}
                  label={`Picture of the right side of the couple ${index + 1}`}
                  fallbackAlt={row.right || `Right side of the pair ${index + 1}`}
                  compact
                  onChange={(value) => updateMedia(index, 'right', value)}
                />
              </section>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="match-pair-add" disabled={rows.length >= 8} onClick={addPair}>
        <Plus size={16} />
        Add a pair
      </button>
    </div>
  )
}

function readMatchEditorRows(value: string) {
  const rows = value
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const separatorIndex = line.indexOf('|')
      if (separatorIndex === -1) return { left: line.trim(), right: '' }
      return {
        left: line.slice(0, separatorIndex).trim(),
        right: line.slice(separatorIndex + 1).trim(),
      }
    })

  return rows.length > 0 ? rows.slice(0, 8) : [{ left: '', right: '' }, { left: '', right: '' }]
}

function writeMatchEditorRows(rows: Array<{ left: string; right: string }>) {
  return rows.map((row) => `${row.left.trim()} | ${row.right.trim()}`).join('\n')
}

function moveEditorItem<T>(items: T[], from: number, to: number) {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function GroupFields({
  draft,
  onChange,
}: {
  draft: GroupEditorDraft
  onChange: (patch: Partial<GroupEditorDraft>) => void
}) {
  const groups = readEditorLines(draft.groupsText).slice(0, 3)
  const rows = readGroupEditorRows(draft.itemsText)

  const updateGroups = (groupsText: string) => {
    const nextGroups = readEditorLines(groupsText).slice(0, 3)
    const nextRows = rows.map((row) => {
      const previousIndex = groups.indexOf(row.group)
      if (previousIndex >= 0 && nextGroups[previousIndex]) return { ...row, group: nextGroups[previousIndex] }
      if (nextGroups.includes(row.group)) return row
      return { ...row, group: nextGroups[0] ?? row.group }
    })
    onChange({ groupsText, itemsText: writeGroupEditorRows(nextRows) })
  }

  const updateRow = (index: number, patch: Partial<{ label: string; group: string }>) => {
    const next = rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row)
    onChange({ itemsText: writeGroupEditorRows(next) })
  }

  const updateMedia = (index: number, value: LearningImage | undefined) => {
    const next = rows.map((_, rowIndex) => draft.itemMedia?.[rowIndex] ?? null)
    next[index] = value ?? null
    onChange({ itemMedia: next })
  }

  const removeItem = (index: number) => {
    if (rows.length <= 2) return
    onChange({
      itemsText: writeGroupEditorRows(rows.filter((_, rowIndex) => rowIndex !== index)),
      itemMedia: (draft.itemMedia ?? []).filter((_, rowIndex) => rowIndex !== index),
    })
  }

  const addItem = () => {
    if (rows.length >= 6) return
    onChange({ itemsText: writeGroupEditorRows([...rows, { label: '', group: groups[0] ?? '' }]) })
  }

  return (
    <div className="editor-fields media-aware-editor">
      <label>
        <span>Instructions</span>
        <textarea value={draft.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} />
      </label>
      <label>
        <span>Groups, one line at a time</span>
        <textarea value={draft.groupsText} onChange={(event) => updateGroups(event.target.value)} rows={4} />
      </label>

      <div className="media-editor-heading">
        <div>
          <strong>Cards for sorting</strong>
          <span>The text can be supplemented with a photograph, diagram, graph or map.</span>
        </div>
        <small>{rows.length} out of 6</small>
      </div>

      <div className="group-item-editor-list">
        {rows.map((row, index) => (
          <article className="group-item-editor-row" key={`group-item-${index + 1}`}>
            <header>
              <strong>Card {index + 1}</strong>
              <button
                type="button"
                className="match-pair-remove"
                disabled={rows.length <= 2}
                onClick={() => removeItem(index)}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </header>
            <div className="group-item-editor-content">
              <div className="group-item-copy-fields">
                <label>
                  <span>Card text</span>
                  <input
                    value={row.label}
                    placeholder="For example: dolphin"
                    onChange={(event) => updateRow(index, { label: event.target.value })}
                  />
                </label>
                <label>
                  <span>The right group</span>
                  <select value={row.group} onChange={(event) => updateRow(index, { group: event.target.value })}>
                    {groups.map((group) => <option value={group} key={group}>{group}</option>)}
                  </select>
                </label>
              </div>
              <LearningImageField
                value={draft.itemMedia?.[index] ?? undefined}
                label={`Card image ${index + 1}`}
                fallbackAlt={row.label || `Sorting card ${index + 1}`}
                onChange={(value) => updateMedia(index, value)}
              />
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="match-pair-add" disabled={rows.length >= 6} onClick={addItem}>
        <Plus size={16} />
        Add a card
      </button>
    </div>
  )
}

function QuizFields({
  draft,
  onChange,
}: {
  draft: QuizEditorDraft
  onChange: (patch: Partial<QuizEditorDraft>) => void
}) {
  const rows = readQuizEditorRows(draft.questionsText)

  const updateQuestionMedia = (questionIndex: number, value: LearningImage | undefined) => {
    const next = rows.map((_, index) => draft.questionMedia?.[index] ?? null)
    next[questionIndex] = value ?? null
    onChange({ questionMedia: next })
  }

  const updateOptionMedia = (questionIndex: number, optionIndex: number, value: LearningImage | undefined) => {
    const next = rows.map((row, rowIndex) => {
      return row.options.map((_, rowOptionIndex) => draft.optionMedia?.[rowIndex]?.[rowOptionIndex] ?? null)
    })
    next[questionIndex][optionIndex] = value ?? null
    onChange({ optionMedia: next })
  }

  return (
    <div className="editor-fields media-aware-editor">
      <label>
        <span>Instructions</span>
        <textarea value={draft.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} />
      </label>
      <label>
        <span>Question | options via ; | answer number | explanation</span>
        <textarea
          value={draft.questionsText}
          onChange={(event) => onChange({ questionsText: event.target.value })}
          rows={10}
        />
      </label>

      <div className="media-editor-heading">
        <div>
          <strong>Images of questions and answers</strong>
          <span>Add diagrams, maps, graphs and photos directly to the question you need.</span>
        </div>
        <small>{rows.length} questions</small>
      </div>

      <div className="quiz-media-editor-list">
        {rows.map((row, questionIndex) => (
          <article className="quiz-media-editor-row" key={`quiz-media-${questionIndex + 1}`}>
            <header>
              <span>Question {questionIndex + 1}</span>
              <strong>{row.prompt || 'No text'}</strong>
            </header>
            <LearningImageField
              value={draft.questionMedia?.[questionIndex] ?? undefined}
              label={`Question image ${questionIndex + 1}`}
              fallbackAlt={row.prompt || `Illustration for the question ${questionIndex + 1}`}
              onChange={(value) => updateQuestionMedia(questionIndex, value)}
            />
            <div className="quiz-option-media-grid">
              {row.options.map((option, optionIndex) => (
                <section key={`${questionIndex}-${optionIndex}`}>
                  <strong>{String.fromCharCode(65 + optionIndex)} · {option || 'Answer without text'}</strong>
                  <LearningImageField
                    value={draft.optionMedia?.[questionIndex]?.[optionIndex] ?? undefined}
                    label={`Reply image ${String.fromCharCode(65 + optionIndex)} in question ${questionIndex + 1}`}
                    fallbackAlt={option || `Answer option ${String.fromCharCode(65 + optionIndex)}`}
                    onChange={(value) => updateOptionMedia(questionIndex, optionIndex, value)}
                  />
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function readEditorLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

function readGroupEditorRows(value: string) {
  const rows = readEditorLines(value).map((line) => {
    const separatorIndex = line.indexOf('|')
    if (separatorIndex === -1) return { label: line, group: '' }
    return {
      label: line.slice(0, separatorIndex).trim(),
      group: line.slice(separatorIndex + 1).trim(),
    }
  })

  return rows.length > 0 ? rows.slice(0, 6) : [{ label: '', group: '' }, { label: '', group: '' }]
}

function writeGroupEditorRows(rows: Array<{ label: string; group: string }>) {
  return rows.map((row) => `${row.label.trim()} | ${row.group.trim()}`).join('\n')
}

function readQuizEditorRows(value: string) {
  return readEditorLines(value).slice(0, 6).map((line) => {
    const [prompt = '', optionsText = ''] = line.split('|').map((part) => part.trim())
    return {
      prompt,
      options: optionsText.split(';').map((option) => option.trim()).filter(Boolean).slice(0, 4),
    }
  })
}

function RecallFields({
  draft,
  onChange,
}: {
  draft: RecallEditorDraft
  onChange: (patch: Partial<RecallEditorDraft>) => void
}) {
  const rows = readEditorLines(draft.cardsText).slice(0, 8).map((line) => {
    const [front = '', back = ''] = line.split('|').map((part) => part.trim())
    return { front, back }
  })

  const updateFrontMedia = (index: number, value: LearningImage | undefined) => {
    const next = rows.map((_, rowIndex) => draft.frontMedia?.[rowIndex] ?? null)
    next[index] = value ?? null
    onChange({ frontMedia: next })
  }

  const updateBackMedia = (index: number, value: LearningImage | undefined) => {
    const next = rows.map((_, rowIndex) => draft.backMedia?.[rowIndex] ?? null)
    next[index] = value ?? null
    onChange({ backMedia: next })
  }

  return (
    <div className="editor-fields media-aware-editor">
      <label>
        <span>Instructions</span>
        <textarea value={draft.prompt} onChange={(event) => onChange({ prompt: event.target.value })} rows={2} />
      </label>
      <label>
        <span>Front side | reverse side | example</span>
        <textarea
          value={draft.cardsText}
          onChange={(event) => onChange({ cardsText: event.target.value })}
          rows={10}
        />
      </label>
      <div className="media-editor-heading">
        <div>
          <strong>Card images</strong>
          <span>Add diagrams, maps, photos and graphics to any side.</span>
        </div>
        <small>{rows.length} cards</small>
      </div>
      <div className="quiz-media-editor-list recall-media-editor-list">
        {rows.map((row, index) => (
          <article className="quiz-media-editor-row" key={`recall-media-${index + 1}`}>
            <header>
              <span>Card {index + 1}</span>
              <strong>{row.front || 'No text'}</strong>
            </header>
            <div className="quiz-option-media-grid recall-media-grid">
              <section>
                <strong>Front side</strong>
                <LearningImageField
                  value={draft.frontMedia?.[index] ?? undefined}
                  label={`Card front image ${index + 1}`}
                  fallbackAlt={row.front || `Front side of the card ${index + 1}`}
                  onChange={(value) => updateFrontMedia(index, value)}
                />
              </section>
              <section>
                <strong>Reverse side</strong>
                <LearningImageField
                  value={draft.backMedia?.[index] ?? undefined}
                  label={`Image of the back of the card ${index + 1}`}
                  fallbackAlt={row.back || `Reverse side of the card ${index + 1}`}
                  onChange={(value) => updateBackMedia(index, value)}
                />
              </section>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function PreviewCanvas({
  activeGame,
  level,
  previewForce,
  previewAngle,
  mistakeSelection,
  matchConnections,
  matchAttempts,
  matchSessionRevision,
  groupPlacements,
  quizAnswers,
  quizQuestionIndex,
  recallRatings,
  recallCardIndex,
  recallRevealed,
  onForceChange,
  onMistakeSelect,
  onMatchConnect,
  onGroupPlace,
  onQuizSelect,
  onQuizAdvance,
  onRecallReveal,
  onRecallRate,
}: {
  activeGame: GameId
  level: ReturnType<typeof buildEditableLevel>
  previewForce: number
  previewAngle: number
  mistakeSelection: number | null
  matchConnections: MatchConnection[]
  matchAttempts: number
  matchSessionRevision: number
  groupPlacements: GroupPlacement[]
  quizAnswers: Array<number | null>
  quizQuestionIndex: number
  recallRatings: Array<RecallRating | null>
  recallCardIndex: number
  recallRevealed: boolean
  onForceChange: (force: number, angle: number) => void
  onMistakeSelect: (index: number) => void
  onMatchConnect: (leftIndex: number, rightIndex: number) => void
  onGroupPlace: (itemId: string, groupId: string) => void
  onQuizSelect: (optionIndex: number) => void
  onQuizAdvance: () => void
  onRecallReveal: () => void
  onRecallRate: (rating: RecallRating) => void
}) {
  if (activeGame === 'force-lab') {
    const forceLevel = level as ForceLabLevel
    const result = getBalanceResult(forceLevel, { force: previewForce, angle: previewAngle }, forceLevel.answer)

    return (
      <section className="playfield editor-playfield" aria-label="Preview of Forces Lab">
        <PreviewHud status={result.gateOpen ? 'the gate is open' : `${result.efficiency}% accuracy`} />
        <ForceLabCanvas
          level={forceLevel}
          force={previewForce}
          angle={previewAngle}
          result={result}
          running
          onVectorChange={onForceChange}
        />
        <div className="feedback-bar success">
          <span>The preview uses the same interactive DOM/SVG scene as the game version.</span>
        </div>
      </section>
    )
  }

  if (activeGame === 'mistake-arena') {
    const mistakeLevel = level as MistakeArenaLevel
    const result = getMistakeArenaResult(mistakeLevel, mistakeSelection)

    return (
      <section className="playfield editor-playfield" aria-label="Preview of error search">
        <PreviewHud status={result.status} />
        <MistakeArenaCanvas
          level={mistakeLevel}
          result={result}
          selectedIndex={mistakeSelection}
          running
          onSelect={onMistakeSelect}
        />
        <div className={result.correct ? 'feedback-bar success' : 'feedback-bar'}>
          <span>{result.correct ? mistakeLevel.explanation : 'Click on the token right inside the preview.'}</span>
        </div>
      </section>
    )
  }

  if (activeGame === 'match-pairs') {
    const matchLevel = level as MatchPairsLevel
    const result = getMatchPairsResult(matchLevel, matchConnections, matchAttempts)

    return (
      <section className="playfield editor-playfield" aria-label="Preview couples">
        <MatchPairsCanvas
          level={matchLevel}
          connections={matchConnections}
          result={result}
          running
          mode="preview"
          muted
          sessionRevision={matchSessionRevision}
          onConnect={onMatchConnect}
        />
      </section>
    )
  }

  if (activeGame === 'group-sort') {
    const groupLevel = level as GroupSortLevel
    const result = getGroupSortResult(groupLevel, groupPlacements)

    return (
      <section className="playfield editor-playfield" aria-label="Preview groups">
        <PreviewHud status={result.status} />
        <GroupSortCanvas
          level={groupLevel}
          placements={groupPlacements}
          result={result}
          running
          onPlace={onGroupPlace}
        />
        <div className={result.complete ? 'feedback-bar success' : 'feedback-bar'}>
          <span>Drag cards into zones to check the classification.</span>
        </div>
      </section>
    )
  }

  if (activeGame === 'quiz-rush') {
    const quizLevel = level as QuizRushLevel
    const safeAnswers = quizAnswers.length === quizLevel.questions.length
      ? quizAnswers
      : createEmptyQuizAnswers(quizLevel)
    const result = getQuizRushResult(quizLevel, safeAnswers)

    return (
      <section className="playfield editor-playfield" aria-label="Blitz quiz preview">
        <PreviewHud status={result.status} />
        <QuizRushStage
          level={quizLevel}
          answers={safeAnswers}
          questionIndex={quizQuestionIndex}
          running
          onSelect={onQuizSelect}
          onAdvance={onQuizAdvance}
        />
        <div className={result.complete ? 'feedback-bar success' : 'feedback-bar'}>
          <span>Select an answer. After each choice, the student receives a short explanation.</span>
        </div>
      </section>
    )
  }

  const recallLevel = level as RecallDeckLevel
  const safeRatings = recallRatings.length === recallLevel.cards.length
    ? recallRatings
    : createEmptyRecallRatings(recallLevel)
  const result = getRecallDeckResult(recallLevel, safeRatings)

  return (
    <section className="playfield editor-playfield" aria-label="Memory Deck Preview">
      <PreviewHud status={result.status} />
      <RecallDeckStage
        level={recallLevel}
        ratings={safeRatings}
        cardIndex={recallCardIndex}
        revealed={recallRevealed}
        running
        onReveal={onRecallReveal}
        onRate={onRecallRate}
      />
      <div className={result.complete ? 'feedback-bar success' : 'feedback-bar'}>
        <span>Open the answer and honestly evaluate whether you managed to remember it.</span>
      </div>
    </section>
  )
}

function PreviewHud({ status }: { status: string }) {
  return (
    <div className="hud">
      <div className="hud-item">
        <Eye size={16} />
        <span>preview</span>
      </div>
      <div className="hud-item">
        <Check size={16} />
        <span>{status}</span>
      </div>
    </div>
  )
}

function ForcePreviewControls({
  level,
  force,
  angle,
  onForceChange,
  onAngleChange,
}: {
  level: ForceLabLevel
  force: number
  angle: number
  onForceChange: (force: number) => void
  onAngleChange: (angle: number) => void
}) {
  return (
    <div className="preview-tuning">
      <label className="range-row">
        <span>Preview strength: {force} N</span>
        <input type="range" min="1" max="18" value={force} onChange={(event) => onForceChange(Number(event.target.value))} />
      </label>
      <label className="range-row">
        <span>Preview angle: {angle}°</span>
        <input type="range" min="0" max="55" value={angle} onChange={(event) => onAngleChange(Number(event.target.value))} />
      </label>
      <button
        type="button"
        className="snap-button"
        onClick={() => {
          onForceChange(level.targetForce)
          onAngleChange(level.targetAngle)
        }}
      >
        <Check size={16} />
        Set a goal
      </button>
    </div>
  )
}
