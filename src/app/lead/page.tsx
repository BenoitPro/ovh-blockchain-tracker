'use client';

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNetworkTheme } from '@/components/NetworkThemeProvider';

const LEGAL_FORMS = ['Public Sector', 'Organization', 'Association', 'Particular', 'Other'];
const EVALUATIONS = ['Hot', 'Warm', 'Cold'];

// 180+ countries
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

// Searchable country dropdown
function CountrySelect({
  value, onChange, inputClass, accent, isEth,
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
    ? 'text-slate-700 hover:bg-[#627EEA]/08 cursor-pointer'
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
        <svg className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke={isEth ? '#94a3b8' : 'rgba(255,255,255,0.3)'} strokeWidth={2}>
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

export default function LeadPage() {
  const { theme } = useNetworkTheme();
  const isEth = theme === 'ethereum';
  const accent = isEth ? '#627EEA' : '#00F0FF';
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
  const [success, setSuccess] = useState(false);
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
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setForm({
            last_name: '', first_name: '', email: '', organization: '',
            legal_form: '', country: '', evaluation: '',
            donotphone: false, donotbulkemail: false,
            target_owner: '', description: '',
            mobile_phone: '', job_title: '', interested_by: '', products_solutions: '',
          });
          setPhoto(null);
          setPhotoName('');
        }, 2000);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  // ── Theme-aware style helpers ──────────────────────────────────────────
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

  // Evaluation pill buttons
  const evalColors: Record<string, { active: string; glow: string }> = {
    Hot:  { active: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
    Warm: { active: '#f97316', glow: 'rgba(249,115,22,0.25)' },
    Cold: { active: accent,   glow: `${accent}40` },
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:py-10">
      <div className="max-w-xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <span
            className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ color: accent, background: `${accent}18`, border: `1px solid ${accent}40` }}
          >
            Internal
          </span>
          <h1 className={`text-2xl font-black uppercase tracking-widest mt-3 ${isEth ? 'text-slate-800' : 'text-white'}`}>
            New Lead
          </h1>
          <p className={`text-xs mt-1 ${isEth ? 'text-slate-400' : 'text-white/30'}`}>
            Fields marked <span style={{ color: accent }}>*</span> are required
          </p>
        </div>

        {/* ── Success banner ──────────────────────────────────────── */}
        {success && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${accent}12`, border: `1px solid ${accent}40` }}>
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium" style={{ color: accent }}>Lead successfully saved</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── First / Last name ─────────────────────────────────── */}
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

          {/* ── Email ────────────────────────────────────────────── */}
          <div>
            <label className={labelClass}>Email {requiredDot}</label>
            <input type="email" required placeholder="john.smith@example.com" value={form.email}
              onChange={e => set('email', e.target.value)} className={inputRequired} />
          </div>

          {/* ── Organisation ─────────────────────────────────────── */}
          <div>
            <label className={labelClass}>Organization {requiredDot}</label>
            <input type="text" required placeholder="Company name" value={form.organization}
              onChange={e => set('organization', e.target.value)} className={inputRequired} />
          </div>

          {/* ── Legal form / Country ─────────────────────────────── */}
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

          {/* ── Evaluation ───────────────────────────────────────── */}
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
            {/* Hidden required input to enforce selection */}
            <input type="text" required value={form.evaluation} onChange={() => {}}
              className="opacity-0 h-0 w-0 absolute" tabIndex={-1} />
          </div>

          {/* ── Photo ────────────────────────────────────────────── */}
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
            {/* No capture attr → iOS shows native sheet: Take Photo / Choose from Library */}
            <input ref={photoInputRef} type="file" accept="image/*"
              onChange={handlePhoto} className="hidden" />
          </div>

          {/* ── Optional fields ─────────────────────────────────── */}
          <div className={`rounded-xl overflow-hidden border ${dividerColor}`}>
            <button
              type="button"
              onClick={() => setOptionalOpen(o => !o)}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${optionalToggleClass}`}
            >
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
                  <input type="text" placeholder="e.g. OVHcloud Bare Metal, Public Cloud…" value={form.products_solutions}
                    onChange={e => set('products_solutions', e.target.value)} className={inputOptional} />
                </div>

                <div>
                  <label className={labelClass}>Notes</label>
                  <textarea placeholder="Context, additional information…" value={form.description}
                    onChange={e => set('description', e.target.value)} rows={3}
                    className={inputOptional + ' resize-none'} />
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

          {/* ── Error ──────────────────────────────────────────────── */}
          {error && (
            <p className={`text-xs text-center ${isEth ? 'text-red-500' : 'text-red-400/80'}`}>{error}</p>
          )}

          {/* ── Submit ─────────────────────────────────────────────── */}
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
      </div>
    </div>
  );
}
