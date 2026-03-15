import pytest
import os
import shutil
import tempfile

@pytest.fixture
def temp_project():
    # Setup a temporary project directory
    prev_cwd = os.getcwd()
    tmp_dir = tempfile.mkdtemp()
    os.chdir(tmp_dir)
    
    # Initialize necessary directories
    os.makedirs(".memory", exist_ok=True)
    os.makedirs("hooks", exist_ok=True)
    os.makedirs("templates", exist_ok=True)
    
    yield tmp_dir
    
    os.chdir(prev_cwd)
    shutil.rmtree(tmp_dir)

@pytest.fixture
def mock_global_wisdom(monkeypatch):
    # Mock expansion of user home to a temp directory
    tmp_home = tempfile.mkdtemp()
    assa_global = os.path.join(tmp_home, ".gemini", "assa")
    os.makedirs(assa_global, exist_ok=True)
    
    monkeypatch.setenv("HOME", tmp_home)
    # Also handle expanduser directly if needed for the hook
    monkeypatch.setattr("os.path.expanduser", lambda x: tmp_home if x == "~" else x.replace("~", tmp_home))
    
    yield assa_global
    shutil.rmtree(tmp_home)
