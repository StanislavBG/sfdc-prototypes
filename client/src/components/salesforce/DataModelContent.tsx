import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Database, Mic } from 'lucide-react';

// ── Schema Types ─────────────────────────────────────────────────────
interface Column {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNullable?: boolean;
}

interface Table {
  id: string;
  name: string;
  description: string;
  columns: Column[];
}

interface Relationship {
  from: string; // table id
  fromField: string;
  to: string; // table id
  toField: string;
  label?: string;
}

// ── Mock Schema Data ─────────────────────────────────────────────────
const tables: Table[] = [
  {
    id: 'individuals',
    name: 'individuals',
    description: 'Stores individual records including personal, contact, and demographic details, as well as...',
    columns: [
      { name: 'individual_id', type: 'text', isPrimaryKey: true },
      { name: 'birth_date', type: 'dateTime', isNullable: true },
      { name: 'created_date', type: 'dateTime', isNullable: true },
      { name: 'data_source', type: 'text', isNullable: true },
      { name: 'email_address', type: 'text', isNullable: true },
      { name: 'first_name', type: 'text', isNullable: true },
      { name: 'gender', type: 'text', isNullable: true },
      { name: 'last_modified', type: 'dateTime', isNullable: true },
      { name: 'last_name', type: 'text', isNullable: true },
      { name: 'person_name', type: 'text', isNullable: true },
      { name: 'status', type: 'text', isNullable: true },
    ],
  },
  {
    id: 'contact-point-address',
    name: 'ContactPointAddress',
    description: 'Captures physical location data associated with a specific individual or account.',
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'AddressLine1', type: 'text', isNullable: true },
      { name: 'CityName', type: 'text', isNullable: true },
      { name: 'CountryName', type: 'text', isNullable: true },
      { name: 'GeoLatitude', type: 'number', isNullable: true },
      { name: 'GeoLongitude', type: 'number', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'PostalCode', type: 'text', isNullable: true },
      { name: 'StateProvince', type: 'text', isNullable: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
    ],
  },
  {
    id: 'contact-point-app',
    name: 'ContactPointApp',
    description: "Stores parties' software application installations on specific devices, including activity periods,...",
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
      { name: 'ApplicationLoginId', type: 'text', isNullable: true },
      { name: 'AssetTypeId', type: 'text', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
      { name: 'DataSourceObjectId', type: 'text', isNullable: true },
      // ... many more fields
      ...Array.from({ length: 24 }, (_, i) => ({
        name: `Field_${i + 9}`,
        type: 'text',
        isNullable: true,
      })),
    ],
  },
  {
    id: 'contact-point-digital-id',
    name: 'ContactPointDigitalId',
    description: 'Enables ingesting, harmonizing, and activating various types of digital identifiers (first-party...',
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
      { name: 'DataSourceObjectId', type: 'text', isNullable: true },
      { name: 'DigitalIdType', type: 'text', isNullable: true },
      { name: 'DigitalIdTypeAliasName', type: 'text', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
    ],
  },
  {
    id: 'contact-point-email',
    name: 'ContactPointEmail',
    description: 'Stores the email address, usage, and status for a party, with activity dates, verification, usage...',
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
      { name: 'BestTimeToContactEndTime', type: 'dateTime', isNullable: true },
      { name: 'BestTimeToContactStartTime', type: 'dateTime', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'EmailAddress', type: 'text', isNullable: true },
      { name: 'EmailDomain', type: 'text', isNullable: true },
      { name: 'EmailLocalPart', type: 'text', isNullable: true },
      { name: 'EmailMailBox', type: 'text', isNullable: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
      // ... many more
      ...Array.from({ length: 24 }, (_, i) => ({
        name: `Field_${i + 12}`,
        type: ['text', 'dateTime', 'number', 'boolean'][i % 4],
        isNullable: true,
      })),
    ],
  },
  {
    id: 'contact-point-phone',
    name: 'ContactPointPhone',
    description: 'Captures party phone number details, usage, status, and related data including contact...',
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
      { name: 'AreaCode', type: 'text', isNullable: true },
      { name: 'BestTimeToContactEndTime', type: 'dateTime', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'CountryCode', type: 'text', isNullable: true },
      { name: 'PhoneNumber', type: 'text', isNullable: true },
      { name: 'PhoneType', type: 'text', isNullable: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
      // ... many more
      ...Array.from({ length: 37 }, (_, i) => ({
        name: `Field_${i + 11}`,
        type: ['text', 'dateTime', 'number'][i % 3],
        isNullable: true,
      })),
    ],
  },
  {
    id: 'contact-point-social',
    name: 'ContactPointSocial',
    description: 'Captures the social media handle and persona details for a party, with activity periods, identit...',
    columns: [
      { name: 'Id', type: 'text', isPrimaryKey: true },
      { name: 'ActiveFromDate', type: 'dateTime', isNullable: true },
      { name: 'ActiveToDate', type: 'dateTime', isNullable: true },
      { name: 'BestTimeToContactEndTime', type: 'dateTime', isNullable: true },
      { name: 'BestTimeToContactStartTime', type: 'dateTime', isNullable: true },
      { name: 'PartyId', type: 'text', isForeignKey: true, isNullable: true },
      { name: 'SocialHandle', type: 'text', isNullable: true },
      { name: 'SocialNetwork', type: 'text', isNullable: true },
      { name: 'DataSourceId', type: 'text', isNullable: true },
      // ... many more
      ...Array.from({ length: 22 }, (_, i) => ({
        name: `Field_${i + 10}`,
        type: ['text', 'dateTime'][i % 2],
        isNullable: true,
      })),
    ],
  },
];

const relationships: Relationship[] = [
  { from: 'contact-point-address', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
  { from: 'contact-point-app', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
  { from: 'contact-point-digital-id', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
  { from: 'contact-point-email', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
  { from: 'contact-point-phone', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
  { from: 'contact-point-social', fromField: 'PartyId', to: 'individuals', toField: 'individual_id', label: 'PartyId' },
];

// ── Card positions (grid layout, 3 columns) ─────────────────────────
const CARD_W = 380;
const CARD_GAP_X = 40;
const CARD_GAP_Y = 32;
const GRID_COLS = 3;
const GRID_PAD = 40;

// ── Component ────────────────────────────────────────────────────────
export default function DataModelContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; label?: string }[]>([]);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const toggleExpand = (tableId: string) => {
    setVisibleFields((prev) => ({ ...prev, [tableId]: !prev[tableId] }));
  };

  // Compute relationship lines based on card DOM positions
  const computeLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    const newLines: typeof lines = [];
    for (const rel of relationships) {
      const fromCard = cardRefs.current[rel.from];
      const toCard = cardRefs.current[rel.to];
      if (!fromCard || !toCard) continue;

      const fRect = fromCard.getBoundingClientRect();
      const tRect = toCard.getBoundingClientRect();

      // Find the FK field row inside fromCard for more precise anchoring
      const fkRow = fromCard.querySelector(`[data-field="${rel.fromField}"]`);
      const fkRect = fkRow ? fkRow.getBoundingClientRect() : fRect;

      // Find the PK field row inside toCard
      const pkRow = toCard.querySelector(`[data-field="${rel.toField}"]`);
      const pkRect = pkRow ? pkRow.getBoundingClientRect() : tRect;

      // Determine which side to anchor from/to based on relative position
      const fromCenterX = fRect.left + fRect.width / 2;
      const toCenterX = tRect.left + tRect.width / 2;

      let x1: number, y1: number, x2: number, y2: number;

      if (fromCenterX > toCenterX) {
        // from is to the right of to → connect from's left to to's right
        x1 = fRect.left - cRect.left;
        y1 = (fkRow ? fkRect.top + fkRect.height / 2 : fRect.top + 60) - cRect.top;
        x2 = tRect.right - cRect.left;
        y2 = (pkRow ? pkRect.top + pkRect.height / 2 : tRect.top + 60) - cRect.top;
      } else {
        // from is to the left of or below to → connect from's right to to's left
        x1 = fRect.right - cRect.left;
        y1 = (fkRow ? fkRect.top + fkRect.height / 2 : fRect.top + 60) - cRect.top;
        x2 = tRect.left - cRect.left;
        y2 = (pkRow ? pkRect.top + pkRect.height / 2 : tRect.top + 60) - cRect.top;
      }

      newLines.push({ x1, y1, x2, y2, label: rel.label });
    }
    setLines(newLines);
  }, []);

  useEffect(() => {
    // Recompute after layout settles
    const t = setTimeout(computeLines, 100);
    window.addEventListener('resize', computeLines);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', computeLines);
    };
  }, [computeLines, visibleFields]);

  const VISIBLE_COUNT = 5; // fields shown before "+N more"

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1b2e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 28px', borderBottom: '1px solid #2d2e42' }}>
        <button style={{ background: 'none', border: 'none', color: '#8b8da0', cursor: 'pointer', padding: '4px' }}>
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
        </button>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#2d2e42', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database style={{ width: '20px', height: '20px', color: '#7c8aff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#e8e9f0', fontSize: '18px', fontWeight: 600, margin: 0 }}>Salesforce Data 360</h1>
          <p style={{ color: '#6b6d80', fontSize: '13px', margin: '2px 0 0' }}>{tables.length} tables &nbsp; Mar 11, 2026 6:33 PM</p>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', padding: '4px' }}>
          <Mic style={{ width: '22px', height: '22px' }} />
        </button>
      </div>

      {/* Schema canvas */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'auto', position: 'relative', padding: `${GRID_PAD}px` }}
      >
        {/* SVG relationship lines */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
        >
          <defs>
            <marker id="dm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#5b5d78" />
            </marker>
            <marker id="dm-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
              <circle cx="5" cy="5" r="4" fill="#7c8aff" />
            </marker>
          </defs>
          {lines.map((line, i) => {
            const dx = line.x2 - line.x1;
            const cpOffset = Math.min(Math.abs(dx) * 0.5, 80);
            const cp1x = line.x1 + (dx > 0 ? cpOffset : -cpOffset);
            const cp2x = line.x2 + (dx > 0 ? -cpOffset : cpOffset);
            const path = `M ${line.x1} ${line.y1} C ${cp1x} ${line.y1}, ${cp2x} ${line.y2}, ${line.x2} ${line.y2}`;
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;
            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke="#5b5d78"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  markerStart="url(#dm-dot)"
                  markerEnd="url(#dm-arrow)"
                />
                {line.label && (
                  <g>
                    <rect
                      x={midX - 28}
                      y={midY - 9}
                      width="56"
                      height="18"
                      rx="4"
                      fill="#1a1b2e"
                      stroke="#3d3e52"
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fill="#8b8da0"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {line.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Table cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, ${CARD_W}px)`,
            gap: `${CARD_GAP_Y}px ${CARD_GAP_X}px`,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {tables.map((table) => {
            const expanded = visibleFields[table.id] || false;
            const shownCols = expanded ? table.columns : table.columns.slice(0, VISIBLE_COUNT);
            const remaining = table.columns.length - VISIBLE_COUNT;

            return (
              <div
                key={table.id}
                ref={(el) => { cardRefs.current[table.id] = el; }}
                style={{
                  background: '#22233a',
                  border: '1px solid #2d2e42',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  width: `${CARD_W}px`,
                }}
              >
                {/* Card header */}
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px dashed #2d2e42' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg viewBox="0 0 16 16" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                        <rect x="1" y="1" width="6" height="6" rx="1" fill="#7c8aff" opacity="0.7" />
                        <rect x="9" y="1" width="6" height="6" rx="1" fill="#7c8aff" opacity="0.7" />
                        <rect x="1" y="9" width="6" height="6" rx="1" fill="#7c8aff" opacity="0.7" />
                        <rect x="9" y="9" width="6" height="6" rx="1" fill="#7c8aff" opacity="0.5" />
                      </svg>
                      <span style={{ color: '#e8e9f0', fontSize: '14px', fontWeight: 600 }}>{table.name}</span>
                    </div>
                    <span style={{ background: '#2d2e42', color: '#8b8da0', fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '8px' }}>
                      {table.columns.length} cols
                    </span>
                  </div>
                  <p style={{ color: '#f97316', fontSize: '11px', margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: '1.4' }}>
                    <span style={{ flexShrink: 0, marginTop: '1px' }}>&#9432;</span>
                    <span style={{ fontStyle: 'italic' }}>{table.description}</span>
                  </p>
                </div>

                {/* Column list */}
                <div style={{ padding: '6px 0' }}>
                  {shownCols.map((col) => (
                    <div
                      key={col.name}
                      data-field={col.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 16px',
                        fontSize: '12px',
                      }}
                    >
                      {col.isPrimaryKey ? (
                        <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 700, width: '16px', flexShrink: 0 }}>&#128273;</span>
                      ) : col.isForeignKey ? (
                        <span style={{ color: '#7c8aff', fontSize: '11px', fontWeight: 700, width: '16px', flexShrink: 0 }}>&#128279;</span>
                      ) : (
                        <svg viewBox="0 0 16 16" style={{ width: '12px', height: '12px', flexShrink: 0, marginLeft: '2px' }}>
                          <rect x="1" y="2" width="14" height="3" rx="0.5" fill="#5b5d78" />
                          <rect x="1" y="7" width="14" height="3" rx="0.5" fill="#5b5d78" />
                          <rect x="1" y="12" width="8" height="3" rx="0.5" fill="#5b5d78" />
                        </svg>
                      )}
                      <span style={{ color: '#e8e9f0', fontWeight: col.isPrimaryKey || col.isForeignKey ? 600 : 400, flex: 1 }}>
                        {col.name}
                        {' '}
                        <span style={{ color: '#5b5d78', fontSize: '10px' }}>
                          {col.isNullable ? '\u25CB' : '\u25CF'}
                        </span>
                      </span>
                      <span style={{ color: '#5b5d78', fontSize: '11px', fontFamily: 'monospace', textAlign: 'right' }}>
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expand / collapse */}
                {remaining > 0 && (
                  <button
                    onClick={() => toggleExpand(table.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '6px 16px 10px',
                      background: 'none',
                      border: 'none',
                      color: '#7c8aff',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {expanded ? 'Show less' : `+${remaining} more...`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
