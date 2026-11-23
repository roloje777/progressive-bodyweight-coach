#!/usr/bin/env python3
"""Remove only verified redundant Expo Router copies of Program Engine test files."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    'ProgramEngine.e2e.test.ts': '6904028271e3f84a6259c4c86db7b9ef0c4204d26bff49622d1151c897b2cdeb',
    'ProgramEngineTestScreen.tsx': '52cc43f5e30246ad8901ec5c4fad069cf1862a3167bca64e613ddc3bf8164b7c',
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    if not (ROOT / 'package.json').is_file() or not (ROOT / 'app').is_dir():
        sys.exit('ERROR: Place/extract this patch in the PBH project root before running.')
    for filename, expected in FILES.items():
        retained = ROOT / 'dev-tools' / 'screens' / 'tests' / filename
        duplicate = ROOT / 'app' / 'screens' / 'tests' / filename
        if not retained.is_file() or digest(retained) != expected:
            sys.exit(f'ERROR: Retained Developer Tools copy is missing or modified: {retained}. No files removed.')
        if duplicate.is_file() and digest(duplicate) != expected:
            sys.exit(f'ERROR: App copy differs from inspected version: {duplicate}. No files removed.')
    for filename in FILES:
        duplicate = ROOT / 'app' / 'screens' / 'tests' / filename
        if duplicate.exists():
            duplicate.unlink()
            print(f'Removed: {duplicate.relative_to(ROOT)}')
        else:
            print(f'Already absent: {duplicate.relative_to(ROOT)}')
    print('Developer Tools copies retained. No engine or navigation logic changed.')

if __name__ == '__main__':
    main()
