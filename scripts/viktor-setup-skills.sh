#!/bin/bash
# viktor-setup-skills.sh
# Installerar Searchboost skills på Viktors dator.
# Kör: bash scripts/viktor-setup-skills.sh
# Eller: bash scripts/viktor-setup-skills.sh /sökväg/till/uppackad-mapp

SKILLS_SOURCE="${1:-$HOME/Downloads/searchboost-skills}"
TARGET="$HOME/.claude/skills"

# Autodetektera rätt undermapp om zipen packade ut till .claude/skills/
if [ -d "$SKILLS_SOURCE/.claude/skills" ]; then
  SKILLS_SOURCE="$SKILLS_SOURCE/.claude/skills"
elif [ -d "$SKILLS_SOURCE/.claude" ]; then
  SKILLS_SOURCE="$SKILLS_SOURCE/.claude/skills"
fi

if [ ! -d "$SKILLS_SOURCE" ]; then
  echo "Fel: Ingen skills-mapp hittad."
  echo ""
  echo "Kontrollera att du packade upp searchboost-skills.zip i Downloads."
  echo "Försökte: $SKILLS_SOURCE"
  echo ""
  echo "Manuellt: bash viktor-setup-skills.sh ~/Downloads/searchboost-skills/.claude/skills"
  exit 1
fi

mkdir -p "$TARGET"

echo "Installerar skills från $SKILLS_SOURCE"
echo "Destination: $TARGET"
echo ""

count=0
for skill_dir in "$SKILLS_SOURCE"/*/; do
  skill_name=$(basename "$skill_dir")
  if [ -f "$skill_dir/SKILL.md" ]; then
    cp -r "$skill_dir" "$TARGET/"
    echo "  OK  $skill_name"
    ((count++))
  fi
done

echo ""
echo "$count skills installerade i $TARGET"
echo "Starta om Claude Code för att skills ska aktiveras."
echo ""
echo "Testa med: /seo-audit eller /ui-ux-pro-max i Claude"
