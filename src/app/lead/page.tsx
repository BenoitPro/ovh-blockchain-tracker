'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGAL_FORMS = ['Public Sector', 'Organization', 'Association', 'Particular', 'Other'];
const EVALUATIONS = ['Hot', 'Warm', 'Cold'];

const ALL_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
  'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho',
  'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
  'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function exportCSV(leads: Lead[]) {
  const headers = [
    'ID', 'Last Name', 'First Name', 'Email', 'Organization',
    'Business Type', 'Country', 'Job Title', 'Evaluation',
    'Mobile Phone', 'Interested In', 'Products & Solutions',
    'Notes', 'Do Not Call', 'Do Not Bulk Email', 'Created At',
  ];
  const rows = leads.map(l => [
    l.id,
    l.last_name,
    l.first_name,
    l.email,
    l.organization,
    l.legal_form,
    l.country,
    l.job_title ?? '',
    l.evaluation ?? '',
    l.mobile_phone ?? '',
    l.interested_by ?? '',
    l.products_solutions ?? '',
    l.description ?? '',
    l.donotphone ? 'Yes' : 'No',
    l.donotbulkemail ? 'Yes' : 'No',
    l.created_at,
  ]);

  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `leads_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── EvalPill ─────────────────────────────────────────────────────────────────

function EvalPill({ value, accent }: { value: string | null; accent: string }) {
  if (!value) return null;
  const color =
    value === 'Hot' ? '#ef4444' :
    value === 'Warm' ? '#f97316' :
    accent;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {value}
    </span>
  );
}

// ─── CountrySelect ────────────────────────────────────────────────────────────

function CountrySelect({
  value, onChange, inputClass, isEth,
}: {
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
  accent: string;
  isEth: boolean;
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
  const dropdownItem = isEth
    ? 'text-slate-700 hover:bg-blue-50 cursor-pointer'
    : 'text-white/80 hover:bg-white/6 cursor-pointer';
  const dropdownSelected = isEth ? 'bg-[#627EEA]/10 text-[#627EEA]' : 'bg-white/8 text-[#00F0FF]';

  return (
    <div ref={ref} className="relative">
      <div
        className={`${inputClass} flex items-center justify-between cursor-pointer`}
        onClick={() => setOpen(o => !o)}
      >
        {open ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="bg-transparent outline-none w-full text-sm"
            style={{ color: isEth ? '#334155' : 'white' }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={value ? (isEth ? 'text-slate-700' : 'text-white') : (isEth ? 'text-slate-400' : 'text-white/25')}>
            {value || 'Select…'}
          </span>
        )}
        <svg
          className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24"
          stroke={isEth ? '#94a3b8' : 'rgba(255,255,255,0.3)'}
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-xl border shadow-xl overflow-hidden ${dropdownBg}`}>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className={`px-4 py-3 text-xs ${isEth ? 'text-slate-400' : 'text-white/30'}`}>No results</div>
            ) : (
              filtered.map(c => (
                <div
                  key={c}
                  className={`px-4 py-2.5 text-sm transition-colors ${c === value ? dropdownSelected : dropdownItem}`}
                  onMouseDown={() => select(c)}
                >
                  {c}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function SkeletonCard({ isEth }: { isEth: boolean }) {
  const base = isEth ? 'bg-slate-200/70' : 'bg-white/10';
  const card = isEth ? 'bg-white/60 border-slate-200' : 'bg-white/4 border-white/8';
  return (
    <div className={`rounded-2xl border p-4 animate-pulse ${card}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full shrink-0 ${base}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded-full w-1/3 ${base}`} />
          <div className={`h-2.5 rounded-full w-1/2 ${base}`} />
        </div>
        <div className={`h-5 w-12 rounded-full ${base}`} />
      </div>
      <div className={`mt-3 h-2 rounded-full w-2/3 ${base}`} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ accent, isEth }: { accent: string; isEth: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${accent}12`, border: `1px dashed ${accent}40` }}
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className={`text-sm font-semibold ${isEth ? 'text-slate-600' : 'text-white/60'}`}>No leads yet</p>
      <p className={`text-xs mt-1 ${isEth ? 'text-slate-400' : 'text-white/30'}`}>
        Click &ldquo;+ New&rdquo; to add your first lead
      </p>
    </div>
  );
}

// ─── LeadCard ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead, onClick, accent, isEth,
}: {
  lead: Lead;
  onClick: () => void;
  accent: string;
  isEth: boolean;
}) {
  const initials =
    (lead.first_name?.[0] ?? '').toUpperCase() +
    (lead.last_name?.[0] ?? '').toUpperCase();

  const card = isEth
    ? 'bg-white/70 border-slate-200 hover:border-[#627EEA]/40 hover:bg-white/90'
    : 'bg-white/4 border-white/8 hover:border-white/20 hover:bg-white/8';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 cursor-pointer ${card}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
          style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
        >
          {initials || '?'}
        </div>

        {/* Name + org */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${isEth ? 'text-slate-800' : 'text-white'}`}>
            {lead.first_name} {lead.last_name}
          </p>
          <p className={`text-xs truncate ${isEth ? 'text-slate-500' : 'text-white/40'}`}>
            {lead.organization}
          </p>
        </div>

        {/* Eval pill */}
        {lead.evaluation && <EvalPill value={lead.evaluation} accent={accent} />}

        {/* Chevron */}
        <svg className={`w-4 h-4 shrink-0 ${isEth ? 'text-slate-300' : 'text-white/20'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Footer */}
      <div className={`mt-2.5 flex items-center gap-3 text-[11px] ${isEth ? 'text-slate-400' : 'text-white/30'}`}>
        {lead.job_title && (
          <span className="truncate max-w-[40%]">{lead.job_title}</span>
        )}
        {lead.job_title && lead.country && <span className="opacity-40">·</span>}
        {lead.country && <span className="truncate">{lead.country}</span>}
        <span className="ml-auto shrink-0">{timeAgo(lead.created_at)}</span>
      </div>
    </button>
  );
}

// ─── ModalField (used by LeadModal) ──────────────────────────────────────────

function ModalField({
  l, v, labelClass, valueClass,
}: {
  l: string;
  v: string | number | null | undefined;
  labelClass: string;
  valueClass: string;
}) {
  if (!v && v !== 0) return null;
  return (
    <div>
      <p className={labelClass}>{l}</p>
      <p className={`${valueClass} mt-0.5`}>{String(v)}</p>
    </div>
  );
}

// ─── LeadModal ────────────────────────────────────────────────────────────────

function LeadModal({
  lead, onClose, accent, isEth,
}: {
  lead: Lead;
  onClose: () => void;
  accent: string;
  isEth: boolean;
}) {
  const initials =
    (lead.first_name?.[0] ?? '').toUpperCase() +
    (lead.last_name?.[0] ?? '').toUpperCase();

  const card = isEth
    ? 'bg-white border-slate-200'
    : 'bg-[#0d1117] border-white/10';

  const label = isEth
    ? 'text-[10px] font-bold uppercase tracking-widest text-slate-400'
    : 'text-[10px] font-bold uppercase tracking-widest text-white/30';

  const value = isEth
    ? 'text-sm text-slate-700'
    : 'text-sm text-white/80';

  const divider = isEth ? 'border-slate-100' : 'border-white/6';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border shadow-2xl max-h-[90vh] flex flex-col ${card}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className={`flex items-center gap-3 px-5 py-4 border-b ${divider} shrink-0`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
            style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}
          >
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${isEth ? 'text-slate-800' : 'text-white'}`}>
              {lead.first_name} {lead.last_name}
            </p>
            <p className={`text-xs truncate ${isEth ? 'text-slate-400' : 'text-white/40'}`}>
              {lead.organization}
            </p>
          </div>
          {lead.evaluation && <EvalPill value={lead.evaluation} accent={accent} />}
          <button
            type="button"
            onClick={onClose}
            className={`ml-2 p-1.5 rounded-lg transition-colors ${isEth ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/8 text-white/30'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-5 space-y-5">

          {/* Warnings */}
          {(lead.donotphone === 1 || lead.donotbulkemail === 1) && (
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-3 text-xs font-semibold"
              style={{ background: '#ef444415', border: '1px solid #ef444430' }}
            >
              {lead.donotphone === 1 && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Do not call
                </span>
              )}
              {lead.donotbulkemail === 1 && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Do not bulk email
                </span>
              )}
            </div>
          )}

          {/* Grid of fields */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <ModalField l="Email" v={lead.email} labelClass={label} valueClass={value} />
            <ModalField l="Mobile Phone" v={lead.mobile_phone} labelClass={label} valueClass={value} />
            <ModalField l="Business Type" v={lead.legal_form} labelClass={label} valueClass={value} />
            <ModalField l="Country" v={lead.country} labelClass={label} valueClass={value} />
            <ModalField l="Job Title" v={lead.job_title} labelClass={label} valueClass={value} />
            <ModalField l="Interested In" v={lead.interested_by} labelClass={label} valueClass={value} />
          </div>

          {lead.products_solutions && (
            <div>
              <p className={label}>Products &amp; Solutions</p>
              <p className={`${value} mt-0.5`}>{lead.products_solutions}</p>
            </div>
          )}

          {lead.description && (
            <div>
              <p className={label}>Notes</p>
              <p className={`${value} mt-0.5 whitespace-pre-wrap`}>{lead.description}</p>
            </div>
          )}

          <div>
            <p className={label}>Created</p>
            <p className={`${value} mt-0.5`}>
              {new Date(lead.created_at).toLocaleString()} &mdash; {timeAgo(lead.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NewLeadForm ──────────────────────────────────────────────────────────────

const BLANK_FORM = {
  last_name: '', first_name: '', email: '', organization: '',
  legal_form: '', country: '', evaluation: '',
  donotphone: false, donotbulkemail: false,
  target_owner: '', description: '',
  mobile_phone: '', job_title: '', interested_by: '', products_solutions: '',
};

function NewLeadForm({
  onCancel,
  onSuccess,
  accent,
  isEth,
}: {
  onCancel: () => void;
  onSuccess: () => void;
  accent: string;
  isEth: boolean;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(BLANK_FORM);
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

  // ── Style helpers
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

  const optionalToggleClass = isEth
    ? 'text-slate-400 hover:text-slate-600'
    : 'text-white/40 hover:text-white/60';

  const checkboxBase = (checked: boolean) => isEth
    ? `w-4 h-4 rounded flex items-center justify-center transition-all border ${checked ? 'border-[#627EEA]/60 bg-[#627EEA]/15' : 'border-slate-300 bg-white/60'}`
    : `w-4 h-4 rounded flex items-center justify-center transition-all border ${checked ? 'border-[#00F0FF]/60 bg-[#00F0FF]/15' : 'border-white/20'}`;

  const checkboxLabelClass = isEth
    ? 'text-slate-500 text-xs group-hover:text-slate-700 transition-colors'
    : 'text-white/40 text-xs group-hover:text-white/60 transition-colors';

  const requiredDot = <span style={{ color: accent }} className="ml-0.5">*</span>;

  const evalColors: Record<string, { active: string; glow: string }> = {
    Hot:  { active: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
    Warm: { active: '#f97316', glow: 'rgba(249,115,22,0.25)' },
    Cold: { active: accent,   glow: `${accent}40` },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── First / Last name */}
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

      {/* ── Email */}
      <div>
        <label className={labelClass}>Email {requiredDot}</label>
        <input type="email" required placeholder="john.smith@example.com" value={form.email}
          onChange={e => set('email', e.target.value)} className={inputRequired} />
      </div>

      {/* ── Organization */}
      <div>
        <label className={labelClass}>Organization {requiredDot}</label>
        <input type="text" required placeholder="Company name" value={form.organization}
          onChange={e => set('organization', e.target.value)} className={inputRequired} />
      </div>

      {/* ── Legal form / Country */}
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
          <CountrySelect
            value={form.country}
            onChange={v => set('country', v)}
            inputClass={inputRequired}
            accent={accent}
            isEth={isEth}
          />
        </div>
      </div>

      {/* ── Evaluation */}
      <div>
        <label className={labelClass}>Evaluation {requiredDot}</label>
        <div className="flex gap-2">
          {EVALUATIONS.map(ev => {
            const { active, glow } = evalColors[ev];
            const isActive = form.evaluation === ev;
            return (
              <button
                key={ev}
                type="button"
                onClick={() => set('evaluation', ev)}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
                style={isActive
                  ? { background: active, color: '#fff', boxShadow: `0 0 16px ${glow}` }
                  : {
                      background: isEth ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.04)',
                      color: isEth ? '#94a3b8' : 'rgba(255,255,255,0.3)',
                      border: `1px solid ${isEth ? 'rgba(203,213,225,0.8)' : 'rgba(255,255,255,0.08)'}`,
                    }
                }
              >
                {ev}
              </button>
            );
          })}
        </div>
        {/* Hidden required input to enforce browser validation */}
        <input
          type="text"
          required
          value={form.evaluation}
          onChange={() => {}}
          className="opacity-0 h-0 w-0 absolute"
          tabIndex={-1}
        />
      </div>

      {/* ── Photo */}
      <div>
        <label className={labelClass}>Photo</label>
        <div
          onClick={() => photoInputRef.current?.click()}
          className={`w-full rounded-xl px-4 py-4 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
            isEth
              ? 'border border-slate-200 bg-white/60 hover:border-[#627EEA]/40 hover:bg-white/80'
              : 'border border-white/10 hover:border-white/25 hover:bg-white/5'
          }`}
        >
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${isEth ? 'text-slate-600' : 'text-white/50'}`}>Add a photo</p>
                <p className={`text-xs mt-0.5 ${isEth ? 'text-slate-400' : 'text-white/25'}`}>Gallery or camera</p>
              </div>
            </>
          )}
        </div>
        {/* No capture attr → iOS shows native sheet: Take Photo / Choose from Library */}
        <input ref={photoInputRef} type="file" accept="image/*"
          onChange={handlePhoto} className="hidden" />
      </div>

      {/* ── Optional fields */}
      <div className={`rounded-xl overflow-hidden border ${dividerColor}`}>
        <button
          type="button"
          onClick={() => setOptionalOpen(o => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${optionalToggleClass}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">Optional fields</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${optionalOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
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
              <label className={labelClass}>Products &amp; Solutions</label>
              <input type="text" placeholder="e.g. OVHcloud Bare Metal, Public Cloud…" value={form.products_solutions}
                onChange={e => set('products_solutions', e.target.value)} className={inputOptional} />
            </div>

            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                placeholder="Context, additional information…"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className={inputOptional + ' resize-none'}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div onClick={() => set('donotphone', !form.donotphone)} className={checkboxBase(form.donotphone)}>
                  {form.donotphone && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={checkboxLabelClass}>Do not call</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div onClick={() => set('donotbulkemail', !form.donotbulkemail)} className={checkboxBase(form.donotbulkemail)}>
                  {form.donotbulkemail && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={checkboxLabelClass}>Do not bulk email</span>
              </label>
            </div>

          </div>
        )}
      </div>

      {/* ── Error */}
      {error && (
        <p className={`text-xs text-center ${isEth ? 'text-red-500' : 'text-red-400/80'}`}>{error}</p>
      )}

      {/* ── Actions */}
      <button
        type="button"
        onClick={onCancel}
        className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-200 ${
          isEth
            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
        }`}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50"
        style={{
          background: loading ? `${accent}80` : accent,
          color: isEth ? '#fff' : '#000',
          boxShadow: loading ? 'none' : `0 0 24px ${accent}40`,
        }}
      >
        {loading ? 'Saving…' : 'Create Lead'}
      </button>

    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadPage() {
  const { theme } = useNetworkTheme();
  const isEth = theme === 'ethereum';
  const accent = isEth ? '#627EEA' : '#00F0FF';

  type View = 'list' | 'new';
  const [view, setView] = useState<View>('list');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function handleSuccess() {
    fetchLeads();
    setView('list');
  }

  const subTextClass = isEth ? 'text-slate-400' : 'text-white/30';

  return (
    <div className="min-h-screen py-8 px-4 sm:py-10">
      <div className="max-w-xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span
              className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
              style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}
            >
              Internal
            </span>
            <h1 className={`text-2xl font-black uppercase tracking-widest mt-3 ${isEth ? 'text-slate-800' : 'text-white'}`}>
              {view === 'new' ? 'New Lead' : 'Leads'}
            </h1>
            <p className={`text-xs mt-1 ${subTextClass}`}>
              {view === 'new'
                ? <>Fields marked <span style={{ color: accent }}>*</span> are required</>
                : `${leads.length} contact${leads.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Header actions — only in list view */}
          {view === 'list' && (
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {leads.length > 0 && (
                <button
                  type="button"
                  onClick={() => exportCSV(leads)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    isEth
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
              )}
              <button
                type="button"
                onClick={() => setView('new')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200"
                style={{
                  background: accent,
                  color: isEth ? '#fff' : '#000',
                  boxShadow: `0 0 16px ${accent}30`,
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────────────── */}

        {view === 'new' ? (
          <NewLeadForm
            onCancel={() => setView('list')}
            onSuccess={handleSuccess}
            accent={accent}
            isEth={isEth}
          />
        ) : (
          <div className="space-y-3">
            {loadingList ? (
              <>
                <SkeletonCard isEth={isEth} />
                <SkeletonCard isEth={isEth} />
                <SkeletonCard isEth={isEth} />
              </>
            ) : leads.length === 0 ? (
              <EmptyState accent={accent} isEth={isEth} />
            ) : (
              leads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => setSelectedLead(lead)}
                  accent={accent}
                  isEth={isEth}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          accent={accent}
          isEth={isEth}
        />
      )}
    </div>
  );
}
