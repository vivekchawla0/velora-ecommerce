import sys
import os

# Delegate directly to app/evaluate.py
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.evaluate import print_evaluation_report

if __name__ == "__main__":
    print_evaluation_report()
