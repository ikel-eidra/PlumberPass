#!/usr/bin/env python3
"""
PlumberPass Setup Script
Sets up the development environment for both backend and frontend.
"""

import os
import subprocess
import sys
from pathlib import Path


def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{'=' * 60}")
    print(f"  {text}")
    print(f"{'=' * 60}\n")


def print_step(text: str) -> None:
    """Print a step indicator."""
    print(f"➜ {text}")


def run_command(command: list[str], cwd: Path | None = None) -> bool:
    """Run a shell command and return success status."""
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(e.stderr)
        return False
    except FileNotFoundError:
        print(f"Command not found: {command[0]}")
        return False


def check_python() -> bool:
    """Check if Python 3.8+ is installed."""
    print_step("Checking Python version...")
    
    if sys.version_info < (3, 8):
        print(f"❌ Python 3.8+ required, found {sys.version_info.major}.{sys.version_info.minor}")
        return False
    
    print(f"✓ Python {sys.version_info.major}.{sys.version_info.minor} found")
    return True


def check_node() -> bool:
    """Check if Node.js 16+ is installed."""
    print_step("Checking Node.js version...")
    
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        version = result.stdout.strip().lstrip("v")
        major = int(version.split(".")[0])
        
        if major < 16:
            print(f"❌ Node.js 16+ required, found {version}")
            return False
        
        print(f"✓ Node.js {version} found")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/")
        return False


def setup_backend(project_root: Path) -> bool:
    """Set up the Python backend."""
    print_header("Setting up Backend")
    
    backend_dir = project_root / "backend"
    venv_dir = backend_dir / ".venv"
    
    # Create virtual environment
    print_step("Creating Python virtual environment...")
    if not venv_dir.exists():
        if not run_command([sys.executable, "-m", "venv", str(venv_dir)]):
            return False
    else:
        print("  Virtual environment already exists")
    
    # Determine pip path
    if os.name == "nt":  # Windows
        pip_path = venv_dir / "Scripts" / "pip.exe"
        python_path = venv_dir / "Scripts" / "python.exe"
    else:  # macOS/Linux
        pip_path = venv_dir / "bin" / "pip"
        python_path = venv_dir / "bin" / "python"
    
    # Upgrade pip
    print_step("Upgrading pip...")
    if not run_command([str(python_path), "-m", "pip", "install", "--upgrade", "pip"]):
        return False
    
    # Install requirements
    print_step("Installing Python dependencies...")
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        if not run_command([str(pip_path), "install", "-r", str(requirements_file)]):
            return False
    else:
        print("  requirements.txt not found, skipping")
    
    print("✓ Backend setup complete!")
    return True


def setup_frontend(project_root: Path) -> bool:
    """Set up the Node.js frontend."""
    print_header("Setting up Frontend")
    
    frontend_dir = project_root / "frontend"
    
    # Check if package.json exists
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        print("⚠ package.json not found, skipping frontend setup")
        return True
    
    # Install dependencies
    print_step("Installing Node.js dependencies...")
    if not run_command(["npm", "install"], cwd=frontend_dir):
        return False
    
    print("✓ Frontend setup complete!")
    return True


def print_next_steps() -> None:
    """Print instructions for next steps."""
    print_header("Setup Complete! 🎉")
    
    print("Next steps:")
    print()
    print("  1. Start the backend:")
    if os.name == "nt":
        print("     cd backend && .venv\\Scripts\\uvicorn app.main:app --reload")
    else:
        print("     cd backend && .venv/bin/uvicorn app.main:app --reload")
    print()
    print("  2. In a new terminal, start the frontend:")
    print("     cd frontend && npm run dev")
    print()
    print("  3. Open your browser:")
    print("     Frontend: http://localhost:5173")
    print("     API Docs: http://localhost:8000/docs")
    print()
    print("Or use Make:")
    print("     make dev    # Start both servers")
    print()


def main() -> int:
    """Main setup function."""
    print_header("PlumberPass Setup")
    
    # Get project root
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent
    
    print(f"Project directory: {project_root}")
    print()
    
    # Check prerequisites
    checks_passed = True
    checks_passed &= check_python()
    checks_passed &= check_node()
    
    if not checks_passed:
        print("\n❌ Prerequisites not met. Please install the required software.")
        return 1
    
    print()
    
    # Setup backend
    if not setup_backend(project_root):
        print("\n❌ Backend setup failed!")
        return 1
    
    # Setup frontend
    if not setup_frontend(project_root):
        print("\n❌ Frontend setup failed!")
        return 1
    
    # Print next steps
    print_next_steps()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
