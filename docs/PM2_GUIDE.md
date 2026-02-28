# 🤖 Guide : Exécution Automatique du Worker

## Qu'est-ce que PM2 ?

**PM2** est un gestionnaire de processus pour Node.js qui permet de :
- ✅ Exécuter des scripts automatiquement à intervalles réguliers (comme un cron)
- ✅ Redémarrer automatiquement en cas d'erreur
- ✅ Gérer les logs
- ✅ Démarrer automatiquement au démarrage de votre Mac

## 📋 Installation et Configuration

### 1. Installer PM2 (une seule fois)

```bash
npm install -g pm2
```

### 2. Démarrer le worker automatique

```bash
cd /Users/benoit/App\ track\ OVH\ footprint\ solana/ovh-solana-tracker
pm2 start ecosystem.config.js
```

**Résultat :** Le worker s'exécutera automatiquement **toutes les heures** (à la minute 0).

### 3. Vérifier que ça fonctionne

```bash
# Voir l'état du worker
pm2 status

# Voir les logs en temps réel
pm2 logs ovh-solana-worker

# Voir les logs récents
pm2 logs ovh-solana-worker --lines 50
```

### 4. Sauvegarder la configuration (pour redémarrage automatique)

```bash
# Sauvegarder la liste des processus
pm2 save

# Configurer le démarrage automatique au boot
pm2 startup
```

**Important :** Après `pm2 startup`, PM2 vous donnera une commande à copier-coller. Exécutez-la pour activer le démarrage automatique.

## 🎯 Commandes Utiles

```bash
# Arrêter le worker
pm2 stop ovh-solana-worker

# Redémarrer le worker
pm2 restart ovh-solana-worker

# Supprimer le worker de PM2
pm2 delete ovh-solana-worker

# Voir tous les processus PM2
pm2 list

# Voir les logs
pm2 logs

# Vider les logs
pm2 flush
```

## 📊 Calendrier d'Exécution

Avec la configuration actuelle (`cron_restart: '0 * * * *'`) :

```
00:00 → Worker s'exécute
01:00 → Worker s'exécute
02:00 → Worker s'exécute
...
23:00 → Worker s'exécute
```

**Le worker analyse 500 nœuds Solana toutes les heures et met à jour le cache.**

## 🔧 Modifier la Fréquence

Pour changer la fréquence, éditez `ecosystem.config.js` :

```javascript
// Toutes les heures (actuel)
cron_restart: '0 * * * *'

// Toutes les 30 minutes
cron_restart: '*/30 * * * *'

// Toutes les 2 heures
cron_restart: '0 */2 * * *'

// Une fois par jour à 3h du matin
cron_restart: '0 3 * * *'
```

Puis redémarrez PM2 :
```bash
pm2 restart ovh-solana-worker
```

## 🚨 Dépannage

### Le worker ne démarre pas

```bash
# Vérifier les logs d'erreur
pm2 logs ovh-solana-worker --err

# Tester le worker manuellement
npm run worker
```

### Les logs sont trop volumineux

```bash
# Vider les logs
pm2 flush

# Configurer la rotation des logs
pm2 install pm2-logrotate
```

## 📝 Résumé

1. **Installer PM2** : `npm install -g pm2`
2. **Démarrer** : `pm2 start ecosystem.config.js`
3. **Sauvegarder** : `pm2 save`
4. **Auto-démarrage** : `pm2 startup` (puis exécuter la commande affichée)
5. **Vérifier** : `pm2 status` et `pm2 logs`

**C'est tout ! Votre worker s'exécutera automatiquement toutes les heures. 🎉**
