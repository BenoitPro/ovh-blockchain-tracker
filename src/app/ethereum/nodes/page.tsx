'use client';

export default function EthereumNodesPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            <main className="relative z-10 container mx-auto px-6 py-12 max-w-3xl">

                {/* Header */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border"
                        style={{ color: '#627EEA', borderColor: '#627EEA40', background: '#627EEA0D' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#627EEA] animate-pulse" />
                        Coming Soon
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
                        Ethereum Node Explorer
                    </h1>
                    <p className="text-slate-500 text-base leading-relaxed">
                        Nous travaillons à rendre l&apos;exploration individuelle des nœuds Ethereum possible.
                        Voici pourquoi c&apos;est plus complexe que pour Solana.
                    </p>
                </div>

                {/* Explanation cards */}
                <div className="space-y-5">

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            Des données agrégées, pas individuelles
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Notre source actuelle — l&apos;API MigaLabs — ne retourne que des distributions statistiques :
                            nombre de nœuds par fournisseur, par pays, par client. Il n&apos;existe aucun endpoint exposant
                            une liste de nœuds individuels avec leurs adresses IP. C&apos;est suffisant pour mesurer les parts
                            de marché, mais impossible à lister nœud par nœud.
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            Un protocole de découverte différent de Solana
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Sur Solana, chaque nœud annonce son IP via le protocole Gossip — une simple requête RPC
                            retourne la liste complète des participants. Sur Ethereum, les nœuds sont découverts via
                            deux protocoles distincts : <strong>devp2p</strong> pour la couche d&apos;exécution (Geth, Reth...)
                            et <strong>libp2p</strong> pour la couche de consensus (Lighthouse, Prysm...). Crawler ces
                            deux réseaux nécessite un nœud dédié en permanence.
                        </p>
                    </div>

                    <div className="rounded-2xl p-6 border border-[#627EEA]/15 bg-white/60 backdrop-blur-sm">
                        <h2 className="text-sm font-black uppercase tracking-widest text-[#627EEA] mb-3">
                            Ce qui est envisagé
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            L&apos;intégration d&apos;une source comme <strong>Ethernodes.org</strong> permettrait de lister
                            les nœuds execution layer avec leur IP, client, pays et OS — et d&apos;y appliquer notre
                            enrichissement MaxMind pour identifier les infrastructures OVHcloud. Une piste concrète,
                            à court terme.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
