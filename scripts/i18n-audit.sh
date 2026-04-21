#!/usr/bin/env bash
# Repeatable i18n / navigation inventory (report-only; always exits 0).
# Run: npm run i18n:audit
set +e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 0

echo "=========================================="
echo "Locaryx i18n audit — $(date -u +%Y-%m-%dT%H:%MZ)"
echo "=========================================="

echo ""
echo "1) Root-path href templates (candidates for withLocalePath)"
echo "   Scope: components/, app/[locale]/"
rg 'href=\{[`'"'"']/' components "app/[locale]" 2>/dev/null | head -200
echo "   (truncated at 200 lines; run rg locally for full list)"

echo ""
echo "2) router.push to root paths"
rg "router\.(push|replace)\(\s*['\`]/[^'\"]" components "app/[locale]" 2>/dev/null | head -80

echo ""
echo "3) Common French UI tokens (heuristic)"
rg -S 'Aucun|Veuillez|Impossible|Enregistrer|Annuler|Supprimer|Chargement|Erreur' \
  --glob '*.tsx' components "app/[locale]" 2>/dev/null | head -120

echo ""
echo "4) unstable_cache in lib/ (review locale in key/args if return has UI copy)"
rg 'unstable_cache\(' lib --glob '*.ts' 2>/dev/null

echo ""
echo "5) Client fetch to /api/ (ensure locale query when response includes translated copy)"
rg "fetch\(\s*['\`]/api/" components "app/[locale]" 2>/dev/null

echo ""
echo "Done. Fix findings in priority: navigation → messages → caches."
exit 0
