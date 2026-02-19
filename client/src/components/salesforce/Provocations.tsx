import { useState } from 'react';
import {
  ChevronDown,
  Send,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';

// ── Persona definitions with explicit, context-rich questions ──────────────

interface Persona {
  id: string;
  label: string;
  initials: string;
  color: string;
  description: string;
  questions: { text: string; tag: string }[];
}

const personas: Persona[] = [
  {
    id: 'data-architect',
    label: 'Data Architect',
    initials: 'DA',
    color: 'linear-gradient(135deg, #9B8BF4 0%, #6B5CE7 100%)',
    description: 'Challenges your data model, integration patterns, and scalability decisions.',
    questions: [
      { text: 'How does your data model handle many-to-many relationships between Accounts and Contacts across multiple orgs?', tag: 'Data Model' },
      { text: 'What happens to your identity resolution when two source systems have conflicting email addresses for the same person?', tag: 'Identity' },
      { text: 'If your primary data stream goes down for 6 hours, what is the cascading impact on downstream segments and activations?', tag: 'Resilience' },
      { text: 'Walk me through how a single customer event flows from ingestion to a unified profile update — what are the latency bottlenecks?', tag: 'Pipeline' },
      { text: 'Your calculated insights depend on 4 different data streams. What is your strategy when one stream has a schema-breaking change?', tag: 'Schema Evolution' },
      { text: 'How are you handling PII tokenization across your data streams while still enabling cross-source identity matching?', tag: 'Privacy' },
      { text: 'What is your rollback plan if a bad batch of data corrupts 50,000 unified profiles?', tag: 'Recovery' },
      { text: 'You have 768-dimension embeddings in pgvector. At 10M documents, what is your indexing and query latency strategy?', tag: 'Vector Search' },
    ],
  },
  {
    id: 'qa-engineer',
    label: 'QA Engineer',
    initials: 'QA',
    color: 'linear-gradient(135deg, #F49756 0%, #E07B3A 100%)',
    description: 'Probes edge cases, error handling, and failure scenarios.',
    questions: [
      { text: 'What happens when a user uploads a 0-byte MHTML file? Does the UI show a meaningful error or silently fail?', tag: 'Edge Case' },
      { text: 'If the Gemini embedding API returns a 429 rate-limit error mid-batch, do the already-processed chunks get saved or is the whole upload rolled back?', tag: 'Error Handling' },
      { text: 'Can you delete a help document while it is still being chunked and embedded? What race condition exists there?', tag: 'Race Condition' },
      { text: 'What is the expected behavior when two users upload the same file simultaneously? Duplicate rows or deduplication?', tag: 'Concurrency' },
      { text: 'The semantic search returns results — but what happens if the documents table exists and the help_documents table does not? Have you tested that mismatch?', tag: 'Data Integrity' },
      { text: 'If the database connection drops during a multi-chunk insert, how many orphaned rows can be left behind?', tag: 'Transaction Safety' },
      { text: 'The republish endpoint deletes old chunks then inserts new ones. If the insert fails halfway, the document now has fewer chunks than before. Is that acceptable?', tag: 'Atomicity' },
      { text: 'Your auth cookie expires after 24 hours. What is the UX when it expires mid-session while the user is uploading a file?', tag: 'Auth Expiry' },
    ],
  },
  {
    id: 'ceo',
    label: 'CEO',
    initials: 'CEO',
    color: 'linear-gradient(135deg, #54698D 0%, #3B4F6B 100%)',
    description: 'Asks about business value, adoption risk, and strategic alignment.',
    questions: [
      { text: 'We are investing in a unified data platform. What is the measurable business outcome we can show the board in 90 days?', tag: 'ROI' },
      { text: 'Our competitors are also building CDPs. What is our defensible differentiation — the thing they cannot easily replicate?', tag: 'Strategy' },
      { text: 'If only 30% of our sales team adopts this tool, does it still deliver value? What is the minimum viable adoption threshold?', tag: 'Adoption' },
      { text: 'The help document system uses AI embeddings. Can you explain the cost per query at scale, and does it make economic sense vs. keyword search?', tag: 'Unit Economics' },
      { text: 'What is the single biggest risk to this project failing, and what is your mitigation plan?', tag: 'Risk' },
      { text: 'How does this fit into our existing Salesforce investment? Are we replacing tools people already use or adding yet another one?', tag: 'Platform Fit' },
      { text: 'If we need to pause this initiative for a quarter due to budget cuts, what is the minimum team needed to keep it alive?', tag: 'Sustainability' },
      { text: 'Our data privacy officer is nervous about AI processing customer data. What is your compliance story?', tag: 'Compliance' },
    ],
  },
  {
    id: 'think-big',
    label: 'Think Big',
    initials: '10x',
    color: 'linear-gradient(135deg, #E8788A 0%, #D4566A 100%)',
    description: 'Pushes you to reimagine scope, challenge assumptions, and think 10x.',
    questions: [
      { text: 'What if every Salesforce object could explain itself in natural language? How would that change the way users interact with CRM?', tag: 'Vision' },
      { text: 'Instead of users searching for help documents, what if the system proactively surfaced the right document at the right moment based on what the user is doing?', tag: 'Proactive AI' },
      { text: 'Your Time Machine shows today vs. 2 years out. What if it could simulate any point in the future based on current pipeline and trends?', tag: 'Simulation' },
      { text: 'What if your agent panel could not just answer questions but actually execute multi-step workflows on behalf of the user?', tag: 'Autonomous Agent' },
      { text: 'You have unified customer profiles. What if you could generate a personalized "deal strategy" for each account based on every signal across every channel?', tag: 'Intelligence' },
      { text: 'What if the provocations feature became a live coaching system — listening to sales calls in real-time and prompting the rep with the next best question?', tag: 'Real-time' },
      { text: 'Your admin uploads MHTML files. What if the system could crawl, monitor, and auto-ingest any knowledge base URL and keep it always current?', tag: 'Auto-Ingest' },
      { text: 'What if every user had their own AI persona that learned their decision-making style and could represent them in meetings they missed?', tag: 'Digital Twin' },
    ],
  },
];

// ── Chat message type ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'persona' | 'user';
  text: string;
  tag?: string;
  persona: string;
  timestamp: Date;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Provocations() {
  const [selectedPersona, setSelectedPersona] = useState(personas[0]);
  const [personaOpen, setPersonaOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState<Record<string, number>>({});

  const getCurrentIndex = (personaId: string) => questionIndex[personaId] || 0;

  const askNextQuestion = (persona: Persona) => {
    const idx = getCurrentIndex(persona.id);
    const q = persona.questions[idx % persona.questions.length];
    setMessages((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        role: 'persona',
        text: q.text,
        tag: q.tag,
        persona: persona.id,
        timestamp: new Date(),
      },
    ]);
    setQuestionIndex((prev) => ({ ...prev, [persona.id]: idx + 1 }));
  };

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setPersonaOpen(false);
    // If no question asked yet for this persona, ask the first one
    const hasAsked = messages.some((m) => m.role === 'persona' && m.persona === persona.id);
    if (!hasAsked) {
      setTimeout(() => askNextQuestion(persona), 200);
    }
  };

  const handleSendReply = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        text: input.trim(),
        persona: selectedPersona.id,
        timestamp: new Date(),
      },
    ]);
    setInput('');
    // Follow up with next question after a brief delay
    setTimeout(() => askNextQuestion(selectedPersona), 600);
  };

  const handleProvoke = () => {
    askNextQuestion(selectedPersona);
  };

  // Start the first question on mount
  useState(() => {
    if (messages.length === 0) {
      setTimeout(() => askNextQuestion(personas[0]), 300);
    }
  });

  // Filter messages for current persona
  const visibleMessages = messages.filter((m) => m.persona === selectedPersona.id);

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Top bar */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--sf-border-light)',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sf-text-primary)', margin: 0 }}>
          Provoke
        </h1>
        <span style={{ fontSize: 12, color: 'var(--sf-text-tertiary)' }}>
          Challenge your thinking with targeted questions
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: persona selector + agenda */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid var(--sf-border-light)',
            background: '#FAFAFF',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Persona picker */}
          <div className="sf-planner-persona-section">
            <button
              className="sf-planner-persona-card"
              onClick={() => setPersonaOpen(!personaOpen)}
            >
              <div className="sf-planner-persona-avatar" style={{ background: selectedPersona.color }}>
                {selectedPersona.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text-primary)' }}>
                  {selectedPersona.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--sf-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedPersona.description}
                </div>
              </div>
              <ChevronDown
                className="w-4 h-4"
                style={{
                  color: 'var(--sf-text-tertiary)',
                  transform: personaOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {personaOpen && (
              <div className="sf-planner-persona-dropdown">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    className={`sf-planner-persona-option ${p.id === selectedPersona.id ? 'active' : ''}`}
                    onClick={() => handleSelectPersona(p)}
                  >
                    <div className="sf-planner-persona-avatar-sm" style={{ background: p.color }}>
                      {p.initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text-primary)' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--sf-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question agenda */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--sf-text-tertiary)', marginBottom: 10, letterSpacing: '0.05em' }}>
              Question Bank
            </div>
            {selectedPersona.questions.map((q, i) => {
              const asked = i < getCurrentIndex(selectedPersona.id);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '6px 0',
                    opacity: asked ? 0.5 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `2px solid ${asked ? '#4BC076' : 'var(--sf-border)'}`,
                      background: asked ? '#4BC076' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {asked && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: '#EEF4FF',
                        color: '#0176D3',
                        marginBottom: 2,
                      }}
                    >
                      {q.tag}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--sf-text-secondary)', lineHeight: 1.35 }}>
                      {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main discussion area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {visibleMessages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--sf-text-tertiary)' }}>
                <Lightbulb className="w-8 h-8 mx-auto mb-3" style={{ opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>Select a persona to start the provocation</p>
              </div>
            )}
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'persona' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div
                      className="sf-planner-persona-avatar-sm"
                      style={{ background: selectedPersona.color }}
                    >
                      {selectedPersona.initials}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sf-text-secondary)' }}>
                      {selectedPersona.label}
                    </span>
                    {msg.tag && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 3,
                          background: '#EEF4FF',
                          color: '#0176D3',
                        }}
                      >
                        {msg.tag}
                      </span>
                    )}
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? '#032D60' : '#F4F6F9',
                    color: msg.role === 'user' ? '#fff' : 'var(--sf-text-primary)',
                    fontSize: 13,
                    lineHeight: 1.55,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: '1px solid var(--sf-border-light)',
              padding: '12px 20px',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: '#FAFBFC',
            }}
          >
            <button
              onClick={handleProvoke}
              title="Next question"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                border: '1px solid var(--sf-border)',
                borderRadius: 6,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: '#6B5CE7',
                whiteSpace: 'nowrap',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Provoke
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder="Type your response..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--sf-border)',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSendReply}
              disabled={!input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                border: 'none',
                background: input.trim() ? '#0176D3' : '#D8DDE6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
