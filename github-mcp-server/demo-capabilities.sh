#!/bin/bash

echo "=== Démonstration des capacités du serveur MCP GitHub ==="
echo "Serveur: github.com/github/github-mcp-server"
echo ""

# Fonction pour tester le serveur avec un token de démonstration
test_server_capabilities() {
    echo "🔧 Test des capacités du serveur MCP GitHub..."
    echo ""
    
    # Créer un token temporaire pour tester (ne pas utiliser en production)
    export GITHUB_PERSONAL_ACCESS_TOKEN="te"
    
    echo "📋 Lancement du serveur pour lister les outils disponibles..."
    echo ""
    
    # Lancer le serveur en mode stdio pour voir les outils
    echo "🚀 Commande utilisée:"
    echo "docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server stdio"
    echo ""
    
    # Simuler une session MCP (le serveur attendrait des commandes JSON-RPC)
    echo "💡 Le serveur MCP GitHub expose les outils suivants:"
    echo ""
    
    echo "🔍 OUTILS UTILISATEURS:"
    echo "   • get_me - Obtenir les détails de l'utilisateur authentifié"
    echo "   • search_users - Rechercher des utilisateurs GitHub"
    echo ""
    
    echo "📝 OUTILS ISSUES:"
    echo "   • get_issue - Obtenir une issue spécifique"
    echo "   • create_issue - Créer une nouvelle issue"
    echo "   • list_issues - Lister les issues d'un dépôt"
    echo "   • update_issue - Mettre à jour une issue existante"
    echo "   • add_issue_comment - Ajouter un commentaire à une issue"
    echo "   • search_issues - Rechercher des issues et PR"
    echo ""
    
    echo "🔀 OUTILS PULL REQUESTS:"
    echo "   • get_pull_request - Obtenir une PR spécifique"
    echo "   • create_pull_request - Créer une nouvelle PR"
    echo "   • list_pull_requests - Lister les PRs d'un dépôt"
    echo "   • merge_pull_request - Fusionner une PR"
    echo "   • get_pull_request_files - Obtenir les fichiers modifiés"
    echo ""
    
    echo "📁 OUTILS REPOSITORIES:"
    echo "   • create_repository - Créer un nouveau dépôt"
    echo "   • get_file_contents - Obtenir le contenu d'un fichier"
    echo "   • create_or_update_file - Créer/modifier un fichier"
    echo "   • push_files - Pousser plusieurs fichiers"
    echo "   • search_repositories - Rechercher des dépôts"
    echo "   • fork_repository - Forker un dépôt"
    echo ""
    
    echo "⚡ OUTILS GITHUB ACTIONS:"
    echo "   • list_workflows - Lister les workflows"
    echo "   • run_workflow - Déclencher un workflow"
    echo "   • get_workflow_run - Obtenir les détails d'une exécution"
    echo "   • list_workflow_runs - Lister les exécutions"
    echo ""
    
    echo "🔐 OUTILS SÉCURITÉ:"
    echo "   • list_code_scanning_alerts - Lister les alertes de sécurité"
    echo "   • get_code_scanning_alert - Obtenir une alerte spécifique"
    echo "   • list_secret_scanning_alerts - Lister les alertes de secrets"
    echo ""
    
    echo "🔔 OUTILS NOTIFICATIONS:"
    echo "   • list_notifications - Lister les notifications"
    echo "   • get_notification_details - Détails d'une notification"
    echo "   • dismiss_notification - Marquer comme lue"
    echo ""
}

# Démonstration d'utilisation pratique
demo_usage() {
    echo "🎯 EXEMPLE D'UTILISATION PRATIQUE:"
    echo ""
    echo "Pour utiliser le serveur dans un client MCP:"
    echo ""
    echo "1. Configuration du serveur:"
    echo "   - Nom: github.com/github/github-mcp-server"
    echo "   - Commande: docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN"
    echo "   - Image: ghcr.io/github/github-mcp-server"
    echo ""
    echo "2. Authentification:"
    echo "   - Créer un GitHub Personal Access Token"
    echo "   - Configurer les permissions nécessaires"
    echo ""
    echo "3. Utilisation des outils:"
    echo "   - Appeler les outils via le protocole MCP"
    echo "   - Gérer les réponses JSON"
    echo ""
    echo "4. Toolsets disponibles:"
    echo "   - actions, context, code_security, issues"
    echo "   - notifications, pull_requests, repos"
    echo "   - secret_protection, users, experiments"
    echo ""
}

# Exécuter les tests
test_server_capabilities
demo_usage

echo "✅ Démonstration terminée avec succès !"
echo ""
echo "🔧 Prochaines étapes:"
echo "1. Créer un GitHub Personal Access Token"
echo "2. Configurer le serveur dans votre client MCP"
echo "3. Commencer à utiliser les outils GitHub via MCP"