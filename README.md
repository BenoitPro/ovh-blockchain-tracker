# 🌐 OVHcloud Blockchain Infrastructure Monitor - V1

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/VOTRE-USERNAME/ovh-blockchain-tracker)

## 📊 Vue d'ensemble

Tableau de bord en temps réel pour visualiser la part de marché d'OVHcloud dans l'infrastructure Solana (Nodes & RPC). Cette V1 présente les métriques clés, la distribution géographique et les principaux validateurs hébergés sur OVHcloud.

## ✨ Fonctionnalités V1

- 📈 **KPIs en temps réel** : Nodes OVH, part de marché, distribution géographique
- 🍩 **Visualisation graphique** : Donut chart de la répartition OVH vs Autres
- 📊 **Graphique de tendance** : Évolution du market share sur 7/30/90 jours (Phase 2)
- 💾 **Historique des métriques** : Base de données SQLite avec sauvegarde quotidienne (Phase 2)
- 🗺️ **Carte mondiale interactive** : Localisation des nodes OVH
- 🏆 **Top Validateurs** : Liste des principaux validateurs sur infrastructure OVH
- 🎨 **Design premium** : Interface moderne avec animations 3D et effets glassmorphism
- ⚡ **Performance optimisée** : Cache intelligent et chargement rapide

## 🚀 Déploiement Rapide

### Option 1 : Déploiement via Vercel (Recommandé)

1. **Installer Vercel CLI** :
```bash
npm i -g vercel
```

2. **Se connecter à Vercel** :
```bash
vercel login
```

3. **Déployer** :
```bash
vercel --prod
```

### Option 2 : Via l'interface Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Add New Project"
3. Importez votre repository GitHub
4. Cliquez sur "Deploy"

## 🛠️ Développement Local

```bash
# Installation
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build
npm start
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Phase 2 : Historique & Trends

```bash
# Générer des données de test (90 jours)
npx tsx scripts/seed-historical-data.ts

# Lancer le worker (sauvegarde quotidienne des métriques)
npm run worker

# Vérifier la base de données
sqlite3 data/metrics.db "SELECT COUNT(*) FROM metrics_history;"
```


## 📦 Stack Technique

- **Framework** : Next.js 16.1.6 (App Router)
- **UI** : React 19.2.3 + Tailwind CSS 4
- **Charts** : Recharts 3.7.0
- **Icons** : Heroicons 2.2.0
- **Géolocalisation** : MaxMind GeoLite2
- **TypeScript** : 5.x

## 🌍 Sources de Données

- **Solana RPC** : Récupération des nodes via `getClusterNodes`
- **Géolocalisation** : MaxMind GeoLite2 ASN Database
- **ASNs OVHcloud** : AS16276, AS35540, AS35540

## 📊 Métriques Affichées

- Nombre total de nodes OVH
- Part de marché OVH (%)
- Nombre de pays hébergeant des nodes OVH
- Distribution géographique (carte + liste)
- Top 10 validateurs OVH

## 🎨 Design

Interface inspirée de [OVHcloud Powering Blockchain](https://www.ovhcloud.com/en/lp/powering-blockchain-ethos) avec :
- Palette de couleurs dark mode premium
- Animations 3D de cubes blockchain
- Effets glassmorphism
- Gradients dynamiques
- Micro-animations au survol

## 👥 Équipe

- **Alexandre Al Ajourdi** - [LinkedIn](https://www.linkedin.com/in/alexandre-al-ajourdi/)
- **Omar Abi Issa** - [LinkedIn](https://www.linkedin.com/in/omar-abi-issa/)
- **Benoit Baillon** - [LinkedIn](https://www.linkedin.com/in/benoit-baillon/)

## 📝 License

Ce projet est développé pour OVHcloud.

## 🔗 Liens Utiles

- [OVHcloud Blockchain](https://www.ovhcloud.com/en/lp/powering-blockchain-ethos)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)

---

**Développé avec ❤️ pour OVHcloud**
