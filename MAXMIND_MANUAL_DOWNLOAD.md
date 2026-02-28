# 🔧 Téléchargement Manuel de MaxMind GeoLite2-ASN

## ⚠️ Problème Détecté

La clé de licence fournie semble invalide ou nécessite une vérification.

**Message d'erreur** : `Invalid license key`

---

## 📋 Solution : Téléchargement Manuel

### Étape 1 : Vérifier la Clé de Licence

1. Se connecter sur : https://www.maxmind.com/en/account/login
2. Aller dans **"Manage License Keys"**
3. Vérifier que la clé `[VOTRE_CLE]` est active
4. Si elle n'existe pas ou est expirée, en générer une nouvelle

### Étape 2 : Télécharger Manuellement la Base de Données

#### Option A : Via le Site Web (Recommandé)

1. Se connecter sur : https://www.maxmind.com/en/account/login
2. Aller dans **"Download Files"** : https://www.maxmind.com/en/accounts/current/geoip/downloads
3. Trouver **"GeoLite2 ASN"**
4. Cliquer sur **"Download GZIP"** (format `.tar.gz`)
5. Sauvegarder le fichier dans `/Users/benoit/App track OVH footprint solana/ovh-solana-tracker/data/`

#### Option B : Via Ligne de Commande (avec nouvelle clé)

Si vous générez une nouvelle clé de licence :

```bash
# Remplacer YOUR_NEW_KEY par votre nouvelle clé
curl -L "https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-ASN&license_key=YOUR_NEW_KEY&suffix=tar.gz" -o data/GeoLite2-ASN.tar.gz
```

### Étape 3 : Extraire la Base de Données

Une fois le fichier téléchargé :

```bash
# Aller dans le répertoire data
cd data

# Extraire le fichier .tar.gz
tar -xzf GeoLite2-ASN.tar.gz

# Trouver le fichier .mmdb
find . -name "*.mmdb"

# Copier le fichier .mmdb à la racine de data/
cp GeoLite2-ASN_*/GeoLite2-ASN.mmdb ./

# Vérifier que le fichier existe
ls -lh GeoLite2-ASN.mmdb
```

Le fichier devrait faire environ **7-10 MB**.

### Étape 4 : Nettoyer les Fichiers Temporaires

```bash
# Supprimer le .tar.gz et le dossier extrait
rm -rf GeoLite2-ASN.tar.gz GeoLite2-ASN_*
```

---

## ✅ Vérification

Une fois le fichier `GeoLite2-ASN.mmdb` en place :

```bash
# Vérifier que le fichier existe et a la bonne taille
ls -lh data/GeoLite2-ASN.mmdb

# Devrait afficher quelque chose comme :
# -rw-r--r--  1 benoit  staff   7.2M Jan 30 17:00 data/GeoLite2-ASN.mmdb

# Vérifier le type de fichier
file data/GeoLite2-ASN.mmdb

# Devrait afficher :
# data/GeoLite2-ASN.mmdb: data
```

---

## 🧪 Tester l'Installation

```bash
node test-maxmind.js
```

Vous devriez voir :

```
✅ MaxMind initialized successfully
✅ PASS - Google DNS
✅ PASS - Cloudflare DNS
✅ PASS - OVH IP
✅ All tests passed!
```

---

## 🚀 Exécuter le Worker

Une fois les tests passés :

```bash
node scripts/worker.js
```

---

## 🆘 Problèmes Courants

### Erreur : "Invalid license key"

**Causes possibles** :
- La clé a expiré
- La clé a été révoquée
- La clé contient des espaces ou caractères invisibles
- Le compte MaxMind n'est pas activé

**Solution** :
1. Vérifier la clé sur https://www.maxmind.com/en/accounts/current/license-key
2. Générer une nouvelle clé si nécessaire
3. Télécharger manuellement via le site web (Option A)

### Erreur : "MaxMind database not found"

**Solution** :
```bash
# Vérifier que le fichier existe
ls -la data/GeoLite2-ASN.mmdb

# Si absent, télécharger manuellement (voir ci-dessus)
```

### Erreur : "Failed to load MaxMind database"

**Solution** :
```bash
# Vérifier les permissions
chmod 644 data/GeoLite2-ASN.mmdb

# Vérifier que le fichier n'est pas corrompu
file data/GeoLite2-ASN.mmdb
```

---

## 📞 Prochaines Étapes

1. ✅ Télécharger manuellement `GeoLite2-ASN.mmdb` depuis le site MaxMind
2. ✅ Placer le fichier dans `data/GeoLite2-ASN.mmdb`
3. ✅ Tester avec `node test-maxmind.js`
4. ✅ Exécuter le worker avec `node scripts/worker.js`

---

**Une fois le fichier en place, votre application sera prête à analyser TOUS les nœuds Solana ! 🚀**
