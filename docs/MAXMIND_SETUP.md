# 🚀 Guide d'Installation : MaxMind GeoLite2 ASN

Ce guide vous explique comment intégrer MaxMind GeoLite2 ASN pour une résolution ultra-rapide des ASN (Autonomous System Numbers) sans appels API externes.

---

## 📋 Prérequis

- Node.js 18+
- npm ou yarn
- Compte MaxMind gratuit (pour télécharger la base de données)

---

## 🔧 Installation

### Étape 1 : Installer la dépendance npm

```bash
npm install @maxmind/geoip2-node
```

### Étape 2 : Créer un compte MaxMind (gratuit)

1. Aller sur [MaxMind Sign Up](https://www.maxmind.com/en/geolite2/signup)
2. Créer un compte gratuit
3. Confirmer votre email

### Étape 3 : Générer une clé de licence

1. Se connecter sur [MaxMind Account](https://www.maxmind.com/en/account/login)
2. Aller dans **"Manage License Keys"**
3. Cliquer sur **"Generate new license key"**
4. Nom : `OVH-Solana-Tracker`
5. **Important** : Sélectionner **"No"** pour "Will this key be used for GeoIP Update?"
6. Copier la clé de licence (vous ne pourrez la voir qu'une seule fois)

### Étape 4 : Télécharger la base de données GeoLite2-ASN

#### Option A : Téléchargement manuel (recommandé pour la première fois)

1. Se connecter sur [MaxMind Download](https://www.maxmind.com/en/accounts/current/geoip/downloads)
2. Trouver **"GeoLite2 ASN"**
3. Télécharger le fichier **"Download GZIP"** (format `.tar.gz`)
4. Extraire le fichier `GeoLite2-ASN.mmdb`
5. Placer le fichier dans `/Users/benoit/App track OVH footprint solana/ovh-solana-tracker/data/GeoLite2-ASN.mmdb`

#### Option B : Téléchargement automatique avec script

Créer un fichier `.env.local` à la racine du projet :

```bash
MAXMIND_LICENSE_KEY=your_license_key_here
```

Puis exécuter le script de téléchargement :

```bash
node scripts/download-maxmind.js
```

### Étape 5 : Vérifier l'installation

```bash
# Vérifier que le fichier existe
ls -lh data/GeoLite2-ASN.mmdb

# Devrait afficher quelque chose comme :
# -rw-r--r--  1 benoit  staff   7.2M Jan 30 15:00 data/GeoLite2-ASN.mmdb
```

---

## 🧪 Test de l'installation

Créer un fichier de test `test-maxmind.js` :

```javascript
import { initMaxMind, getASNFromMaxMind, isOVHIP } from './src/lib/asn/maxmind.js';

async function test() {
    console.log('🧪 Testing MaxMind GeoLite2 ASN...\n');

    // Initialize
    await initMaxMind();
    console.log('✅ MaxMind initialized\n');

    // Test 1: Google DNS
    const google = getASNFromMaxMind('8.8.8.8');
    console.log('Test 1 - Google DNS (8.8.8.8):', google);
    // Expected: { asn: 'AS15169', org: 'Google LLC' }

    // Test 2: Cloudflare DNS
    const cloudflare = getASNFromMaxMind('1.1.1.1');
    console.log('Test 2 - Cloudflare DNS (1.1.1.1):', cloudflare);
    // Expected: { asn: 'AS13335', org: 'Cloudflare, Inc.' }

    // Test 3: OVH IP
    const ovh = getASNFromMaxMind('51.210.1.1');
    console.log('Test 3 - OVH IP (51.210.1.1):', ovh);
    // Expected: { asn: 'AS16276', org: 'OVH SAS' }

    // Test 4: Check if IP is OVH
    const isOVH = isOVHIP('51.210.1.1');
    console.log('\nTest 4 - Is 51.210.1.1 an OVH IP?', isOVH);
    // Expected: true

    console.log('\n✅ All tests passed!');
}

test();
```

Exécuter le test :

```bash
node test-maxmind.js
```

---

## 🔄 Mise à jour automatique de la base de données

MaxMind met à jour GeoLite2-ASN **tous les mardis**. Il est recommandé de mettre à jour la base de données mensuellement.

### Script de mise à jour automatique

Créer `scripts/download-maxmind.js` :

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGunzip } from 'zlib';
import tar from 'tar';

const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY;
const DB_PATH = path.join(process.cwd(), 'data', 'GeoLite2-ASN.mmdb');

if (!LICENSE_KEY) {
    console.error('❌ MAXMIND_LICENSE_KEY not found in environment variables');
    console.error('Please add it to .env.local');
    process.exit(1);
}

async function downloadMaxMind() {
    console.log('📥 Downloading GeoLite2-ASN database...');

    const url = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-ASN&license_key=${LICENSE_KEY}&suffix=tar.gz`;

    try {
        // Download and extract
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        const tarPath = path.join(process.cwd(), 'data', 'GeoLite2-ASN.tar.gz');
        
        // Save tar.gz
        const fileStream = createWriteStream(tarPath);
        await pipeline(response.body, fileStream);

        console.log('✅ Downloaded GeoLite2-ASN.tar.gz');

        // Extract .mmdb file
        await tar.x({
            file: tarPath,
            cwd: path.join(process.cwd(), 'data'),
            strip: 1,
            filter: (path) => path.endsWith('.mmdb'),
        });

        console.log('✅ Extracted GeoLite2-ASN.mmdb');

        // Clean up tar.gz
        fs.unlinkSync(tarPath);

        console.log('✅ Database updated successfully!');
        console.log(`📍 Location: ${DB_PATH}`);
    } catch (error) {
        console.error('❌ Download failed:', error);
        process.exit(1);
    }
}

downloadMaxMind();
```

### Cron job pour mise à jour mensuelle

Ajouter à votre crontab :

```bash
# Update MaxMind database on the 1st of every month at 3am
0 3 1 * * cd /Users/benoit/App\ track\ OVH\ footprint\ solana/ovh-solana-tracker && node scripts/download-maxmind.js
```

Ou avec PM2 :

```bash
pm2 start scripts/download-maxmind.js --cron "0 3 1 * *" --name "maxmind-updater" --no-autorestart
```

---

## 📊 Intégration dans le Worker

Modifier `scripts/worker.js` pour utiliser MaxMind :

```javascript
import { initMaxMind } from '../src/lib/asn/maxmind.js';
import { filterOVHNodesWithMaxMind } from '../src/lib/solana/filterOVH.js';

async function runWorker() {
    console.log('🚀 [Worker] Starting Solana data collection...');

    // Initialize MaxMind ONCE at startup
    await initMaxMind();
    console.log('✅ [Worker] MaxMind initialized');

    // ... rest of your worker code
}
```

---

## 🎯 Avantages de MaxMind

| Critère | ip-api.com | MaxMind GeoLite2 |
|---------|------------|------------------|
| **Vitesse** | 1500ms/IP | < 1ms/IP |
| **Rate limits** | 45 req/min | Illimité |
| **Offline** | ❌ Non | ✅ Oui |
| **Coût** | Gratuit (limité) | Gratuit |
| **Précision ASN** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scalabilité** | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## ⚠️ Limitations

- **Géolocalisation** : MaxMind GeoLite2-ASN ne fournit **pas** les coordonnées GPS ni la ville
- **Solution** : Utiliser l'approche hybride (MaxMind pour ASN + ip-api.com pour géolocalisation des nœuds OVH uniquement)
- **Mise à jour** : Nécessite une mise à jour mensuelle de la base de données

---

## 🆘 Dépannage

### Erreur : "MaxMind database not found"

```bash
# Vérifier que le fichier existe
ls -la data/GeoLite2-ASN.mmdb

# Si absent, télécharger manuellement depuis MaxMind
```

### Erreur : "Failed to load MaxMind database"

```bash
# Vérifier les permissions
chmod 644 data/GeoLite2-ASN.mmdb

# Vérifier que le fichier n'est pas corrompu
file data/GeoLite2-ASN.mmdb
# Devrait afficher : "data: MaxMind DB database"
```

### Performance dégradée

```bash
# Vérifier la taille de la base de données
ls -lh data/GeoLite2-ASN.mmdb
# Devrait être ~7-10 MB

# Si trop petit ou trop gros, re-télécharger
```

---

## 📚 Ressources

- [MaxMind GeoLite2 Documentation](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [MaxMind Node.js API](https://github.com/maxmind/GeoIP2-node)
- [MaxMind License Agreement](https://www.maxmind.com/en/geolite2/eula)

---

## ✅ Checklist d'installation

- [ ] Compte MaxMind créé
- [ ] Clé de licence générée
- [ ] `@maxmind/geoip2-node` installé
- [ ] `GeoLite2-ASN.mmdb` téléchargé et placé dans `/data`
- [ ] Test de l'installation réussi
- [ ] Worker modifié pour utiliser MaxMind
- [ ] Cron job configuré pour mise à jour mensuelle

---

**Prêt à passer à la vitesse supérieure ! 🚀**
