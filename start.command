#!/bin/bash
# Lanceur Amazon Retour — double-clique ce fichier pour démarrer le dashboard.
cd "/Users/weiszmichael/Desktop/DEV/claude_shapeheart/AMZ - retour" || exit 1

# S'assurer que node/npm sont dans le PATH (Homebrew ou nvm)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm introuvable. Ouvre ce dossier dans ton terminal habituel et lance 'npm run dev'."
  echo "Appuie sur une touche pour fermer."; read -n 1; exit 1
fi

if [ ! -d node_modules ]; then
  echo "📦 Installation des dépendances (1ère fois seulement, ~1 min)..."
  npm install || { echo "Échec de l'installation."; read -n 1; exit 1; }
fi

# Ouvre le navigateur dès que le serveur répond
( for i in $(seq 1 40); do
    if curl -s http://localhost:3007/amazon-retour >/dev/null 2>&1; then
      open "http://localhost:3007/amazon-retour"; break
    fi
    sleep 2
  done ) &

echo ""
echo "🚀 Démarrage du dashboard Amazon Retour..."
echo "   → http://localhost:3007/amazon-retour s'ouvrira tout seul."
echo "   ⚠️  GARDE CETTE FENÊTRE OUVERTE tant que tu utilises le dashboard."
echo ""
npm run dev
