import express from 'express';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const challenges = {
  code: [
    {
      title: 'Count a product batch',
      prompt:
        'Complete the JavaScript loop so it adds 1 through 5. Fill only the missing expression.',
      code: 'let total = 0;\nfor (let i = 1; ____; i++) {\n  total += i;\n}\n// total must equal 15',
      answer: 'i<=5',
      hint: 'Include the final item in the batch.',
    },
    {
      title: 'Protect an empty cart',
      prompt:
        'Complete the condition so checkout opens only when the cart contains at least one item.',
      code: 'const items = 3;\nif (____) {\n  openCheckout();\n}',
      answer: 'items>0',
      hint: 'Compare the item count with zero.',
    },
    {
      title: 'Return the doubled price',
      prompt: 'Fill the missing expression in this JavaScript function.',
      code: 'function doublePrice(price) {\n  return ____;\n}\n// doublePrice(8) must return 16',
      answer: 'price*2',
      hint: 'Multiply the argument by two.',
    },
  ],
  marketing: [
    {
      title: 'Launch a campaign',
      prompt:
        'Upload an original campaign image (PNG/JPEG/WebP, up to 5 MB). Write a caption of at least 40 characters explaining who the product helps, and add at least three distinct hashtags. This saves a private practice campaign, not a public social post.',
    },
  ],
  hr: [
    {
      title: 'Welcome your colleagues',
      prompt:
        'Enter a building and refresh the colleague list. Send a personalized welcome of at least 20 characters to each online colleague in the same nearby building area. The list is fixed when you start; people joining later are not added. No NPCs are used.',
    },
  ],
  management: [
    {
      title: 'Plan a product launch',
      prompt:
        'Write at least 120 characters covering a goal, owner, deadline and risk. Use the headings Goal:, Owner:, Deadline: and Risk:.',
      headings: ['goal:', 'owner:', 'deadline:', 'risk:'],
    },
  ],
  product: [
    {
      title: 'Improve a user journey',
      prompt:
        'Write a product brief of at least 120 characters with User:, Problem:, Solution: and Success: sections. Describe a specific user and a measurable outcome.',
      headings: ['user:', 'problem:', 'solution:', 'success:'],
    },
  ],
  sales: [
    {
      title: 'Prepare a customer pitch',
      prompt:
        'Write at least 120 characters under Customer:, Problem:, Value: and Next step:. Explain the customer need, your offer and the next conversation.',
      headings: ['customer:', 'problem:', 'value:', 'next step:'],
    },
  ],
  support: [
    {
      title: 'Respond to a customer',
      prompt:
        'A customer cannot access their workspace. Write at least 120 characters under Acknowledge:, Steps:, Privacy: and Follow-up:. Do not ask for their password.',
      headings: ['acknowledge:', 'steps:', 'privacy:', 'follow-up:'],
    },
  ],
  finance: [
    {
      title: 'Balance the launch budget',
      prompt:
        'Your startup has 5,000 coins. Design costs 1,200, marketing 800 and hosting 500. Enter the remaining balance as a number.',
      answer: '2500',
      hint: 'Subtract all three costs from the starting budget.',
    },
  ],
};

export function installStartupWork({
  app,
  db,
  auth,
  requireRole,
  jobs,
  playerQuery,
  publicPlayer,
  io,
  online,
  uploadPath,
}: any) {
  db.exec(`CREATE TABLE IF NOT EXISTS work_assignments (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), job_id TEXT NOT NULL,
    sequence INTEGER NOT NULL, kind TEXT NOT NULL, task_index INTEGER NOT NULL,
    targets TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, completed_at TEXT,
    submission TEXT, UNIQUE(user_id,job_id,sequence));
    CREATE TABLE IF NOT EXISTS work_greetings (
    assignment_id TEXT NOT NULL REFERENCES work_assignments(id), target_id TEXT NOT NULL,
    body TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(assignment_id,target_id));
    CREATE TABLE IF NOT EXISTS work_images (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), mime TEXT NOT NULL,
    created_at TEXT NOT NULL, assignment_id TEXT NOT NULL REFERENCES work_assignments(id));`);
  const directory = join(uploadPath, 'work-images');
  mkdirSync(directory, { recursive: true });
  const at = () => new Date().toISOString();
  const canWork = requireRole('developer'); // Existing account tier; career is independent.
  const kindOf = (job: any) => job.taskKind || (job.id === 'product-designer' ? 'product' : 'code');
  const taskFor = (row: any) => challenges[row.kind][row.task_index];
  const active = (id: string, assignmentId: string) => {
    if (typeof assignmentId !== 'string' || assignmentId.length !== 32) return null;
    const row = db
      .prepare('SELECT * FROM work_assignments WHERE id=? AND user_id=? AND completed_at IS NULL')
      .get(assignmentId, id);
    const player = playerQuery.get(id);
    return row && row.job_id === player.jobId && row.sequence === player.tasksDone ? row : null;
  };
  const colleagues = (id: string) => {
    const me = online().get(id);
    if (!me?.inBuilding) return [];
    return [...online().values()]
      .filter(
        (q: any) =>
          q.id !== id &&
          q.inBuilding &&
          !q.inRift &&
          me.buildingId &&
          q.buildingId === me.buildingId &&
          q.floor === me.floor &&
          Math.hypot(q.x - me.x, q.y - me.y) < 145,
      )
      .map((q: any) => ({ id: q.id, name: q.name }));
  };
  app.get('/api/work', auth, canWork, (req, res) => {
    const id = req.account.user_id,
      p = playerQuery.get(id),
      job = jobs.find((j: any) => j.id === p.jobId);
    if (!job) return res.status(400).json({ error: 'Choose a startup career first.' });
    const kind = kindOf(job),
      taskIndex = (p.tasksDone || 0) % challenges[kind].length;
    let row = db
      .prepare('SELECT * FROM work_assignments WHERE user_id=? AND job_id=? AND sequence=?')
      .get(id, job.id, p.tasksDone);
    if (!row) {
      const targets = kind === 'hr' ? colleagues(id) : [];
      if (kind === 'hr' && !targets.length)
        return res.json({
          job,
          waiting: true,
          message:
            'Enter a building with another online player, then refresh. Nobody is available nearby yet.',
        });
      const assignmentId = randomBytes(16).toString('hex');
      db.prepare(
        'INSERT INTO work_assignments(id,user_id,job_id,sequence,kind,task_index,targets,created_at) VALUES(?,?,?,?,?,?,?,?)',
      ).run(assignmentId, id, job.id, p.tasksDone, kind, taskIndex, JSON.stringify(targets), at());
      row = db.prepare('SELECT * FROM work_assignments WHERE id=?').get(assignmentId);
    }
    const { answer, ...task } = taskFor(row);
    const greeted = db
      .prepare('SELECT target_id FROM work_greetings WHERE assignment_id=?')
      .all(row.id)
      .map((q: any) => q.target_id);
    res.json({
      id: row.id,
      job,
      kind: row.kind,
      task,
      targets: JSON.parse(row.targets).map((q: any) => ({ ...q, done: greeted.includes(q.id) })),
    });
  });
  app.post('/api/work/colleagues', auth, canWork, (req, res) => {
    const id = req.account.user_id,
      row = active(id, req.body?.assignmentId);
    if (!row || row.kind !== 'hr')
      return res.status(409).json({ error: 'Refresh your HR assignment.' });
    const targets = colleagues(id);
    if (!targets.length)
      return res
        .status(400)
        .json({ error: 'No colleagues on your floor right now. Try again when someone joins.' });
    // Preserve welcomes for anyone still on the refreshed roster.
    db.prepare('UPDATE work_assignments SET targets=? WHERE id=?').run(
      JSON.stringify(targets),
      row.id,
    );
    res.json({ ok: true });
  });
  app.post('/api/work/greet', auth, canWork, (req, res) => {
    const id = req.account.user_id,
      row = active(id, req.body?.assignmentId);
    if (!row || row.kind !== 'hr')
      return res.status(409).json({ error: 'Refresh your HR assignment.' });
    const target = req.body?.targetId,
      body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (body.length < 20 || body.length > 500)
      return res.status(400).json({ error: 'Write a welcome between 20 and 500 characters.' });
    if (
      !JSON.parse(row.targets).some((q: any) => q.id === target) ||
      !colleagues(id).some((q: any) => q.id === target)
    )
      return res
        .status(400)
        .json({ error: 'This colleague must be online in your nearby building area.' });
    if (
      db
        .prepare('SELECT 1 FROM work_greetings WHERE assignment_id=? AND target_id=?')
        .get(row.id, target)
    )
      return res.json({ ok: true });
    const me = online().get(id);
    db.prepare('INSERT OR IGNORE INTO work_greetings VALUES(?,?,?,?)').run(
      row.id,
      target,
      body,
      at(),
    );
    for (const socket of io.sockets.sockets.values())
      if ((socket as any).userId === target) socket.emit('work:greeting', { from: me.name, body });
    res.json({ ok: true });
  });
  app.post(
    '/api/work/image',
    auth,
    canWork,
    express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '5mb' }),
    (req, res) => {
      const id = req.account.user_id,
        row = active(id, String(req.headers['x-assignment-id'] || ''));
      if (!row || row.kind !== 'marketing')
        return res.status(409).json({ error: 'Refresh your marketing assignment.' });
      const bytes = req.body,
        mime = String(req.headers['content-type']).split(';')[0];
      const valid =
        Buffer.isBuffer(bytes) &&
        ((mime === 'image/png' &&
          bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
          (mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
          (mime === 'image/webp' &&
            bytes.toString('ascii', 0, 4) === 'RIFF' &&
            bytes.toString('ascii', 8, 12) === 'WEBP'));
      if (!valid) return res.status(400).json({ error: 'Upload a valid PNG, JPEG or WebP image.' });
      const count = db
        .prepare('SELECT COUNT(*) AS n FROM work_images WHERE user_id=? AND created_at>?')
        .get(id, new Date(Date.now() - 86400000).toISOString()).n;
      if (count >= 10)
        return res.status(429).json({ error: 'Daily limit of 10 campaign image uploads reached.' });
      const imageId = randomBytes(16).toString('hex');
      writeFileSync(join(directory, imageId), bytes, { flag: 'wx' });
      db.prepare('INSERT INTO work_images VALUES(?,?,?,?,?)').run(imageId, id, mime, at(), row.id);
      res.status(201).json({ imageId });
    },
  );
  app.get('/api/work/image/:id', auth, (req, res) => {
    const row = db
      .prepare('SELECT id,mime FROM work_images WHERE id=? AND user_id=?')
      .get(req.params.id, req.account.user_id);
    if (!row) return res.status(404).json({ error: 'Image not found.' });
    res.setHeader('Content-Type', row.mime);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(join(directory, row.id));
  });
  app.post('/api/work/submit', auth, canWork, (req, res) => {
    const id = req.account.user_id,
      row = active(id, req.body?.assignmentId);
    if (!row)
      return res
        .status(409)
        .json({ error: 'Your role or assignment changed. Refresh before submitting.' });
    const task = taskFor(row),
      body = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (body.length > 5000)
      return res.status(400).json({ error: 'Keep your submission under 5,000 characters.' });
    let error = '';
    if (row.kind === 'code' && body.replace(/\s+/g, '') !== task.answer)
      error = 'That expression does not complete this exercise. ' + task.hint;
    if (row.kind === 'finance' && body.replace(/[ ,]/g, '') !== task.answer)
      error = 'The balance is not correct yet. ' + task.hint;
    if (
      task.headings &&
      (body.length < 120 ||
        task.headings.some(
          (h: string) =>
            !body.toLowerCase().includes(h) || body.toLowerCase().split(h)[1]?.trim().length < 8,
        ))
    )
      error =
        'Complete each requested section and write at least 120 characters. This is a structured practice check, not a human review.';
    if (row.kind === 'hr') {
      const targets = JSON.parse(row.targets);
      const greeted = db
        .prepare('SELECT target_id FROM work_greetings WHERE assignment_id=?')
        .all(row.id)
        .map((q: any) => q.target_id);
      if (!targets.length || targets.some((q: any) => !greeted.includes(q.id)))
        error = 'Welcome every colleague on this assignment before completing it.';
    }
    if (row.kind === 'marketing') {
      const image = db
        .prepare('SELECT id FROM work_images WHERE id=? AND user_id=? AND assignment_id=?')
        .get(typeof req.body?.imageId === 'string' ? req.body.imageId : '', id, row.id);
      const tags = new Set(
        (typeof req.body?.hashtags === 'string' ? req.body.hashtags : '')
          .toLowerCase()
          .match(/#[a-z0-9_]{2,30}\b/g) || [],
      );
      if (!image || body.length < 40 || tags.size < 3)
        error = 'Upload an image, write at least 40 characters and add three distinct hashtags.';
    }
    if (error) return res.status(400).json({ error });
    const last = db
      .prepare('SELECT completed_at FROM job_completions WHERE user_id=? ORDER BY id DESC LIMIT 1')
      .get(id);
    if (last && Date.now() - Date.parse(last.completed_at) < 30000)
      return res
        .status(429)
        .json({ error: 'Take a short break: assignments have a 30-second reward cooldown.' });
    const job = jobs.find((j: any) => j.id === row.job_id),
      now = at();
    db.transaction(() => {
      db.prepare('UPDATE work_assignments SET completed_at=?,submission=? WHERE id=?').run(
        now,
        JSON.stringify({
          text: body,
          hashtags: String(req.body?.hashtags || '').slice(0, 500),
          imageId: req.body?.imageId || null,
        }),
        row.id,
      );
      db.prepare(
        'UPDATE players SET coins=coins+?,xp=xp+?,tasks_done=tasks_done+1,energy=MAX(8,energy-4),updated_at=? WHERE user_id=?',
      ).run(job.reward, job.reward, now, id);
      db.prepare('INSERT INTO job_completions(user_id,job_id,completed_at) VALUES(?,?,?)').run(
        id,
        job.id,
        now,
      );
    })();
    const player = publicPlayer(playerQuery.get(id));
    io.emit('player:update', player);
    res.json({
      player,
      reward: job.reward,
      message: 'Assignment completed. Your work and rewards have been saved.',
    });
  });
}
