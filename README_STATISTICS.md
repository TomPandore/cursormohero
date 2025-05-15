# Système de suivi des statistiques utilisateur

Ce module permet de suivre et d'afficher les statistiques des utilisateurs dans l'application Mohero, notamment:
- Les jours consécutifs d'activité
- Le total de jours complétés
- Les totaux d'exercices par catégorie (pompes, squats, respiration)

## Fonctionnement

### Structure de la base de données

1. **Nouvelles colonnes dans la table `profiles`**:
   - `consecutive_days`: Nombre de jours consécutifs d'activité
   - `total_days_completed`: Nombre total de jours complétés
   - `last_completed_day`: Date du dernier jour complété

2. **Nouvelle table `completed_days`**:
   - Enregistre l'historique des jours complétés
   - Permet de garder une trace des jours complétés par clan

3. **Nouveau champ `categorie` dans la table `exercices`**:
   - Permet de catégoriser les exercices (pompes, squats, respiration, autre)

### Fonctions principales

1. **`markDayAsCompleted(userId, clanId)`**:
   - Enregistre un jour comme complété par l'utilisateur
   - Met à jour les compteurs de jours consécutifs et le total de jours
   - Cette fonction est appelée automatiquement lors de la complétion d'un jour dans un programme

2. **`fetchUserStats(userId)`**:
   - Récupère toutes les statistiques d'un utilisateur
   - Calcule les totaux d'exercices par catégorie
   - Renvoie un objet `UserStats` avec toutes les statistiques

## Installation et initialisation

### 1. Appliquer les migrations

La migration `20250510000001_add_user_stats_tracking.sql` ajoute les champs et tables nécessaires.

```bash
# Si vous utilisez les migrations Supabase directement
supabase migration up # Ou votre commande habituelle pour les migrations
```

### 2. Exécuter le script d'initialisation

Ce script initialise le système en catégorisant les exercices existants et en configurant les compteurs de jours pour tous les utilisateurs.

```bash
# Depuis la racine du projet
node scripts/init-user-stats.js
```

## Utilisation pour les développeurs

### Marquer un jour comme complété

Lorsqu'un utilisateur termine tous les exercices d'un jour, vous pouvez marquer ce jour comme complété:

```typescript
import { markDayAsCompleted } from '@/lib/statsUtils';

// Dans une fonction async
await markDayAsCompleted(userId, clanId);
```

### Récupérer les statistiques utilisateur

Pour afficher les statistiques dans l'interface:

```typescript
import { fetchUserStats } from '@/lib/statsUtils';

// Dans une fonction async
const stats = await fetchUserStats(userId);
console.log(stats.consecutiveDays); // Jours consécutifs
console.log(stats.totalDaysCompleted); // Total de jours complétés
console.log(stats.totalPushups); // Total de pompes
console.log(stats.totalSquats); // Total de squats
console.log(stats.totalBreathingExercises); // Total d'exercices de respiration
```

## Aspects techniques

### Comment les jours consécutifs sont calculés

1. Lorsqu'un utilisateur complète un jour, on enregistre la date dans `last_completed_day`
2. Lors de la prochaine complétion, on vérifie si le dernier jour complété était la veille
3. Si oui, on incrémente `consecutive_days`, sinon on repart à 1

### Comment les exercices sont catégorisés

Les exercices sont catégorisés selon plusieurs critères:
- Le champ `categorie` explicite (prioritaire)
- Si absent, analyse du nom et du type d'exercice
- Recherche de mots-clés spécifiques (pompe, squat, respiration, etc.)

## Tests et débogage

Pour tester le système:

1. Complétez un jour dans un programme
2. Vérifiez dans la console les logs indiquant que le jour a été marqué comme complété
3. Consultez l'écran Totem pour voir les statistiques mises à jour

Si les statistiques ne s'affichent pas correctement:
- Vérifiez que les tables et colonnes existent dans la base de données
- Inspectez les logs pour détecter d'éventuelles erreurs
- Vérifiez que les exercices sont correctement catégorisés 