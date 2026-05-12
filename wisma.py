#!/usr/bin/env python3
"""
Wisma Bot - WhatsApp Message Handler
Simple wrapper that receives messages and returns responses via stdout
"""

import sys
import json

# Import from parent directory (for when running from wisma-bot)
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'wisma-bot'))

try:
    from handlers import WismaHandler
    from templates import menu_message
    from db import init_db

    handler = WismaHandler()
    init_db()

    def process_message(sender, message):
        """Process message and return response."""
        response = handler.handle_message(sender, message)
        if response:
            return response
        return "Maaf, terjadi kesalahan. Ketik *MENU* untuk mulai lagi."

    # Main loop - read from stdin
    if __name__ == "__main__":
        print("✅ Wisma Python bot initialized", file=sys.stderr)

        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue

            # Format: SENDER|MESSAGE
            if '|' in line:
                parts = line.split('|', 1)
                sender = parts[0]
                message = parts[1]

                response = process_message(sender, message)
                print(json.dumps({"sender": sender, "response": response}))
            else:
                # Just print menu for unknown format
                print(json.dumps({"response": menu_message()}))
except ImportError as e:
    print(f"⚠️ Import error: {e}", file=sys.stderr)
    print("Make sure wisma-bot folder is accessible")