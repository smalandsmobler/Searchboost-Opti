#!/bin/bash
# PHP Syntax Check Hook for Claude Code
# Uses php -l when available, falls back to regex pattern matching.

HOOK_DATA=$(cat)

FILE_PATH=$(echo "$HOOK_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# Only check PHP files
if [[ "$FILE_PATH" != *.php ]]; then
    echo '{"decision": "approve"}'
    exit 0
fi

# Try real php -l first (check brew path and system path)
PHP_BIN=""
if [ -x "$HOME/Downloads/brew-5.0.12/bin/php" ]; then
    PHP_BIN="$HOME/Downloads/brew-5.0.12/bin/php"
elif command -v php &>/dev/null; then
    PHP_BIN="php"
fi

if [ -n "$PHP_BIN" ]; then
    # Extract content and run php -l
    PHP_CONTENT=$(echo "$HOOK_DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('content', ''))
" 2>/dev/null)

    LINT_RESULT=$(echo "$PHP_CONTENT" | "$PHP_BIN" -l 2>&1)
    if [ $? -ne 0 ]; then
        ERROR_MSG=$(echo "$LINT_RESULT" | grep -i "error" | head -1)
        echo "{\"decision\": \"block\", \"reason\": \"PHP syntax error: $ERROR_MSG\"}"
        exit 0
    else
        echo '{"decision": "approve"}'
        exit 0
    fi
fi

# Fallback: regex-based checks when php binary not available
CONTENT=$(echo "$HOOK_DATA" | python3 -c "
import json, sys, re
data = json.load(sys.stdin)
content = data.get('tool_input', {}).get('content', '')

errors = []

# Check: missing opening PHP tag
if not content.strip().startswith('<?php') and not content.strip().startswith('<?'):
    errors.append('Saknar <?php opening tag')

# Check: unmatched braces
open_braces = content.count('{')
close_braces = content.count('}')
if abs(open_braces - close_braces) > 1:
    errors.append(f'Omatcha klammerparenteser: {open_braces} oppna vs {close_braces} stangda')

# Check: unmatched parentheses
open_parens = content.count('(')
close_parens = content.count(')')
if abs(open_parens - close_parens) > 1:
    errors.append(f'Omatcha parenteser: {open_parens} oppna vs {close_parens} stangda')

# Check: common fatal patterns
fatal_patterns = [
    (r'function\s+\w+\s*\([^)]*\)\s*\{[^}]*function\s+\w+', 'Nastad funktion i funktion'),
    (r'class\s+\w+\s*\{[^}]*class\s+\w+', 'Nastad class i class'),
]
for pattern, msg in fatal_patterns:
    if re.search(pattern, content, re.DOTALL):
        errors.append(msg)

if errors:
    msg = '; '.join(errors).replace('\"', '\\\\\"')
    print(json.dumps({'decision': 'block', 'reason': f'PHP-kontroll: {msg}'}))
else:
    print(json.dumps({'decision': 'approve'}))
" 2>/dev/null)

if [ -n "$CONTENT" ]; then
    echo "$CONTENT"
else
    echo '{"decision": "approve"}'
fi
