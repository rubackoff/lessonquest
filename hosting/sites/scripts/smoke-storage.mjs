import assert from "node:assert/strict";

const origin = process.argv[2] || "http://localhost:5173";
let activityId;

async function request(path, options) {
  const response = await fetch(new URL(path, origin), options);
  const text = await response.text();
  return { status: response.status, text, body: text ? JSON.parse(text) : null };
}

const jsonOptions = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

try {
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /LessonQuest/);
  assert.equal((await request("/api/activities", jsonOptions({}))).status, 400);

  const created = await request("/api/activities", jsonOptions({
    gameId: "match-pairs",
    title: "Cloud storage check",
    level: {
      id: 1,
      title: "Cloud storage check",
      subject: "Mathematics",
      grade: "Grade 2",
      prompt: "Match each expression to its answer.",
      teacherNote: "Automated check before publication.",
      pairs: [
        { id: "a", left: "2 + 2", right: "4" },
        { id: "b", left: "3 + 3", right: "6" },
      ],
    },
  }));
  assert.equal(created.status, 201, created.text);
  activityId = created.body.activity.id;
  assert.equal((await request(`/api/activities/${activityId}`)).body.activity.id, activityId);
  assert.ok((await request("/api/activities")).body.activities.some((item) => item.id === activityId));

  const play = await fetch(new URL(`/play/${activityId}`, origin));
  assert.equal(play.status, 200);
  assert.match(await play.text(), /Cloud storage check/);

  const attempt = await request("/api/attempts", jsonOptions({
    activityId,
    studentName: "Test student",
    durationSeconds: 15,
    accuracy: 100,
  }));
  assert.equal(attempt.status, 201, attempt.text);
  assert.ok((await request("/api/attempts")).body.attempts.some((item) => item.activityId === activityId));

  assert.equal((await request(`/api/activities/${activityId}`, { method: "DELETE" })).status, 204);
  assert.equal((await request(`/api/activities/${activityId}`)).status, 404);
  assert.ok(!(await request("/api/attempts")).body.attempts.some((item) => item.activityId === activityId));
  console.log("PASS: page, validation, create, list, open, attempt, delete, cascade");
} finally {
  if (activityId) await fetch(new URL(`/api/activities/${activityId}`, origin), { method: "DELETE" });
}
