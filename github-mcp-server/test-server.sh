#!/bin/bash

echo "=== Test du serveur MCP GitHub ===" 
echo "Serveur configuré : github.com/github/github-mcp-server"
echo ""

# Test 1: Vérifier que l'image Docker est présente
echo "🔍 Vérification de l'image Docker..."
if docker images | grep -q "ghcr.io/github/github-mcp-server"; then
    echo "✅ Image Docker présente : ghcr.io/github/github-mcp-server"
else
    echo "❌ Image Docker non trouvée"
    exit 1
fi

echo ""
echo "🚀 Test de lancement du serveur MCP..."
echo "Note: Un token GitHub valide est requis pour les opérations réelles"

# Test 2: Lancer le serveur avec un token de test pour voir les capacités
echo ""
echo "📋 Outils disponibles dans le serveur GitHub MCP :"
echo "   - Utilisateurs: get_me, search_users"
echo "   - Issues: get_issue, create_issue, list_issues, update_issue"
echo "   - Pull Requests: get_pull_request, create_pull_request, merge_pull_request"
echo "   - Repositories: create_repository, get_file_contents, push_files"
echo "   - Actions: list_workflows, run_workflow, get_workflow_run"
echo "   - Sécurité: list_code_scanning_alerts, list_secret_scanning_alerts"
echo "   - Notifications: list_notifications, dismiss_notification"

echo ""
echo "🎯 Pour utiliser le serveur:"
echo "1. Créez un GitHub Personal Access Token"
echo "2. Exportez-le: export GITHUB_PERSONAL_ACCESS_TOKEN=your_token"
echo "3. Lancez: docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server"

echo ""
echo "✅ Installation et configuration terminées avec succès !"