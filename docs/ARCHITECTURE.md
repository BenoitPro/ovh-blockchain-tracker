# 🏗️ Architecture des Solutions

Ce document présente les architectures des différentes solutions pour tracker les nœuds OVH sur Solana.

---

## 📊 Solution Actuelle : getClusterNodes() + ip-api.com

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLUTION ACTUELLE                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Worker     │
│  (Node.js)   │
└──────┬───────┘
       │
       │ 1. Fetch nodes
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Solana RPC (Public Endpoint)                                    │
│  https://api.mainnet-beta.solana.com                             │
│                                                                   │
│  Method: getClusterNodes()                                       │
│  Returns: [{ pubkey, gossip: "IP:PORT", ... }]                  │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 2. Extract IPs (500 nodes)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Rate Limiter (1500ms per request)                               │
│  Prevents overwhelming ip-api.com                                │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 3. Resolve IP → ASN (500 requests)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  ip-api.com (Free Tier)                                          │
│  http://ip-api.com/json/{IP}                                     │
│                                                                   │
│  Rate Limit: 45 requests/minute                                  │
│  Returns: { as: "AS16276 OVH SAS", country, city, lat, lon }    │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 4. Filter OVH nodes
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  OVH ASN Filter                                                  │
│  Check if ASN in [AS16276, AS35540, AS21351, AS198203]          │
│                                                                   │
│  Result: ~25 OVH nodes (5% of total)                             │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 5. Save to cache
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cache (JSON File)                                               │
│  data/cache.json                                                 │
│                                                                   │
│  TTL: 1 hour                                                     │
└──────────────────────────────────────────────────────────────────┘

⏱️  TOTAL TIME: 12-15 minutes for 500 nodes
📊 API CALLS: 500 external requests
⚠️  BOTTLENECK: ip-api.com rate limits (45 req/min)
```

---

## 🚀 Solution Recommandée : MaxMind Hybride

```
┌─────────────────────────────────────────────────────────────────┐
│              SOLUTION MAXMIND HYBRIDE (RECOMMANDÉE)              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Worker     │
│  (Node.js)   │
└──────┬───────┘
       │
       │ 1. Initialize MaxMind (once at startup)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  MaxMind GeoLite2 ASN Database (Local)                           │
│  data/GeoLite2-ASN.mmdb (~7 MB)                                  │
│                                                                   │
│  Loaded in memory for instant lookups                            │
│  Updated monthly (automated script)                              │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 2. Fetch nodes
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Solana RPC (Public Endpoint)                                    │
│  https://api.mainnet-beta.solana.com                             │
│                                                                   │
│  Method: getClusterNodes()                                       │
│  Returns: [{ pubkey, gossip: "IP:PORT", ... }]                  │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 3. Extract IPs (500 nodes)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  MaxMind Local Lookup (Batch Processing)                         │
│  batchGetASN(ips)                                                │
│                                                                   │
│  Performance: < 1ms per IP (offline)                             │
│  Returns: { asn: "AS16276", org: "OVH SAS" }                     │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 4. Filter OVH nodes (instant)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  OVH ASN Filter                                                  │
│  Check if ASN in [AS16276, AS35540, AS21351, AS198203]          │
│                                                                   │
│  Result: ~25 OVH nodes (5% of total)                             │
│  Time: < 0.1 second                                              │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 5. Get geolocation (OVH nodes only)
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  ip-api.com (Only for OVH nodes)                                 │
│  http://ip-api.com/json/{IP}                                     │
│                                                                   │
│  Requests: ~25 (vs 500 previously)                               │
│  Returns: { country, city, lat, lon }                            │
└──────────────────────────────────────────────────────────────────┘
       │
       │ 6. Save to cache
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  Cache (JSON File)                                               │
│  data/cache.json                                                 │
│                                                                   │
│  TTL: 1 hour                                                     │
└──────────────────────────────────────────────────────────────────┘

⏱️  TOTAL TIME: < 1 minute for 500 nodes
📊 API CALLS: 25 external requests (95% reduction)
✅ BOTTLENECK: Eliminated!
🚀 SPEEDUP: 150x faster
```

---

## 🔄 Comparaison Flux de Données

### Solution Actuelle

```
Solana RPC → Extract IPs → [Rate Limiter] → ip-api.com (500x) → Filter OVH → Cache
   2s            0.1s            750s              (12.5 min)        0.1s      0.1s

TOTAL: ~12-15 minutes
```

### Solution MaxMind Hybride

```
Solana RPC → Extract IPs → MaxMind Local (500x) → Filter OVH → ip-api.com (25x) → Cache
   2s            0.1s              0.5s                0.1s            40s           0.1s

TOTAL: < 1 minute
```

---

## 📊 Comparaison Visuelle des Temps

```
┌────────────────────────────────────────────────────────────────┐
│  TEMPS DE TRAITEMENT (500 nœuds)                               │
└────────────────────────────────────────────────────────────────┘

Solution Actuelle:
┌─────────────────────────────────────────────────────────────────┐
│████████████████████████████████████████████████████████████████│ 12-15 min
└─────────────────────────────────────────────────────────────────┘

MaxMind Hybride:
┌──┐
│██│ < 1 min
└──┘

GAIN: 92% de réduction du temps de traitement
```

---

## 🔍 Détail des Étapes MaxMind

### Étape 1 : Initialisation (Une seule fois au démarrage)

```javascript
import { initMaxMind } from './src/lib/asn/maxmind.js';

// Initialize MaxMind database (once at startup)
await initMaxMind();
// ✅ Database loaded in memory (~7 MB)
// ⏱️  Time: ~100ms
```

### Étape 2 : Résolution ASN (Pour chaque IP)

```javascript
import { getASNFromMaxMind } from './src/lib/asn/maxmind.js';

// Resolve IP → ASN (instant, offline)
const asnInfo = getASNFromMaxMind('51.210.1.1');
// Returns: { asn: 'AS16276', org: 'OVH SAS' }
// ⏱️  Time: < 1ms per IP
```

### Étape 3 : Traitement par Lot (Optimisé)

```javascript
import { batchGetASN } from './src/lib/asn/maxmind.js';

// Process 500 IPs in one go
const ips = ['8.8.8.8', '1.1.1.1', '51.210.1.1', ...]; // 500 IPs
const results = batchGetASN(ips);
// Returns: Map<IP, { asn, org }>
// ⏱️  Time: < 500ms for 500 IPs
```

### Étape 4 : Filtrage OVH (Instant)

```javascript
import { isOVHIP } from './src/lib/asn/maxmind.js';

// Check if IP belongs to OVH
const isOVH = isOVHIP('51.210.1.1');
// Returns: true
// ⏱️  Time: < 1ms
```

### Étape 5 : Géolocalisation Hybride (Seulement OVH)

```javascript
import { getIPInfoHybrid } from './src/lib/asn/maxmind.js';

// Get full info (ASN from MaxMind + Geolocation from ip-api.com)
const ipInfo = await getIPInfoHybrid('51.210.1.1');
// Returns: {
//   ip: '51.210.1.1',
//   asn: 'AS16276',
//   org: 'OVH SAS',
//   country: 'FR',
//   country_name: 'France',
//   city: 'Roubaix',
//   latitude: 50.6942,
//   longitude: 3.1746
// }
// ⏱️  Time: ~1.5s (only for OVH nodes)
```

---

## 🏗️ Architecture Worker Modifiée

### Avant (Solution Actuelle)

```javascript
// scripts/worker.js

async function runWorker() {
    // 1. Fetch nodes (2s)
    const nodes = await fetchSolanaNodes(500);
    
    // 2. Categorize by provider (12-15 min)
    const distribution = await categorizeNodesByProvider(nodes);
    //    ↑ Calls ip-api.com 500 times with rate limiting
    
    // 3. Filter OVH nodes (12-15 min)
    const ovhNodes = await filterOVHNodes(nodes);
    //    ↑ Calls ip-api.com again for OVH nodes
    
    // 4. Calculate metrics (0.1s)
    const metrics = calculateMetrics(nodes, ovhNodes, distribution);
    
    // 5. Save to cache (0.1s)
    await writeCache(metrics);
}
```

### Après (MaxMind Hybride)

```javascript
// scripts/worker.js

import { initMaxMind } from '../src/lib/asn/maxmind.js';

async function runWorker() {
    // 0. Initialize MaxMind ONCE (100ms)
    await initMaxMind();
    
    // 1. Fetch nodes (2s)
    const nodes = await fetchSolanaNodes(500);
    
    // 2. Categorize by provider (< 1s)
    const distribution = await categorizeNodesByProviderMaxMind(nodes);
    //    ↑ Uses MaxMind local lookup (instant)
    
    // 3. Filter OVH nodes (< 1s)
    const ovhNodes = await filterOVHNodesMaxMind(nodes);
    //    ↑ Uses MaxMind local lookup (instant)
    
    // 4. Get geolocation for OVH nodes only (40s)
    const ovhNodesWithGeo = await enrichOVHNodesWithGeolocation(ovhNodes);
    //    ↑ Calls ip-api.com only for ~25 OVH nodes
    
    // 5. Calculate metrics (0.1s)
    const metrics = calculateMetrics(nodes, ovhNodesWithGeo, distribution);
    
    // 6. Save to cache (0.1s)
    await writeCache(metrics);
}
```

---

## 📈 Évolution de la Performance

### Scalabilité : Nombre de Nœuds vs Temps de Traitement

```
Nombre de nœuds
    ▲
5000│                                              ╱ Solution Actuelle
    │                                          ╱
4000│                                      ╱
    │                                  ╱
3000│                              ╱
    │                          ╱
2000│                      ╱
    │                  ╱
1000│              ╱
    │          ╱
 500│      ╱
    │  ╱
    │╱─────────────────────────────────────────── MaxMind Hybride
    └────────────────────────────────────────────────────────────▶
    0s    1min   5min   10min  15min  20min  25min  30min  Temps

Solution Actuelle: Croissance linéaire (1.5s par nœud)
MaxMind Hybride: Croissance quasi-constante (< 1 min jusqu'à 1000 nœuds)
```

---

## 🔄 Mise à Jour Automatique de la DB MaxMind

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTOMATISATION DE LA MISE À JOUR MENSUELLE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  Cron Job    │
│  (Monthly)   │
│  1st @ 3am   │
└──────┬───────┘
       │
       │ Trigger monthly
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  scripts/download-maxmind.js                                     │
│                                                                   │
│  1. Check MAXMIND_LICENSE_KEY                                    │
│  2. Download GeoLite2-ASN.tar.gz                                 │
│  3. Extract GeoLite2-ASN.mmdb                                    │
│  4. Replace old database                                         │
│  5. Verify integrity                                             │
└──────────────────────────────────────────────────────────────────┘
       │
       │ Success
       ▼
┌──────────────────────────────────────────────────────────────────┐
│  data/GeoLite2-ASN.mmdb (Updated)                                │
│                                                                   │
│  Next worker run will use the new database                       │
└──────────────────────────────────────────────────────────────────┘

Cron Expression: 0 3 1 * *
Frequency: 1st of every month at 3:00 AM
```

---

## 🎯 Résumé des Architectures

| Aspect | Solution Actuelle | MaxMind Hybride |
|--------|-------------------|-----------------|
| **Dépendances externes** | ip-api.com (500 req) | ip-api.com (25 req) |
| **Résolution ASN** | Externe (ip-api.com) | Locale (MaxMind) |
| **Géolocalisation** | Externe (ip-api.com) | Externe (OVH uniquement) |
| **Rate limiting** | Oui (1500ms/req) | Non (ASN local) |
| **Offline capable** | ❌ Non | ✅ Oui (ASN) |
| **Scalabilité** | Linéaire (1.5s/node) | Quasi-constante |
| **Complexité** | Simple | Moyenne |
| **Maintenance** | Aucune | Mensuelle (automatisée) |

---

## 🚀 Conclusion

### Solution Actuelle
✅ Simple et fonctionnelle
❌ Non scalable (rate limits)
❌ Lente (12-15 min pour 500 nœuds)

### MaxMind Hybride
✅ Ultra-rapide (< 1 min pour 500 nœuds)
✅ Scalable (10,000+ nœuds)
✅ Gratuit à 100%
⚠️ Setup initial requis (4-5h)

**Recommandation** : Migrer vers MaxMind pour la production ! 🚀
