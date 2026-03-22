#!/bin/bash

# Script de téléchargement manuel simplifié pour MaxMind GeoLite2-ASN
# Usage: ./download-maxmind-simple.sh

echo "🚀 Téléchargement de MaxMind GeoLite2-ASN"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Vérifier que le répertoire data existe
mkdir -p data

echo "📥 Veuillez suivre ces étapes :"
echo ""
echo "1. Ouvrez votre navigateur et allez sur :"
echo "   👉 https://www.maxmind.com/en/account/login"
echo ""
echo "2. Connectez-vous avec vos identifiants MaxMind"
echo ""
echo "3. Allez dans 'Download Files' :"
echo "   👉 https://www.maxmind.com/en/accounts/current/geoip/downloads"
echo ""
echo "4. Trouvez 'GeoLite2 ASN' et cliquez sur 'Download GZIP'"
echo ""
echo "5. Sauvegardez le fichier téléchargé dans :"
echo "   👉 $(pwd)/data/"
echo ""
echo "6. Une fois téléchargé, revenez ici et appuyez sur ENTRÉE"
echo ""

read -p "Appuyez sur ENTRÉE une fois le fichier téléchargé..."

echo ""
echo "📦 Recherche du fichier téléchargé..."

# Chercher le fichier .tar.gz dans data/
TAR_FILE=$(find data -name "GeoLite2-ASN*.tar.gz" -type f | head -n 1)

if [ -z "$TAR_FILE" ]; then
    echo "❌ Fichier .tar.gz non trouvé dans data/"
    echo ""
    echo "Veuillez télécharger le fichier et le placer dans :"
    echo "   $(pwd)/data/"
    exit 1
fi

echo "✅ Fichier trouvé : $TAR_FILE"
echo ""

echo "📦 Extraction du fichier..."
cd data
tar -xzf "$(basename $TAR_FILE)"

echo "🔍 Recherche du fichier .mmdb..."
MMDB_FILE=$(find . -name "GeoLite2-ASN.mmdb" -type f | head -n 1)

if [ -z "$MMDB_FILE" ]; then
    echo "❌ Fichier .mmdb non trouvé après extraction"
    exit 1
fi

echo "✅ Fichier .mmdb trouvé : $MMDB_FILE"
echo ""

echo "📋 Copie du fichier à la racine de data/..."
cp "$MMDB_FILE" ./GeoLite2-ASN.mmdb

echo "🧹 Nettoyage des fichiers temporaires..."
rm -rf GeoLite2-ASN_*
rm -f "$(basename $TAR_FILE)"

cd ..

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📊 Informations du fichier :"
ls -lh data/GeoLite2-ASN.mmdb
echo ""

echo "🧪 Pour tester l'installation, exécutez :"
echo "   node test-maxmind.js"
echo ""

echo "🚀 Pour exécuter le worker, exécutez :"
echo "   node scripts/worker.js"
echo ""
