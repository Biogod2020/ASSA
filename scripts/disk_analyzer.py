import pathlib
import os

def get_dir_size(path):
    # Use standard pathlib
    return sum(f.stat().st_size for f in pathlib.Path(path).glob('**/*') if f.is_file())

if __name__ == "__main__":
    print(f"Total Workspace Size: {get_dir_size('.')} bytes")
