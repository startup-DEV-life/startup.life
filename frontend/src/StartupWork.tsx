import { useEffect, useRef, useState } from 'react';

async function request(path: string, options: any = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not save your work.');
  return data;
}

export function StartupWork({ player, onPlayer, onSignIn, signedIn }: any) {
  const requestVersion = useRef(0);
  const [assignment, setAssignment] = useState<any>(null);
  const [text, setText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageId, setImageId] = useState('');
  const [greetings, setGreetings] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const load = async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError('');
    try {
      const data = await request('/api/work');
      if (version === requestVersion.current) setAssignment(data);
    } catch (e: any) {
      if (version === requestVersion.current) setError(e.message);
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  };
  useEffect(() => {
    setAssignment(null);
    setText('');
    setHashtags('');
    setImageId('');
    setGreetings({});
    if (signedIn && player.accountType === 'developer') void load();
    return () => {
      requestVersion.current++;
    };
  }, [player.jobId, player.tasksDone, signedIn, player.accountType]);
  const submit = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await request('/api/work/submit', {
        method: 'POST',
        body: JSON.stringify({ assignmentId: assignment.id, text, hashtags, imageId }),
      });
      onPlayer(data.player);
      setNotice(`${data.message} +${data.reward} coins and XP.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const greet = async (target: any) => {
    setBusy(true);
    setError('');
    try {
      await request('/api/work/greet', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: assignment.id,
          targetId: target.id,
          body: greetings[target.id] || '',
        }),
      });
      await load();
      setNotice(`Welcome sent to ${target.name}.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="startup-work" aria-label="Startup role assignments">
      <div className="laptop-page-heading">
        <span>STARTUP.LIFE · WORKSPACE</span>
        <h2>Your role. Your contribution.</h2>
        <p>Build a startup together. Each career has its own kind of work.</p>
      </div>
      {!signedIn ? (
        <button className="visit-button" onClick={onSignIn}>
          Sign in to start
        </button>
      ) : player.accountType !== 'developer' ? (
        <p>
          Beginners can explore every career and use the learning campus. Work assignments are
          available to Startup professional accounts (the existing Developer account tier). Growers
          support and invest in the community.
        </p>
      ) : (
        <>
          <button disabled={busy} onClick={load}>
            Refresh assignment
          </button>
          {assignment?.job && (
            <p className="work-role">
              <b>
                {assignment.job.emoji} {assignment.job.title}
              </b>{' '}
              · {assignment.job.reward} coins + XP
            </p>
          )}
          {assignment?.waiting ? (
            <p role="status">{assignment.message}</p>
          ) : assignment?.task ? (
            <>
              <h3>{assignment.task.title}</h3>
              <p>{assignment.task.prompt}</p>
              {assignment.task.code && <pre className="work-code">{assignment.task.code}</pre>}
              {assignment.kind === 'hr' ? (
                <div className="work-colleagues">
                  <button
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      try {
                        await request('/api/work/colleagues', {
                          method: 'POST',
                          body: JSON.stringify({ assignmentId: assignment.id }),
                        });
                        await load();
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Refresh colleagues on this floor
                  </button>
                  {assignment.targets.map((target: any) => (
                    <div key={target.id} className="work-colleague">
                      <b>{target.name}</b>
                      {target.done ? (
                        <p>✓ Welcome sent</p>
                      ) : (
                        <>
                          <label>
                            Personal welcome for {target.name}
                            <textarea
                              maxLength={500}
                              value={greetings[target.id] || ''}
                              onChange={(e) =>
                                setGreetings({ ...greetings, [target.id]: e.target.value })
                              }
                            />
                          </label>
                          <button disabled={busy} onClick={() => greet(target)}>
                            Send welcome
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {assignment.kind === 'marketing' && (
                    <>
                      <label>
                        Campaign image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={busy}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setImageId('');
                            setError('');
                            if (file.size > 5 * 1024 * 1024) {
                              setError('Choose an image up to 5 MB.');
                              return;
                            }
                            setBusy(true);
                            try {
                              const data = await request('/api/work/image', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': file.type,
                                  'X-Assignment-Id': assignment.id,
                                },
                                body: file,
                              });
                              setImageId(data.imageId);
                            } catch (error: any) {
                              setError(error.message);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        />
                      </label>
                      {imageId && (
                        <img
                          className="work-campaign"
                          src={`/api/work/image/${imageId}`}
                          alt="Your uploaded campaign"
                        />
                      )}
                      <label>
                        Hashtags
                        <input
                          maxLength={500}
                          placeholder="#BuildTogether #StartupLife #LaunchDay"
                          value={hashtags}
                          onChange={(e) => setHashtags(e.target.value)}
                        />
                      </label>
                    </>
                  )}
                  <label>
                    {assignment.kind === 'code'
                      ? 'Missing expression'
                      : assignment.kind === 'marketing'
                        ? 'Campaign caption'
                        : assignment.kind === 'finance'
                          ? 'Remaining balance'
                          : 'Your submission'}
                    <textarea
                      spellCheck={assignment.kind !== 'code'}
                      maxLength={5000}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={assignment.task.headings?.join('\n') || ''}
                    />
                  </label>
                </>
              )}
              {assignment.task.headings && (
                <small>
                  Practice checks require the requested sections. They do not assess professional
                  quality or replace mentor feedback.
                </small>
              )}
              <button className="visit-button" disabled={busy} onClick={submit}>
                {busy ? 'Saving…' : 'Submit assignment'}
              </button>
            </>
          ) : busy ? (
            <p>Loading your assignment…</p>
          ) : null}
        </>
      )}
      {error && (
        <p className="work-error" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
