#!/usr/bin/env python3
"""
CC Notify — macOS desktop notifications for Claude Code.
Uses osascript (built-in on macOS, no dependencies needed).
Plays a sound and shows a notification when Claude finishes a task or needs input.
"""
import json
import sys
import subprocess
import time
import os

# Track when tasks start
STATE_FILE = os.path.expanduser("~/.claude/hooks/.notify_state")

def notify(title, message, sound="Glass"):
    """Send macOS notification via osascript."""
    script = f'display notification "{message}" with title "{title}" sound name "{sound}"'
    try:
        subprocess.run(["osascript", "-e", script], timeout=5, capture_output=True)
    except Exception:
        pass

def play_sound(sound_name="Glass"):
    """Play a macOS system sound."""
    sound_path = f"/System/Library/Sounds/{sound_name}.aiff"
    if os.path.exists(sound_path):
        subprocess.Popen(["afplay", sound_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def get_duration():
    """Get duration since last prompt submit."""
    try:
        with open(STATE_FILE, "r") as f:
            start = float(f.read().strip())
        elapsed = time.time() - start
        if elapsed < 60:
            return f"{int(elapsed)}s"
        elif elapsed < 3600:
            return f"{int(elapsed/60)}m {int(elapsed%60)}s"
        else:
            return f"{int(elapsed/3600)}h {int(elapsed%3600/60)}m"
    except Exception:
        return ""

def main():
    hook_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    event = sys.argv[1] if len(sys.argv) > 1 else "unknown"

    if event == "prompt_submit":
        # Save timestamp when user submits prompt
        with open(STATE_FILE, "w") as f:
            f.write(str(time.time()))

    elif event == "stop":
        duration = get_duration()
        dur_text = f" ({duration})" if duration else ""
        stop_reason = hook_data.get("stop_reason", "")

        if stop_reason == "end_turn":
            notify("Claude klar", f"Uppgiften ar klar{dur_text}", "Glass")
            play_sound("Glass")
        elif stop_reason == "tool_use":
            # Don't notify on intermediate tool use
            pass
        else:
            notify("Claude stannade", f"Behover input{dur_text}", "Purr")
            play_sound("Purr")

    elif event == "error":
        notify("Claude fel", "Nagot gick fel", "Basso")
        play_sound("Basso")

    # Output empty JSON to not interfere with Claude
    print(json.dumps({}))

if __name__ == "__main__":
    main()
