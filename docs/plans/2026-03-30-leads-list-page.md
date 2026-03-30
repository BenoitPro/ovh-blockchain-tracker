# Leads List Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `/lead` stub with a full leads list (cards) + new lead form (modal) + CSV export, accessible only when logged in.

**Architecture:** Single `'use client'` page at `/lead`. Fetches GET `/api/leads` on mount. State machine: `view = 'list' | 'new'`. Detail modal triggered by card click. CSV export runs client-side. The existing POST `/api/leads` and GET `/api/leads` routes are reused as-is, except GET needs an auth guard added.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, `useNetworkTheme` for Eth/Solana theming, existing `verifySession` + `COOKIE_NAME` from `@/lib/auth/session`.

---

### Task 1: Add auth guard to GET /api/leads

**Files:**
- Modify: `src/app/api/leads/route.ts`

Currently GET is public — anyone can enumerate leads. Fix it.

**Step 1: Open the file and read current GET handler**

File: `src/app/api/leads/route.ts` — already read, GET starts at line 42.

**Step 2: Add auth check at top of GET**

Replace the existing GET function with:

```typescript
export async function GET(req: NextRequest) {
  const token = req.cookies.get('ovh_session')?.value ?? '';
  if (!verifySession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getDatabase();
    const result = await db.execute(
      'SELECT id, last_name, first_name, email, organization, legal_form, country, job_title, evaluation, mobile_phone, interested_by, products_solutions, description, donotphone, donotbulkemail, created_at FROM leads ORDER BY created_at DESC'
    );
    return NextResponse.json({ leads: result.rows });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Note: also add `mobile_phone, interested_by, products_solutions, description, donotphone, donotbulkemail` to the SELECT so the detail modal has all fields.

Add the import at the top of the file:
```typescript
import { verifySession, COOKIE_NAME } from '@/lib/auth/session';
```

**Step 3: Verify no build error**

```bash
cd ovh-blockchain-tracker && npm run lint
```

Expected: no errors on `src/app/api/leads/route.ts`.

**Step 4: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "feat(leads): auth guard on GET /api/leads"
```

---

### Task 2: Rewrite /lead page — list view + new lead form toggle

**Files:**
- Rewrite: `src/app/lead/page.tsx`

**Step 1: Understand the current file**

Current file is ~270 lines with form logic. We keep all the form logic (state, handlers, submit) and wrap it in a view toggle.

**Step 2: Write the full new page**

Replace entire `src/app/lead/page.tsx` with:

```typescript
'use client';

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

// ── Constants ──────────────────────────────────────────────────────────
const LEGAL_FORMS = ['Public Sector', 'Organization', 'Association', 'Particular', 'Other'];
const EVALUATIONS = ['Hot', 'Warm', 'Cold'];

const ALL_COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
  'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus',
  'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador',
  'Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini',
  'Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany',
  'Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya',
  'Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
  'Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro',
  'Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea',
  'Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','São Tomé and Príncipe','Saudi Arabia','Senegal','Serbia',
  'Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands',
  'Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka',
  'Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago',
  'Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

// ── Types ───────────────────────────────────────────────────────────────
interface Lead {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  organization: string;
  legal_form: string;
  country: string;
  job_title: string | null;
  evaluation: string | null;
  mobile_phone: string | null;
  interested_by: string | null;
  products_solutions: string | null;
  description: string | null;
  donotphone: number;
  donotbulkemail: number;
  created_at: string;
}

// ── Searchable Country Dropdown ─────────────────────────────────────────
function CountrySelect({ value, onChange, inputClass, accent, isEth }: {
  value: string; onChange: (v: string) => void;
  inputClass: string; accent: string; isEth: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length === 0
    ? ALL_COUNTRIES
    : ALL_COUNTRIES.filter(c => c.toLowerCase().startsWith(query.toLowerCase()));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function select(country: string) {
    onChange(country);
    setQuery('');
    setOpen(false);
  }

  const dropdownBg = isEth ? 'bg-white border-[#627EEA]/20' : 'bg-[#0d1117] border-white/10';
  const dropdownItem = isEth ? 'text-slate-700 hover:bg-[#627EEA]/08 cursor-pointer' : 'text-white/80 hover:bg-white/6 cursor-pointer';
  const dropdownSelected = isEth ? 'bg-[#627EEA]/10 text-[#627EEA]' : 'bg-white/8 text-[#00F0FF]';

  return (
    <div ref={ref} className="relative">
      <div className={`${inputClass} flex items-center justify-between cursor-pointer`} onClick={() => setOpen(o => !o)}>
        {open ? (
          <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Type to search…" className="bg-transparent outline-none w-full text-sm"
            style={{ color: isEth ? '#334155' : 'white' }} onClick={e => e.stopPropagation()} />
        ) : (
          <span className={value ? (isEth ? 'text-slate-700' : 'text-white') : (isEth ? 'text-slate-400' : 'text-white/25')}>
            {value || 'Select…'}
          </span>
        )}
        <svg className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke={isEth ? '#94a3b8' : 'rgba(255,255,255,0.3)'} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden ${dropdownBg}`}>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <div className={`px-4 py-3 text-xs ${isEth ? 'text-slate-400' : 'text-white/30'}`}>No results</div>
              : filtered.map(c => (
                  <div key={c} className={`px-4 py-2.5 text-sm transition-colors ${c === value ? dropdownSelected : dropdownItem}`}
                    onMouseDown={() => select(c)}>{c}</div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Eval colors ─────────────────────────────────────────────────────────
const EVAL_COLORS: Record<string, { bg: string; text: string }> = {
  Hot:  { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
  Warm: { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
  Cold: { bg: 'rgba(99,102,241,0.15)', text: '#6366f1' },
};

function EvalPill({ value }: { value: string | null }) {
  if (!value) return null;
  const c = EVAL_COLORS[value] ?? { bg: 'rgba(255,255,255,0.1)', text: 'rgba(255,255,255,0.5)' };
  return (
    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.text }}>
      {value}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── CSV export ──────────────────────────────────────────────────────────
function exportCSV(leads: Lead[]) {
  const headers = ['ID','Last Name','First Name','Email','Organization','Business Type','Country',
    'Job Title','Evaluation','Mobile Phone','Interested In','Products & Solutions','Notes',
    'Do Not Call','Do Not Bulk Email','Created At'];
  const rows = leads.map(l => [
    l.id, l.last_name, l.first_name, l.email, l.organization, l.legal_form, l.country,
    l.job_title ?? '', l.evaluation ?? '', l.mobile_phone ?? '',
    l.interested_by ?? '', l.products_solutions ?? '', l.description ?? '',
    l.donotphone ? 'Yes' : 'No', l.donotbulkemail ? 'Yes' : 'No',
    l.created_at,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Detail Modal ─────────────────────────────────────────────────────────
function LeadModal({ lead, onClose, accent, isEth }: {
  lead: Lead; onClose: () => void; accent: string; isEth: boolean;
}) {
  const labelClass = isEth ? 'text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5' : 'text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5';
  const valueClass = isEth ? 'text-sm text-slate-700' : 'text-sm text-white/80';
  const divider = isEth ? 'border-[#627EEA]/10' : 'border-white/8';

  function Field({ label, value }: { label: string; value: string | null | number | undefined }) {
    if (!value && value !== 0) return null;
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <p className={valueClass}>{String(value)}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto ${
          isEth ? 'bg-white shadow-2xl' : 'bg-[#0d1117] border border-white/10'
        }`}
        style={{ boxShadow: `0 0 60px ${accent}20` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 flex items-center justify-between px-5 py-4 border-b ${divider} ${isEth ? 'bg-white' : 'bg-[#0d1117]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
              style={{ background: `${accent}18`, color: accent }}>
              {lead.first_name[0]}{lead.last_name[0]}
            </div>
            <div>
              <p className={`font-black text-sm ${isEth ? 'text-slate-800' : 'text-white'}`}>
                {lead.first_name} {lead.last_name}
              </p>
              <p className={`text-xs ${isEth ? 'text-slate-400' : 'text-white/40'}`}>{lead.organization}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <EvalPill value={lead.evaluation} />
            <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isEth ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/8 text-white/30'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Email" value={lead.email} /></div>
          <Field label="Business Type" value={lead.legal_form} />
          <Field label="Country" value={lead.country} />
          <Field label="Job Title" value={lead.job_title} />
          <Field label="Mobile Phone" value={lead.mobile_phone} />
          <div className="col-span-2"><Field label="Interested In" value={lead.interested_by} /></div>
          <div className="col-span-2"><Field label="Products & Solutions" value={lead.products_solutions} /></div>
          {lead.description && (
            <div className={`col-span-2 rounded-xl p-3 ${isEth ? 'bg-slate-50' : 'bg-white/4'}`}>
              <p className={labelClass}>Notes</p>
              <p className={`text-sm mt-1 ${isEth ? 'text-slate-600' : 'text-white/60'}`}>{lead.description}</p>
            </div>
          )}
          <div className={`col-span-2 pt-2 border-t ${divider}`}>
            <p className={`text-xs ${isEth ? 'text-slate-400' : 'text-white/30'}`}>
              Created {timeAgo(lead.created_at)} · {new Date(lead.created_at).toLocaleString('en-GB')}
            </p>
            {(lead.donotphone || lead.donotbulkemail) && (
              <p className="text-xs text-orange-400 mt-1">
                {[lead.donotphone && '⚠ Do not call', lead.donotbulkemail && '⚠ No bulk email'].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lead Card ────────────────────────────────────────────────────────────
function LeadCard({ lead, onClick, accent, isEth }: {
  lead: Lead; onClick: () => void; accent: string; isEth: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-200 ${
        isEth
          ? 'bg-white/60 border border-[#627EEA]/15 hover:bg-white/80 hover:border-[#627EEA]/30 hover:shadow-md'
          : 'bg-white/[0.03] border border-white/8 hover:bg-white/6 hover:border-white/15'
      }`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
          style={{ background: `${accent}18`, color: accent }}>
          {lead.first_name[0]}{lead.last_name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-black text-sm truncate ${isEth ? 'text-slate-800' : 'text-white'}`}>
              {lead.first_name} {lead.last_name}
            </p>
            <EvalPill value={lead.evaluation} />
          </div>
          <p className={`text-xs truncate mt-0.5 ${isEth ? 'text-slate-500' : 'text-white/50'}`}>
            {lead.organization}
            {lead.job_title && <span className={isEth ? 'text-slate-400' : 'text-white/30'}> · {lead.job_title}</span>}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className={`text-[10px] ${isEth ? 'text-slate-400' : 'text-white/30'}`}>{lead.country}</p>
            <p className={`text-[10px] ${isEth ? 'text-slate-300' : 'text-white/20'}`}>{timeAgo(lead.created_at)}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 shrink-0 mt-1 ${isEth ? 'text-slate-300' : 'text-white/20'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ── New Lead Form ────────────────────────────────────────────────────────
function NewLeadForm({ onSuccess, onCancel, accent, isEth }: {
  onSuccess: () => void; onCancel: () => void; accent: string; isEth: boolean;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    last_name: '', first_name: '', email: '', organization: '',
    legal_form: '', country: '', evaluation: '',
    donotphone: false, donotbulkemail: false,
    target_owner: '', description: '',
    mobile_phone: '', job_title: '', interested_by: '', products_solutions: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, photo }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Server error');
      } else {
        onSuccess();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = isEth
    ? 'w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none bg-white/70 border text-slate-700 placeholder-slate-400'
    : 'w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none bg-white/5 border text-white placeholder-white/25';
  const inputRequired = isEth
    ? `${inputBase} border-[#627EEA]/40 focus:border-[#627EEA]/70 focus:bg-white/90`
    : `${inputBase} border-[#00F0FF]/30 focus:border-[#00F0FF]/70`;
  const inputOptional = isEth
    ? `${inputBase} border-slate-200 focus:border-[#627EEA]/50 focus:bg-white/90`
    : `${inputBase} border-white/10 focus:border-white/30`;
  const labelClass = isEth
    ? 'block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5'
    : 'block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5';
  const selectOptionBg = isEth ? 'bg-white' : 'bg-[#0a0e1a]';
  const dividerColor = isEth ? 'border-[#627EEA]/12' : 'border-white/8';
  const requiredDot = <span style={{ color: accent }} className="ml-0.5">*</span>;

  const evalColors: Record<string, { active: string; glow: string }> = {
    Hot:  { active: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
    Warm: { active: '#f97316', glow: 'rgba(249,115,22,0.25)' },
    Cold: { active: accent,   glow: `${accent}40` },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Last Name {requiredDot}</label>
          <input type="text" required placeholder="Smith" value={form.last_name}
            onChange={e => set('last_name', e.target.value)} className={inputRequired} />
        </div>
        <div>
          <label className={labelClass}>First Name {requiredDot}</label>
          <input type="text" required placeholder="John" value={form.first_name}
            onChange={e => set('first_name', e.target.value)} className={inputRequired} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email {requiredDot}</label>
        <input type="email" required placeholder="john.smith@example.com" value={form.email}
          onChange={e => set('email', e.target.value)} className={inputRequired} />
      </div>

      <div>
        <label className={labelClass}>Organization {requiredDot}</label>
        <input type="text" required placeholder="Company name" value={form.organization}
          onChange={e => set('organization', e.target.value)} className={inputRequired} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Business Type {requiredDot}</label>
          <select required value={form.legal_form} onChange={e => set('legal_form', e.target.value)}
            className={inputRequired + ' cursor-pointer'}>
            <option value="" disabled className={selectOptionBg}>-- Select --</option>
            {LEGAL_FORMS.map(f => <option key={f} value={f} className={selectOptionBg}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Country {requiredDot}</label>
          <CountrySelect value={form.country} onChange={v => set('country', v)}
            inputClass={inputRequired} accent={accent} isEth={isEth} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Evaluation {requiredDot}</label>
        <div className="flex gap-2">
          {EVALUATIONS.map(ev => {
            const { active, glow } = evalColors[ev];
            const isActive = form.evaluation === ev;
            return (
              <button key={ev} type="button" onClick={() => set('evaluation', ev)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={isActive
                  ? { background: active, color: '#fff', boxShadow: `0 0 16px ${glow}` }
                  : {
                      background: isEth ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.04)',
                      color: isEth ? '#94a3b8' : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${isEth ? 'rgba(203,213,225,0.8)' : 'rgba(255,255,255,0.08)'}`,
                    }
                }
              >{ev}</button>
            );
          })}
        </div>
        <input type="text" required value={form.evaluation} onChange={() => {}}
          className="opacity-0 h-0 w-0 absolute" tabIndex={-1} />
      </div>

      <div>
        <label className={labelClass}>Photo</label>
        <div onClick={() => photoInputRef.current?.click()}
          className={`w-full rounded-xl px-4 py-4 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
            isEth
              ? 'border border-slate-200 bg-white/60 hover:border-[#627EEA]/40 hover:bg-white/80'
              : 'border border-white/10 hover:border-white/25 hover:bg-white/5'
          }`}>
          {photo ? (
            <>
              <img src={photo} alt="preview" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <p className={`text-sm truncate ${isEth ? 'text-slate-600' : 'text-white/70'}`}>{photoName}</p>
                <p className={`text-xs mt-0.5 ${isEth ? 'text-slate-400' : 'text-white/30'}`}>Tap to change</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accent}0f`, border: `1px dashed ${accent}40` }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${isEth ? 'text-slate-600' : 'text-white/50'}`}>Add a photo</p>
                <p className={`text-xs mt-0.5 ${isEth ? 'text-slate-400' : 'text-white/25'}`}>Gallery or camera</p>
              </div>
            </>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      </div>

      <div className={`rounded-xl overflow-hidden border ${dividerColor}`}>
        <button type="button" onClick={() => setOptionalOpen(o => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
            isEth ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white/60'
          }`}>
          <span className="text-[10px] font-black uppercase tracking-widest">Optional fields</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${optionalOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {optionalOpen && (
          <div className={`px-4 pb-5 space-y-4 border-t ${dividerColor} pt-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Mobile Phone</label>
                <input type="tel" placeholder="+1 555 000 0000" value={form.mobile_phone}
                  onChange={e => set('mobile_phone', e.target.value)} className={inputOptional} />
              </div>
              <div>
                <label className={labelClass}>Job Title</label>
                <input type="text" placeholder="CEO, CTO…" value={form.job_title}
                  onChange={e => set('job_title', e.target.value)} className={inputOptional} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Target Owner</label>
              <input type="text" placeholder="Owner name" value={form.target_owner}
                onChange={e => set('target_owner', e.target.value)} className={inputOptional} />
            </div>
            <div>
              <label className={labelClass}>Interested In</label>
              <input type="text" placeholder="e.g. Cloud, Blockchain…" value={form.interested_by}
                onChange={e => set('interested_by', e.target.value)} className={inputOptional} />
            </div>
            <div>
              <label className={labelClass}>Products & Solutions</label>
              <input type="text" placeholder="e.g. OVHcloud Bare Metal…" value={form.products_solutions}
                onChange={e => set('products_solutions', e.target.value)} className={inputOptional} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea placeholder="Context, additional information…" value={form.description}
                onChange={e => set('description', e.target.value)} rows={3}
                className={inputOptional + ' resize-none'} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { field: 'donotphone', label: 'Do not call', val: form.donotphone },
                { field: 'donotbulkemail', label: 'Do not bulk email', val: form.donotbulkemail },
              ].map(({ field, label, val }) => (
                <label key={field} className="flex items-center gap-2.5 cursor-pointer group">
                  <div onClick={() => set(field, !val)}
                    className={`w-4 h-4 rounded flex items-center justify-center transition-all border ${
                      val
                        ? isEth ? 'border-[#627EEA]/60 bg-[#627EEA]/15' : 'border-[#00F0FF]/60 bg-[#00F0FF]/15'
                        : isEth ? 'border-slate-300 bg-white/60' : 'border-white/20'
                    }`}>
                    {val && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs transition-colors ${isEth ? 'text-slate-500 group-hover:text-slate-700' : 'text-white/40 group-hover:text-white/60'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className={`text-xs text-center ${isEth ? 'text-red-500' : 'text-red-400/80'}`}>{error}</p>}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className={`flex-1 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
            isEth
              ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/8'
          }`}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
          style={{
            background: loading ? `${accent}80` : accent,
            color: isEth ? '#fff' : '#000',
            boxShadow: loading ? 'none' : `0 0 24px ${accent}40`,
          }}>
          {loading ? 'Saving…' : 'Create Lead'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────
export default function LeadPage() {
  const { theme } = useNetworkTheme();
  const isEth = theme === 'ethereum';
  const accent = isEth ? '#627EEA' : '#00F0FF';

  const [view, setView] = useState<'list' | 'new'>('list');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  async function fetchLeads() {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } finally {
      setLoadingLeads(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  function handleNewSuccess() {
    setView('list');
    fetchLeads();
  }

  const titleColor = isEth ? 'text-slate-800' : 'text-white';
  const subtitleColor = isEth ? 'text-slate-400' : 'text-white/30';
  const emptyColor = isEth ? 'text-slate-400' : 'text-white/30';

  return (
    <div className="min-h-screen py-8 px-4 sm:py-10">
      <div className="max-w-xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}>
              Internal
            </span>
            <h1 className={`text-2xl font-black uppercase tracking-widest mt-3 ${titleColor}`}>
              {view === 'list' ? 'Leads' : 'New Lead'}
            </h1>
            {view === 'list' && (
              <p className={`text-xs mt-1 ${subtitleColor}`}>
                {loadingLeads ? 'Loading…' : `${leads.length} lead${leads.length !== 1 ? 's' : ''} recorded`}
              </p>
            )}
            {view === 'new' && (
              <p className={`text-xs mt-1 ${subtitleColor}`}>
                Fields marked <span style={{ color: accent }}>*</span> are required
              </p>
            )}
          </div>

          {view === 'list' && (
            <div className="flex items-center gap-2 mt-1 shrink-0">
              {leads.length > 0 && (
                <button onClick={() => exportCSV(leads)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isEth
                      ? 'bg-white/60 border border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                      : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
              )}
              <button onClick={() => setView('new')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-black transition-all"
                style={{ background: accent, boxShadow: `0 0 16px ${accent}40` }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {view === 'new' ? (
          <NewLeadForm
            onSuccess={handleNewSuccess}
            onCancel={() => setView('list')}
            accent={accent}
            isEth={isEth}
          />
        ) : loadingLeads ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className={`h-20 rounded-2xl animate-pulse ${isEth ? 'bg-slate-100' : 'bg-white/5'}`} />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className={`text-center py-20 ${emptyColor}`}>
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium">No leads yet</p>
            <p className="text-xs mt-1 opacity-60">Tap "New" to add your first lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} accent={accent} isEth={isEth} />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} accent={accent} isEth={isEth} />
      )}
    </div>
  );
}
```

**Step 3: Lint check**

```bash
cd ovh-blockchain-tracker && npm run lint
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/app/lead/page.tsx
git commit -m "feat(leads): list view, detail modal, CSV export, new lead form"
```

---

### Task 3: Secure GET /api/leads — fix missing import

**Files:**
- Modify: `src/app/api/leads/route.ts`

The full updated file with auth guard on GET:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/database';
import { verifySession, COOKIE_NAME } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      last_name, first_name, email, organization, legal_form, country,
      photo, donotphone, donotbulkemail, target_owner, evaluation,
      description, mobile_phone, job_title, interested_by, products_solutions,
    } = body;

    if (!last_name || !first_name || !email || !organization || !legal_form || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDatabase();
    const result = await db.execute({
      sql: `INSERT INTO leads
        (last_name, first_name, email, organization, legal_form, country, photo,
         donotphone, donotbulkemail, target_owner, evaluation, description,
         mobile_phone, job_title, interested_by, products_solutions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        last_name, first_name, email, organization, legal_form, country,
        photo ?? null,
        donotphone ? 1 : 0, donotbulkemail ? 1 : 0,
        target_owner ?? null, evaluation ?? null, description ?? null,
        mobile_phone ?? null, job_title ?? null, interested_by ?? null, products_solutions ?? null,
      ],
    });

    return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value ?? '';
  if (!verifySession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getDatabase();
    const result = await db.execute(
      `SELECT id, last_name, first_name, email, organization, legal_form, country,
       job_title, evaluation, mobile_phone, interested_by, products_solutions,
       description, donotphone, donotbulkemail, created_at
       FROM leads ORDER BY created_at DESC`
    );
    return NextResponse.json({ leads: result.rows });
  } catch (error) {
    console.error('[Leads API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Step 1: Apply the change**

Replace the full content of `src/app/api/leads/route.ts` with the code above.

**Step 2: Lint**

```bash
npm run lint
```

**Step 3: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "fix(leads): auth guard on GET, expose all fields for detail modal"
```

---

### Task 4: Manual smoke test checklist

**Test on desktop (Solana dark theme):**
- [ ] Navigate to `/lead` — list appears, skeleton then cards (or empty state)
- [ ] Click "New" — form slides in, Cancel returns to list
- [ ] Create a lead — form resets, list reloads, new card appears at top
- [ ] Click a card — detail modal opens with all fields
- [ ] Click outside modal — closes
- [ ] Click "CSV" — file `leads_2026-XX-XX.csv` downloads, open in Excel, verify columns

**Test on mobile (iOS, Ethereum light theme):**
- [ ] Grid collapses to single column on form
- [ ] Country dropdown opens, type first letter to filter
- [ ] Photo button opens native iOS sheet (Take Photo / Choose from Library)
- [ ] Eval pills are tappable and full-width
- [ ] Modal opens from bottom on mobile, scrollable

**Test auth:**
- [ ] Open incognito, go to `/api/leads` directly — should return `{"error":"Unauthorized"}`

**Step: Commit if any small fixes needed**

```bash
git add -A && git commit -m "fix(leads): smoke test fixes"
```
