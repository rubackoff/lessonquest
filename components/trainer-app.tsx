"use client";

import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Delete,
  Flame,
  GraduationCap,
  HelpCircle,
  PawPrint,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CorgiMascot } from "./corgi-mascot";
import { MatchPairsSoundKit } from "./games/match-pairs/match-pairs-sound";
import { editTrainerInput, getTrainerAnswerStatus } from "@/lib/trainer-input";
import {
  durationOptions,
  grades,
  Question,
  QuestionVisual as QuestionVisualModel,
  questionTimeOptions,
  Subject,
  subjects,
  tableRangeOptions,
  Trainer,
  TrainerSettings,
  trainers,
} from "@/lib/trainers";

type AnswerEvent = {
  id: number;
  prompt: string;
  answer: string;
  ok: boolean;
};

const initialQuestion: Question = {
  prompt: "6 × 7 =",
  answer: "42",
  explanation: "6 × 7 = 42",
  story: "There are 6 rows of 7 cards on the shelf. How many cards are there in total?",
  hint: "Multiplication counts equal groups.",
  tag: "6 × table",
  visual: {
    kind: "groups",
    title: "Rows of cards",
    columns: 7,
    tokens: 42,
    token: "●",
    values: [
      { label: "rows", value: "6" },
      { label: "in a row", value: "7" },
    ],
  },
};

const readRecord = (trainerId: string) => {
  try {
    const value = Number(window.localStorage.getItem(`record:${trainerId}`));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const formatTime = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
};

export function TrainerApp() {
  const [subject, setSubject] = useState<Subject | "all">("math");
  const [grade, setGrade] = useState("Grade 2");
  const [selectedId, setSelectedId] = useState("multiplication-table");
  const [duration, setDuration] = useState(600);
  const [questionTime, setQuestionTime] = useState(8);
  const [allowNegative, setAllowNegative] = useState(false);
  const [multiplicationOnly, setMultiplicationOnly] = useState(true);
  const [tableMax, setTableMax] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"subject" | "grade" | null>(null);
  const [question, setQuestion] = useState<Question>(initialQuestion);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [coins, setCoins] = useState(0);
  const [mistakes, setMistakes] = useState<AnswerEvent[]>([]);
  const [history, setHistory] = useState<AnswerEvent[]>([]);
  const [sessionLeft, setSessionLeft] = useState(duration);
  const [questionLeft, setQuestionLeft] = useState(questionTime);
  const running = sessionLeft > 0;
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [record, setRecord] = useState(0);
  const advanceTimerRef = useRef<number | null>(null);
  const eventIdRef = useRef(0);
  const didHydrateRef = useRef(false);
  const inputRef = useRef("");
  const acceptingAnswerRef = useRef(true);
  const activeTrainerRef = useRef(selectedId);
  const questionSettingsRef = useRef<TrainerSettings | null>(null);
  const selectorsRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<MatchPairsSoundKit | null>(null);

  const selectedTrainer = useMemo(
    () => trainers.find((trainer) => trainer.id === selectedId) ?? trainers[0],
    [selectedId],
  );

  const filteredTrainers = useMemo(
    () =>
      trainers.filter(
        (trainer) =>
          (subject === "all" || trainer.subject === subject) &&
          (grade === "All" || trainer.grade === grade),
      ),
    [grade, subject],
  );
  const subjectTrainers = useMemo(
    () => trainers.filter((trainer) => subject === "all" || trainer.subject === subject),
    [subject],
  );

  const trainerSettings = useMemo(
    () => ({
      allowNegative,
      multiplicationOnly,
      tableMax,
      tableMin: 2,
    }),
    [allowNegative, multiplicationOnly, tableMax],
  );

  const keypadRows = useMemo(() => {
    const specialKey = selectedTrainer.inputType === "fraction" ? "/" : "+";

    return [
      ["1", "2", "3", "backspace"],
      ["4", "5", "6", "-"],
      ["7", "8", "9", specialKey],
    ];
  }, [selectedTrainer.inputType]);

  const isChoiceTrainer = selectedTrainer.inputType === "choice";

  const multiplier = Math.min(5, 1 + Math.floor(streak / 5));
  const bestScore = Math.max(record, score);
  const sessionProgress = duration > 0 ? (sessionLeft / duration) * 100 : 0;
  const questionProgress =
    questionTime > 0 ? Math.max(0, (questionLeft / questionTime) * 100) : 100;
  const promptExpression = question.prompt.replace(/\s*=$/, "").trim();
  const answerValue = input || "?";
  const tableTag = question.tag ?? selectedTrainer.category;
  const subjectLabel = subjects.find((item) => item.id === subject)?.label ?? "Mathematics";
  const feedbackMessage =
    feedback === "correct"
      ? "That's right. Answer accepted."
      : feedback === "wrong"
        ? `Correct answer: ${question.answer}${question.unit ? ` ${question.unit}` : ""}`
        : isChoiceTrainer
          ? "Choose one answer."
          : "Enter your answer using the keyboard.";

  const makeNextQuestion = useCallback(() => {
    setQuestion(selectedTrainer.makeQuestion(trainerSettings));
    inputRef.current = "";
    setInput("");
    setQuestionLeft(questionTime);
    acceptingAnswerRef.current = true;
  }, [questionTime, selectedTrainer, trainerSettings]);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const markCorrect = useCallback(() => {
    if (!running || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) return;
    acceptingAnswerRef.current = false;
    eventIdRef.current += 1;
    const event = { id: eventIdRef.current, prompt: question.prompt, answer: question.answer, ok: true };
    const gained = 2 * multiplier;

    setScore((value) => value + gained);
    setCoins((value) => value + 1);
    setRecord((value) => Math.max(value, score + gained));
    setCorrect((value) => value + 1);
    setStreak((value) => value + 1);
    setHistory((items) => [event, ...items].slice(0, 6));
    setFeedback("correct");
    soundRef.current?.play("correct");
  }, [multiplier, question, running, score, selectedTrainer.id]);

  const markWrong = useCallback(
    (eventInput: string) => {
      if (!running || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) return;
      acceptingAnswerRef.current = false;
      const event = {
        id: eventIdRef.current + 1,
        prompt: `${question.prompt} ${eventInput}`.trim(),
        answer: question.answer,
        ok: false,
      };

      eventIdRef.current = event.id;
      setStreak(0);
      setMistakes((items) => [event, ...items].slice(0, 5));
      setHistory((items) => [event, ...items].slice(0, 6));
      setFeedback("wrong");
      if (navigator.userActivation?.hasBeenActive) soundRef.current?.play("wrong");
    },
    [question, running, selectedTrainer.id],
  );

  const handleInput = useCallback(
    (value: string) => {
      if (!running || feedback !== "idle" || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) {
        return;
      }

      const next = editTrainerInput(inputRef.current, value, selectedTrainer.inputType);

      inputRef.current = next;
      setInput(next);

      if (value === "backspace") return;
      const status = getTrainerAnswerStatus(next, question.answer, selectedTrainer.inputType);
      if (status === "correct") {
        markCorrect();
        return;
      }

      if (status === "wrong") {
        markWrong(next);
      }
    },
    [feedback, markCorrect, markWrong, question.answer, running, selectedTrainer.id, selectedTrainer.inputType],
  );

  const revealAnswer = useCallback(() => {
    if (!running || feedback !== "idle" || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) {
      return;
    }

    const previousInput = inputRef.current || "I don't know";
    inputRef.current = question.answer;
    setInput(question.answer);
    markWrong(previousInput);
  }, [feedback, markWrong, question.answer, running, selectedTrainer.id]);

  const submitAnswer = useCallback(() => {
    if (!running || feedback !== "idle" || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) {
      return;
    }

    const currentInput = inputRef.current;

    if (getTrainerAnswerStatus(currentInput, question.answer, selectedTrainer.inputType) === "correct") {
      markCorrect();
      return;
    }

    markWrong(currentInput || "I don't know");
  }, [feedback, markCorrect, markWrong, question.answer, running, selectedTrainer.id, selectedTrainer.inputType]);

  const selectChoice = useCallback(
    (choice: string) => {
      if (!running || feedback !== "idle" || !acceptingAnswerRef.current || activeTrainerRef.current !== selectedTrainer.id) {
        return;
      }

      inputRef.current = choice;
      setInput(choice);

      if (choice === question.answer) {
        markCorrect();
        return;
      }

      markWrong(choice);
    },
    [feedback, markCorrect, markWrong, question.answer, running, selectedTrainer.id],
  );

  const restart = useCallback(() => {
    clearAdvanceTimer();
    activeTrainerRef.current = selectedTrainer.id;
    acceptingAnswerRef.current = true;
    setRecord(readRecord(selectedTrainer.id));
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setCoins(0);
    setMistakes([]);
    setHistory([]);
    eventIdRef.current = 0;
    setSessionLeft(duration);
    setQuestionLeft(questionTime);
    setFeedback("idle");
    setQuestion(selectedTrainer.makeQuestion(trainerSettings));
    inputRef.current = "";
    setInput("");
  }, [clearAdvanceTimer, duration, questionTime, selectedTrainer, trainerSettings]);

  const resetProgress = useCallback(() => {
    try {
      window.localStorage.removeItem(`record:${selectedTrainer.id}`);
    } catch {
      // Practice remains available when browser storage is disabled.
    }
    setRecord(0);
    restart();
  }, [restart, selectedTrainer.id]);

  const selectTrainer = useCallback((trainer: Trainer) => {
    setSelectedId(trainer.id);
  }, []);

  const handleSubjectChange = useCallback(
    (value: string) => {
      const nextSubject = value as Subject | "all";
      const hasCurrentGrade = trainers.some(
        (trainer) =>
          (nextSubject === "all" || trainer.subject === nextSubject) &&
          (grade === "All" || trainer.grade === grade),
      );
      const nextGrade = hasCurrentGrade ? grade : "All";
      const nextTrainers = trainers.filter(
        (trainer) =>
          (nextSubject === "all" || trainer.subject === nextSubject) &&
          (nextGrade === "All" || trainer.grade === nextGrade),
      );

      setSubject(nextSubject);
      setGrade(nextGrade);

      if (nextTrainers.length && !nextTrainers.some((trainer) => trainer.id === selectedId)) {
        setSelectedId(nextTrainers[0].id);
      }
    },
    [grade, selectedId],
  );

  const handleGradeChange = useCallback(
    (value: string) => {
      const hasCurrentSubject = trainers.some(
        (trainer) =>
          (subject === "all" || trainer.subject === subject) &&
          (value === "All" || trainer.grade === value),
      );
      const nextSubject = hasCurrentSubject ? subject : "all";
      const nextTrainers = trainers.filter(
        (trainer) =>
          (nextSubject === "all" || trainer.subject === nextSubject) &&
          (value === "All" || trainer.grade === value),
      );

      setGrade(value);
      setSubject(nextSubject);

      if (nextTrainers.length && !nextTrainers.some((trainer) => trainer.id === selectedId)) {
        setSelectedId(nextTrainers[0].id);
      }
    },
    [selectedId, subject],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!didHydrateRef.current) {
        didHydrateRef.current = true;
        setRecord(readRecord(selectedTrainer.id));
      } else if (activeTrainerRef.current !== selectedTrainer.id) {
        restart();
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [restart, selectedTrainer.id]);

  useEffect(() => {
    if (score > 0 && activeTrainerRef.current === selectedTrainer.id) {
      try {
        window.localStorage.setItem(`record:${selectedTrainer.id}`, String(Math.max(record, score)));
      } catch {
        // Scores still work for the current session without persistent storage.
      }
    }
  }, [record, score, selectedTrainer.id]);

  useEffect(() => {
    if (questionSettingsRef.current === null) {
      questionSettingsRef.current = trainerSettings;
      return;
    }
    if (questionSettingsRef.current === trainerSettings) return;
    const frame = window.requestAnimationFrame(() => {
      questionSettingsRef.current = trainerSettings;
      clearAdvanceTimer();
      setFeedback("idle");
      makeNextQuestion();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [clearAdvanceTimer, makeNextQuestion, trainerSettings]);

  useEffect(() => {
    if (!running || feedback === "idle") return;
    advanceTimerRef.current = window.setTimeout(() => {
      setFeedback("idle");
      makeNextQuestion();
    }, feedback === "correct" ? 700 : 2400);
    return clearAdvanceTimer;
  }, [clearAdvanceTimer, feedback, makeNextQuestion, running]);

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setSessionLeft((value) => Math.max(0, value - 1));
      if (questionTime > 0 && acceptingAnswerRef.current) {
        setQuestionLeft((value) => Math.max(0, value - 1));
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [questionTime, running]);

  useEffect(() => {
    if (running) return;
    acceptingAnswerRef.current = false;
    clearAdvanceTimer();
    if (navigator.userActivation?.hasBeenActive) soundRef.current?.play("complete");
  }, [clearAdvanceTimer, running, sessionLeft]);

  useEffect(() => {
    if (!running || sessionLeft === 0 || questionTime === 0 || questionLeft > 0 || feedback !== "idle") return;
    const timer = window.setTimeout(() => markWrong(inputRef.current || "timer"), 0);
    return () => window.clearTimeout(timer);
  }, [feedback, markWrong, questionLeft, questionTime, running, sessionLeft]);

  useEffect(() => {
    const kit = new MatchPairsSoundKit();
    soundRef.current = kit;
    return () => {
      kit.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundRef.current?.configure({ muted: !soundEnabled });
  }, [soundEnabled]);

  useEffect(() => {
    if (!openMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !selectorsRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (openMenu || event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
        event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)) {
        return;
      }
      if ((event.key === "Enter" || event.code === "Space") &&
        event.target instanceof HTMLElement && event.target.closest("button, a")) return;

      if (selectedTrainer.inputType === "choice") {
        const choiceIndex = Number(event.key) - 1;
        const choice = question.choices?.[choiceIndex];

        if (choice) {
          event.preventDefault();
          selectChoice(choice);
        }

        if (event.code === "Space") {
          event.preventDefault();
          revealAnswer();
        }

        return;
      }

      if (/^\d$/.test(event.key) || event.key === "-" || event.key === "+" || event.key === "/") {
        event.preventDefault();
        handleInput(event.key);
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        handleInput("backspace");
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submitAnswer();
      }

      if (event.code === "Space") {
        event.preventDefault();
        revealAnswer();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleInput, openMenu, question.choices, revealAnswer, selectChoice, selectedTrainer.inputType, submitAnswer]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Image src="/corgi-logo-concept.png" alt="" width={58} height={54} priority />
          <span>
            <b>Lesson</b>Quest
          </span>
        </div>

        <div className="top-selectors" aria-label="Filters" ref={selectorsRef}>
          <div className="selector-menu">
            <button
              className="selector-pill"
              aria-expanded={openMenu === "subject"}
              onClick={() => setOpenMenu((value) => (value === "subject" ? null : "subject"))}
              type="button"
            >
              <BookOpen size={18} />
              {subjectLabel}
              <span className="chevron">⌄</span>
            </button>
            {openMenu === "subject" ? (
              <div className="selector-popover">
                {subjects.map((item) => (
                  <button
                    className={subject === item.id ? "is-active" : ""}
                    key={item.id}
                    onClick={() => {
                      handleSubjectChange(item.id);
                      setOpenMenu(null);
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="selector-menu">
            <button
              className="selector-pill"
              aria-expanded={openMenu === "grade"}
              onClick={() => setOpenMenu((value) => (value === "grade" ? null : "grade"))}
              type="button"
            >
              <GraduationCap size={18} />
              {grade}
              <span className="chevron">⌄</span>
            </button>
            {openMenu === "grade" ? (
              <div className="selector-popover">
                {grades.map((item) => (
                  <button
                    className={grade === item ? "is-active" : ""}
                    key={item}
                    onClick={() => {
                      handleGradeChange(item);
                      setOpenMenu(null);
                    }}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="user-stats" aria-label="Profile">
          <Link className="studio-nav-link" href="/lab/pendulum">
            Pendulum laboratory
          </Link>
          <Link className="studio-nav-link" href="/lab/space-maze">
            Space Maze
          </Link>
          <Link className="studio-nav-link" href="/studio">
            <Zap size={17} />
            Tutor studio
          </Link>
          <span className="streak-pill">
            <Flame size={16} />
            Streak: {streak}
          </span>
          <span className="coin-pill">
            <CircleDollarSign size={17} />
            {coins}
          </span>
          <Link className="avatar-pill" href="/profile" aria-label="Personal account">ED</Link>
          <span className="chevron">⌄</span>
        </div>
      </header>

      <section className="workspace">
        <aside className="catalog" id="catalog" aria-label="Practice library">
          <div className="catalog-head">
            <h1>Practice library</h1>
            <SlidersHorizontal size={20} />
          </div>

          <div className="catalog-grade">
            <strong>{grade === "All" ? "All grades" : grade}</strong>
            <span>
              {filteredTrainers.length} from {subjectTrainers.length}
            </span>
            {grade !== "All" ? (
              <button onClick={() => handleGradeChange("All")} type="button">
                All grades
              </button>
            ) : null}
          </div>

          <div className="trainer-list">
            {filteredTrainers.map((trainer) => (
              <button
                className={`trainer-card accent-${trainer.accent} ${
                  selectedTrainer.id === trainer.id ? "is-selected" : ""
                }`}
                key={trainer.id}
                onClick={() => selectTrainer(trainer)}
                type="button"
              >
                <span className="trainer-icon">{trainer.icon}</span>
                <span className="trainer-copy">
                  <strong>{trainer.title}</strong>
                  <small>
                    {trainer.category} · {trainer.grade}
                  </small>
                </span>
                {selectedTrainer.id === trainer.id ? <span className="mini-bars">▥</span> : null}
              </button>
            ))}
          </div>

          <Link className="studio-nav-link" href="/lab/refraction">Refraction at the lighthouse →</Link>
          <Link className="studio-nav-link" href="/lab/circuit">Electric circuit in the depot →</Link>

          <button className="new-session" onClick={restart} type="button">
            <Zap size={18} />
            New practice
          </button>

          <button
            className={`results-button ${resultsOpen ? "is-open" : ""}`}
            onClick={() => setResultsOpen((value) => !value)}
            type="button"
          >
            <BarChart3 size={18} />
            My results
          </button>

          {resultsOpen ? <ResultsPanel history={history} mistakes={mistakes} /> : null}
        </aside>

        <section className="trainer-stage" aria-label="Current practice">
          <div className="progress-row">
            <TimerMeter label="Time per question" value={questionTime === 0 ? "No timer" : formatTime(questionLeft)} progress={questionProgress} tone="blue" />
            <TimerMeter label="Practice time" value={formatTime(sessionLeft)} progress={sessionProgress} tone="green" />
          </div>

          <div className={`question-card board-${feedback}`}>
            <div className="question-topline">
              <span />
              <span className="table-chip">{tableTag}</span>
              <button className="dont-know" disabled={!running || feedback !== "idle"} onClick={revealAnswer} type="button">
                <HelpCircle size={18} />
                I don&apos;t know
              </button>
            </div>

            <div className="problem-strip">
              <div className="problem-copy">
                <span>{selectedTrainer.category}</span>
                <p>{question.story}</p>
                <small>{question.hint}</small>
              </div>
              <QuestionVisual visual={question.visual} />
            </div>

            {isChoiceTrainer ? (
              <div className="choice-question" aria-live="polite">
                <small>Select answer</small>
                <strong>{question.prompt}</strong>
              </div>
            ) : (
              <>
                <div className="equation" role="group" aria-label="Expression">
                  <span><MathExpression value={promptExpression} /></span>
                  <span>=</span>
                  <strong>?</strong>
                </div>

                <div className="answer-panel" role="status" aria-label="Answer" aria-live="polite">
                  <span className="spark left">⌁</span>
                  <strong className={selectedTrainer.inputType === "fraction" ? "answer-fraction" : undefined}>
                    <MathExpression value={answerValue} />
                    {input && question.unit ? <small>{question.unit}</small> : null}
                  </strong>
                  <span className="spark right">⌁</span>
                </div>
              </>
            )}

            <p aria-live="polite" className={feedback === "wrong" ? "feedback wrong" : "feedback"}>{feedbackMessage}</p>
            {feedback === "wrong" ? <p className="answer-explanation">{question.explanation}</p> : null}

            {!running ? (
              <div className="session-finished">
                <Trophy size={22} />
                The session has ended. You can start a new one right away.
              </div>
            ) : null}
          </div>

          <div className="practice-row">
            <CorgiMascot mood={feedback} signal={history[0]?.id ?? 0} variant="hero" />

            {isChoiceTrainer ? (
              <div className="choice-pad" aria-label="Answer options">
                {question.choices?.map((choice, index) => {
                  const isSelected = input === choice;
                  const isCorrectAnswer = feedback !== "idle" && question.answer === choice;
                  const isWrongAnswer = feedback === "wrong" && isSelected && question.answer !== choice;
                  const stateClass = isCorrectAnswer
                    ? "is-correct"
                    : isWrongAnswer
                      ? "is-wrong"
                      : isSelected
                        ? "is-selected"
                        : "";

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={stateClass}
                      disabled={!running || feedback !== "idle"}
                      key={choice}
                      onClick={() => selectChoice(choice)}
                      type="button"
                    >
                      <span>{index + 1}</span>
                      <strong>{choice}</strong>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="keypad" aria-label="Numeric keypad">
                {keypadRows.flat().map((key) => (
                  <button
                    aria-label={key === "backspace" ? "Remove last character" : undefined}
                    className={key === "backspace" || key === "/" || key === "+" ? "utility-key" : ""}
                    disabled={!running || feedback !== "idle"}
                    key={key}
                    onClick={() => handleInput(key)}
                    type="button"
                  >
                    {key === "backspace" ? <Delete size={22} /> : key}
                  </button>
                ))}
                <button className="zero-key" disabled={!running || feedback !== "idle"} onClick={() => handleInput("0")} type="button">
                  0
                </button>
                <button className="ok-key" disabled={!running || feedback !== "idle"} onClick={submitAnswer} type="button">
                  OK
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="side-rail" aria-label="Statistics and settings">
          <section className="stats-panel" id="progress">
            <h2>Statistics</h2>
            <Metric icon={<Star size={18} />} label="Score" value={score} tone="gold" />
            <Metric icon={<CheckCircle2 size={18} />} label="Correct" value={correct} tone="green" />
            <Metric icon={<Flame size={18} />} label="Streak" value={`×${multiplier}`} tone="flame" />
            <Metric icon={<Trophy size={18} />} label="Record" value={bestScore} tone="trophy" />
            <div className="session-score">
              <Metric icon={<PawPrint size={18} />} label="Current session" value={`+${Math.max(score, 0)}`} tone="paw" />
            </div>
          </section>

          <section className="settings-panel" id="settings">
            <div className="settings-title">
              <h2>Settings</h2>
              <Settings2 size={22} />
            </div>

            <OptionGroup
              label="Session length"
              options={durationOptions}
              value={duration}
              onChange={(value) => {
                setDuration(value);
                if (running) setSessionLeft(value);
              }}
            />

            <OptionGroup
              label="Time per question"
              options={questionTimeOptions}
              value={questionTime}
              onChange={(value) => {
                setQuestionTime(value);
                setQuestionLeft(value);
              }}
            />

            {selectedTrainer.supportsTableRange ? (
              <OptionGroup
                label="Table range"
                options={tableRangeOptions}
                value={tableMax}
                onChange={setTableMax}
              />
            ) : null}

            {selectedTrainer.supportsMultiplicationOnly ? (
              <SwitchRow
                active={multiplicationOnly}
                label="Multiplication only"
                onClick={() => setMultiplicationOnly((value) => !value)}
              />
            ) : null}

            {selectedTrainer.supportsNegative ? (
              <SwitchRow
                active={allowNegative}
                label="Negative responses"
                onClick={() => setAllowNegative((value) => !value)}
              />
            ) : null}
            <SwitchRow active={soundEnabled} label="Sounds" onClick={() => setSoundEnabled((value) => !value)} />

            <button className="reset-button" onClick={resetProgress} type="button">
              <RotateCcw size={18} />
              Reset progress
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}

function MathExpression({ value }: { value: string }) {
  const fraction = value.match(/^([+-]?\d+)\/(\d*)$/);
  if (fraction) {
    return (
      <span className="math-fraction" aria-label={`${fraction[1]} divided by ${fraction[2] || "?"}`}>
        <span>{fraction[1]}</span>
        <span>{fraction[2] || "?"}</span>
      </span>
    );
  }
  const power = value.match(/^(\d+)([²³])$/);
  if (power) return <span className="math-power">{power[1]}<sup>{power[2] === "²" ? "2" : "3"}</sup></span>;
  return value.replace(/ - /g, " − ").replace(/^\-/, "−").replace(/\(-/g, "(−");
}

function TimerMeter({
  label,
  progress,
  tone,
  value,
}: {
  label: string;
  progress: number;
  tone: "blue" | "green";
  value: string;
}) {
  return (
    <div className="timer-meter">
      <div className="timer-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="timer-track">
        <div className={`timer-fill fill-${tone}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function QuestionVisual({ visual }: { visual: QuestionVisualModel }) {
  const tokens = Array.from({ length: visual.tokens ?? 0 });
  const values = visual.values ?? [];
  const gridStyle = {
    gridTemplateColumns: `repeat(${visual.columns ?? 5}, minmax(0, 1fr))`,
    width: `min(100%, ${(visual.columns ?? 5) * 21 - 3}px)`,
  };
  const fillStyle = { "--fill": `${visual.fill ?? 50}%` } as CSSProperties;

  return (
    <div className={`visual-card visual-${visual.kind}`} aria-label={visual.title}>
      <div className="visual-title">{visual.title}</div>

      {["groups", "division", "remainder", "cubes"].includes(visual.kind) ? (
        <div className="token-grid" style={gridStyle}>
          {tokens.map((_, index) => (
            <span
              className={visual.kind === "remainder" && index >= tokens.length - (visual.remainder ?? 0) ? "is-leftover" : ""}
              key={index}
            >
              {visual.token ?? "●"}
            </span>
          ))}
        </div>
      ) : null}
      {visual.layers && visual.layers > 1 ? <small className="visual-layer-count">Identical layers: {visual.layers}</small> : null}

      {visual.kind === "number-line" ? (
        <div className="number-line">
          <span className="line-dot" style={{ left: `${visual.fill ?? 50}%` }} />
          <div className="number-line-labels"><span>{visual.min}</span><span>{visual.max}</span></div>
          <small>{visual.note}</small>
        </div>
      ) : null}

      {visual.kind === "geometry" ? (
        <div className="geometry-shape">
          <span>{values[0]?.value}</span>
          <strong />
          <span>{values[1]?.value}</span>
        </div>
      ) : null}

      {visual.kind === "fraction" ? (
        <div className="fraction-visual" style={fillStyle}>
          <span />
        </div>
      ) : null}

      {visual.kind === "road" ? (
        <div className="road-visual">
          <span />
        </div>
      ) : null}

      {visual.kind === "scale" ? (
        <div className="scale-visual">
          <span />
          <strong />
          <span />
        </div>
      ) : null}

      {visual.kind === "circuit" ? (
        <div className="circuit-visual">
          <span>U</span>
          <strong>R</strong>
          <span>I</span>
        </div>
      ) : null}

      {visual.kind === "formula" ? (
        <div className="formula-visual">
          {values.map((item) => (
            <strong key={item.label}>{item.value}</strong>
          ))}
        </div>
      ) : null}

      {visual.kind === "word" ? (
        <div className="word-visual">
          <strong>{visual.note}</strong>
          <span aria-hidden="true" />
        </div>
      ) : null}

      {values.length ? (
        <div className="visual-values">
          {values.map((item) => (
            <span key={item.label}>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: string;
  value: number | string;
}) {
  return (
    <div className="metric">
      <span className={`metric-icon tone-${tone}`}>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function OptionGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  options: Array<{ label: string; value: number }>;
  value: number;
}) {
  return (
    <div className="option-group">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={value === option.value ? "is-active" : ""}
            key={option.label}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SwitchRow({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className="switch-row" role="switch" aria-checked={active} onClick={onClick} type="button">
      <span>{label}</span>
      <span className={`switch ${active ? "is-active" : ""}`} aria-hidden="true" />
    </button>
  );
}

function ResultsPanel({ history, mistakes }: { history: AnswerEvent[]; mistakes: AnswerEvent[] }) {
  return (
    <div className="results-panel">
      <strong>Latest answers</strong>
      {history.length ? (
        <div className="result-list">
          {history.map((item) => (
            <span className={item.ok ? "is-ok" : "is-bad"} key={item.id}>
              {item.ok ? "✓" : "!"} {item.prompt} → {item.answer}
            </span>
          ))}
        </div>
      ) : (
        <p>There are no answers in this session yet.</p>
      )}

      {mistakes.length ? <small>Errors to repeat: {mistakes.length}</small> : null}
    </div>
  );
}
