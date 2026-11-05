import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, MessageCircle, Plus, Search, Send, Users, X } from 'lucide-react';

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function PhoneMessages({
  userId,
  initialContactId = '',
}: {
  userId: string;
  initialContactId?: string;
}) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'chats' | 'contacts' | 'group'>('chats');
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const reload = async () => {
    try {
      const [contactData, conversationData] = await Promise.all([
        request('/api/phone/contacts'),
        request('/api/phone/conversations'),
      ]);
      setContacts(contactData.contacts || []);
      setConversations(conversationData.conversations || []);
    } catch (reason: any) {
      setError(reason.message);
    }
  };
  useEffect(() => {
    void reload();
  }, [userId]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    const loadMessages = () =>
      request(`/api/phone/conversations/${selected.id}/messages`)
        .then((data) => active && setMessages(data.messages || []))
        .catch((reason) => active && setError(reason.message));
    void loadMessages();
    const timer = window.setInterval(loadMessages, 3500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selected?.id]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selected?.id]);
  useEffect(() => {
    if (!initialContactId || !contacts.length) return;
    const contact = contacts.find((person) => person.id === initialContactId);
    if (contact) void openContact(contact);
  }, [initialContactId, contacts.length]);

  const openContact = async (contact: any) => {
    setError('');
    try {
      const data = await request('/api/phone/conversations', {
        method: 'POST',
        body: JSON.stringify({ memberIds: [contact.id] }),
      });
      const conversation = conversations.find((item) => item.id === data.id) || {
        id: data.id,
        title: contact.name,
        isGroup: false,
        profileImage: contact.profileImage,
      };
      setSelected(conversation);
      setMessages([]);
      setView('chats');
      await reload();
    } catch (reason: any) {
      setError(reason.message);
    }
  };
  const createGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!groupName.trim() || !groupMembers.length) return;
    setBusy(true);
    setError('');
    try {
      const data = await request('/api/phone/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: groupName, memberIds: groupMembers }),
      });
      await reload();
      setSelected({
        id: data.id,
        title: groupName,
        isGroup: true,
        memberCount: groupMembers.length + 1,
      });
      setMessages([]);
      setGroupName('');
      setGroupMembers([]);
      setView('chats');
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (!selected || !body) return;
    setDraft('');
    setError('');
    try {
      const data = await request(`/api/phone/conversations/${selected.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      setMessages((items) => [...items, data.message]);
      await reload();
    } catch (reason: any) {
      setError(reason.message);
      setDraft(body);
    }
  };
  const visibleContacts = contacts.filter((person) =>
    `${person.name} ${person.username} ${person.accountType}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <section className="phone-messages-app">
      {selected ? (
        <>
          <header className="phone-messages-head">
            <button
              onClick={() => {
                setSelected(null);
                setMessages([]);
              }}
              aria-label="Back to chats"
            >
              <ArrowLeft size={18} />
            </button>
            <Avatar image={selected.profileImage} name={selected.title} group={selected.isGroup} />
            <div>
              <b>{selected.title}</b>
              <small>
                {selected.isGroup
                  ? `${selected.memberCount || groupMembers.length + 1} members · group chat`
                  : 'Direct message'}
              </small>
            </div>
            <button
              onClick={() => {
                void reload();
              }}
              aria-label="Refresh conversation"
            >
              ↻
            </button>
          </header>
          {error && <p className="phone-message-error">{error}</p>}
          <div className="phone-message-history">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`phone-message-bubble ${message.senderId === userId ? 'mine' : ''}`}
              >
                <small>{message.senderId === userId ? 'You' : message.senderName}</small>
                <p>{message.body}</p>
                <time>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  {message.senderId === userId && <Check size={11} />}
                </time>
              </div>
            ))}
            {!messages.length && (
              <p className="phone-message-empty">Say hello and start the conversation.</p>
            )}
            <div ref={bottom} />
          </div>
          <form className="phone-message-compose" onSubmit={send}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              placeholder="Message…"
            />
            <button disabled={!draft.trim()} aria-label="Send message">
              <Send size={16} />
            </button>
          </form>
        </>
      ) : (
        <>
          <header className="phone-messages-home-head">
            <div>
              <span>STARTUP.LIFE · INBOX</span>
              <h3>Messages</h3>
            </div>
            <button
              onClick={() => {
                setView(view === 'group' ? 'chats' : 'group');
                setError('');
              }}
              aria-label="Create a group"
            >
              <Users size={17} />
              <Plus size={12} />
            </button>
          </header>
          <div className="phone-message-tabs">
            <button className={view === 'chats' ? 'active' : ''} onClick={() => setView('chats')}>
              <MessageCircle size={14} /> Chats
            </button>
            <button
              className={view === 'contacts' ? 'active' : ''}
              onClick={() => setView('contacts')}
            >
              <Users size={14} /> People
            </button>
          </div>
          {error && <p className="phone-message-error">{error}</p>}
          <label className="phone-message-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={view === 'chats' ? 'Search conversations' : 'Find a player'}
            />
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={13} />
            </button>
          </label>
          {view === 'group' ? (
            <form className="phone-group-form" onSubmit={createGroup}>
              <label>
                Group name
                <input
                  required
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  maxLength={50}
                  placeholder="e.g. Founders circle"
                />
              </label>
              <small>Choose people to add</small>
              <div className="phone-contact-list">
                {visibleContacts.map((person) => (
                  <label key={person.id}>
                    <Avatar image={person.profileImage} name={person.name} />
                    <span>
                      <b>{person.name}</b>
                      <small>@{person.username}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={groupMembers.includes(person.id)}
                      onChange={(event) =>
                        setGroupMembers((members) =>
                          event.target.checked
                            ? members.length < 9
                              ? [...members, person.id]
                              : members
                            : members.filter((id) => id !== person.id),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <button className="phone-group-create" disabled={busy || !groupMembers.length}>
                {busy ? 'Creating…' : `Create group · ${groupMembers.length} selected`}
              </button>
            </form>
          ) : view === 'contacts' ? (
            <div className="phone-contact-list">
              {visibleContacts.map((person) => (
                <button key={person.id} onClick={() => void openContact(person)}>
                  <Avatar image={person.profileImage} name={person.name} />
                  <span>
                    <b>{person.name}</b>
                    <small>
                      @{person.username} · {person.accountType}
                    </small>
                  </span>
                  <MessageCircle size={16} />
                </button>
              ))}
              {!visibleContacts.length && (
                <p className="phone-message-empty">No players match that search.</p>
              )}
            </div>
          ) : (
            <div className="phone-conversation-list">
              {conversations
                .filter((conversation) =>
                  `${conversation.title} ${conversation.lastMessage || ''}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelected(conversation);
                      setError('');
                    }}
                  >
                    <Avatar
                      image={conversation.profileImage}
                      name={conversation.title}
                      group={conversation.isGroup}
                    />
                    <span>
                      <b>{conversation.title || 'Direct message'}</b>
                      <small>{conversation.lastMessage || 'Start a conversation'}</small>
                    </span>
                    <time>
                      {conversation.updatedAt
                        ? new Date(conversation.updatedAt).toLocaleDateString()
                        : ''}
                    </time>
                  </button>
                ))}
              {!conversations.length && (
                <p className="phone-message-empty">
                  No conversations yet. Choose People or start a group.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Avatar({
  image,
  name,
  group = false,
}: {
  image?: string;
  name?: string;
  group?: boolean;
}) {
  if (image) return <img className="phone-message-avatar" src={image} alt="" />;
  return (
    <span className="phone-message-avatar">
      {group ? <Users size={15} /> : name?.slice(0, 1)?.toUpperCase()}
    </span>
  );
}
