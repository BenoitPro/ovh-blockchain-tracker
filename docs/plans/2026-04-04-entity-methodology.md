# Entity Methodology Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add vote_account cross-matching to the Marinade source, then add an "Entity Methodology" floating button on the Solana Explorer page explaining how validator names are resolved.

**Architecture:** Two independent changes — (1) a one-line enrichment in `getAllNodes.ts` to also index Marinade entries by `vote_account`, (2) a new `EntityMethodologyButton` component rendered inside `GenericNodeExplorer` positioned above the existing `MethodologyModal` button.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion (already used in `MethodologyModal`).

---

### Task 1: Vote account cross-matching in Marinade fetch

**Files:**
- Modify: `src/lib/solana/getAllNodes.ts` lines 111–118

**Context:**
`fetchMarinadeValidatorInfo` currently only maps `identity → info`. Marinade also returns `vote_account` per entry. Adding that secondary key means our existing fallback lookup (`validatorNames?.get(voteInfo.votePubkey)` in `fetchEnrichedNodes`) can also resolve names via vote account when identity is missing.

**Step 1: Edit `fetchMarinadeValidatorInfo` to also index by vote_account**

In `src/lib/solana/getAllNodes.ts`, replace the inner loop body:

```typescript
// BEFORE
for (const v of validators) {
    const identity = v.identity;
    if (!identity) continue;
    const name = (v.info_name || '').trim();
    const image = (v.info_icon_url || '').trim();
    if (name || image) {
        map.set(identity, { name, image });
    }
}

// AFTER
for (const v of validators) {
    const identity = v.identity;
    if (!identity) continue;
    const name = (v.info_name || '').trim();
    const image = (v.info_icon_url || '').trim();
    if (name || image) {
        const info = { name, image };
        map.set(identity, info);
        // Also index by vote_account so vote-pubkey fallback lookup works
        if (v.vote_account) map.set(v.vote_account, info);
    }
}
```

**Step 2: Verify TypeScript — no errors in this file**

```bash
cd ovh-blockchain-tracker
npx tsc --noEmit 2>&1 | grep getAllNodes
```
Expected: no output (no errors).

**Step 3: Commit**

```bash
git add src/lib/solana/getAllNodes.ts
git commit -m "feat(solana): index Marinade entries by vote_account for broader name coverage"
```

---

### Task 2: EntityMethodologyButton component

**Files:**
- Create: `src/components/nodes/EntityMethodologyButton.tsx`
- Modify: `src/components/nodes/GenericNodeExplorer.tsx` (import + render)

**Step 1: Create `EntityMethodologyButton.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function EntityMethodologyButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger — sits above the Data Methodology button (bottom-20) */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-6 z-40 group flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-xl bg-white/5 border border-white/10 hover:border-[var(--chain-accent)]/50"
            >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-[var(--chain-accent)]" />
                <BuildingOffice2Icon className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-[var(--chain-accent)]" />
                <span className="text-xs font-bold uppercase tracking-widest transition-colors text-white/70 group-hover:text-white">
                    Entity Methodology
                </span>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-[#000E1E]/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#050510] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                            style={{ boxShadow: '0 0 40px color-mix(in srgb, var(--chain-accent) 10%, transparent)' }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--chain-accent)]" />

                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <BuildingOffice2Icon className="w-5 h-5 text-[var(--chain-accent)]" />
                                    Entity Methodology
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 text-sm leading-relaxed text-slate-300 space-y-4">
                                <p>
                                    Each validator is identified by its <strong className="text-white">identity public key</strong>. We cross-reference three independent registries to resolve the organization behind that key:
                                </p>
                                <ol className="list-decimal list-outside ml-4 space-y-3">
                                    <li>
                                        <strong className="text-white">Marinade Finance Registry</strong>{' '}
                                        <span className="text-xs text-[var(--chain-accent)] font-mono">#1 priority</span>
                                        <br />
                                        788 validators tracked, 635 named. Includes major institutional operators (Alchemy, Jupiter, Binance, Galaxy, Kraken…).
                                    </li>
                                    <li>
                                        <strong className="text-white">Solana On-Chain Config Program</strong>{' '}
                                        <span className="text-xs text-[var(--chain-accent)] font-mono">#2 priority</span>
                                        <br />
                                        Validators who published their info on-chain via <code className="text-xs bg-white/10 px-1 rounded">solana validator-info publish</code>. ~2,480 entries.
                                    </li>
                                    <li>
                                        <strong className="text-white">StakeWiz</strong>{' '}
                                        <span className="text-xs text-white/30 font-mono">fallback</span>
                                        <br />
                                        Community-maintained registry, used as last resort for validators absent from the two sources above.
                                    </li>
                                </ol>
                                <p className="pt-4 border-t border-white/10 text-xs text-slate-500 font-mono italic">
                                    Validators absent from all registries are shown as "Unknown Validator" — they have not published their identity anywhere publicly.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
```

**Step 2: Import and render in `GenericNodeExplorer.tsx`**

Add import at the top of the file (after existing imports):
```typescript
import EntityMethodologyButton from './EntityMethodologyButton';
```

Add the component just before the closing `</div>` of the root element (last line before `}`):
```tsx
        <EntityMethodologyButton />
    </div>
);
```

The root `<div className="relative">` already exists — `EntityMethodologyButton` uses `fixed` positioning so it sits outside the normal flow.

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "EntityMethodology|GenericNodeExplorer"
```
Expected: no output.

**Step 4: Smoke test**
Open `/nodes` in the browser. Two floating buttons should appear bottom-right:
- `Entity Methodology` (higher, `bottom-20`)
- `Data Methodology` (lower, `bottom-6`)

Both open their respective modals. Clicking the backdrop closes them.

**Step 5: Commit**

```bash
git add src/components/nodes/EntityMethodologyButton.tsx src/components/nodes/GenericNodeExplorer.tsx
git commit -m "feat(explorer): add Entity Methodology floating button explaining validator name resolution"
```
