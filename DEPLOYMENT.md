# Guide de Déploiement Vercel

## 🚀 Déploiement Rapide

### Prérequis
- Compte GitHub
- Compte Vercel (gratuit)

### Étapes

#### 1. Initialiser Git et Pousser sur GitHub

```bash
cd ovh-solana-tracker

# Initialiser le dépôt Git
git init
git add .
git commit -m "Initial commit: OVHcloud Solana Infrastructure Monitor"

# Créer un nouveau repository sur GitHub
# Puis lier et pousser
git remote add origin https://github.com/VOTRE-USERNAME/ovh-solana-tracker.git
git branch -M main
git push -u origin main
```

#### 2. Déployer sur Vercel

**Option A : Via l'interface Vercel**
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Next.js
5. Cliquez sur "Deploy"

**Option B : Via CLI Vercel**
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod
```

#### 3. Configuration (Optionnelle)

Aucune variable d'environnement n'est requise pour le fonctionnement de base.

Si vous souhaitez augmenter la limite de nodes analysés :
1. Allez dans Settings > Environment Variables
2. Ajoutez `NODE_ANALYSIS_LIMIT=100` (ou plus)
3. Redéployez

### ⚠️ Limitations à Connaître

#### Rate Limiting IP API
- L'API gratuite `ipapi.co` a une limite de **1000 requêtes/jour**
- Avec 50 nodes analysés, vous pouvez rafraîchir ~20 fois/jour
- Le cache de 5 minutes réduit les appels API

#### Solutions pour Production

**Option 1 : Augmenter le cache**
```typescript
// src/app/api/solana/route.ts
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes au lieu de 5
```

**Option 2 : Utiliser une API IP payante**
- [ipapi.com](https://ipapi.com) : 10,000 req/mois pour $10
- [ipgeolocation.io](https://ipgeolocation.io) : 30,000 req/mois pour $15

**Option 3 : Base de données ASN locale**
- Télécharger la base MaxMind GeoLite2
- Intégrer dans le projet (pas d'appels API externes)

### 📊 Monitoring

Une fois déployé, surveillez :
- **Vercel Analytics** : Trafic et performance
- **Vercel Logs** : Erreurs API et rate limits
- **Function Duration** : Temps de réponse de `/api/solana`

### 🔧 Optimisations Post-Déploiement

#### 1. Augmenter le nombre de nodes analysés
Si vous avez une API IP payante :
```typescript
// src/lib/solana/fetchNodes.ts
const nodes = await fetchSolanaNodes(200); // Au lieu de 50
```

#### 2. Ajouter un système de retry
```typescript
// src/lib/solana/filterOVH.ts
async function getIPInfoWithRetry(ip: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await getIPInfo(ip);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

#### 3. Ajouter des métriques Ethereum
Dupliquer la logique pour Ethereum :
- Créer `/api/ethereum/route.ts`
- Adapter le RPC endpoint
- Ajouter un toggle dans le dashboard

### 🎯 Partage sur les Réseaux Sociaux

Une fois déployé, votre URL sera :
```
https://ovh-solana-tracker.vercel.app
```

**Open Graph Tags** (déjà configurés) :
- Titre, description et image de preview automatiques
- Optimisé pour Twitter, LinkedIn, Facebook

### 📱 Performance

**Lighthouse Score Attendu** :
- Performance : 90+
- Accessibility : 95+
- Best Practices : 100
- SEO : 100

### 🐛 Troubleshooting

**Erreur : "Module not found"**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules .next
npm install
```

**Erreur : "API Rate Limit"**
- Augmenter `CACHE_DURATION`
- Réduire `NODE_ANALYSIS_LIMIT`
- Passer à une API payante

**Erreur : "Function Timeout"**
- Vercel Free : 10s max
- Réduire le nombre de nodes analysés
- Optimiser les appels API (parallélisation)

### 📞 Support

Pour toute question :
- GitHub Issues : [votre-repo]/issues
- Documentation Next.js : https://nextjs.org/docs
- Documentation Vercel : https://vercel.com/docs

---

**Bon déploiement ! 🚀**
