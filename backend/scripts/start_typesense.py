"""
Start Typesense server via Docker.

Usage:
    cd backend
    python -m scripts.start_typesense          # foreground (Ctrl+C to stop)
    python -m scripts.start_typesense --detach  # background (docker stop typesense)

Typesense data is persisted in backend/typesense-data/ so it survives restarts.
"""

import os
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

TYPESENSE_VERSION = "30.1"
CONTAINER_NAME = "typesense"
IMAGE = f"typesense/typesense:{TYPESENSE_VERSION}"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "typesense-data")
API_KEY = "xyz"  # Default dev API key – matches .env
PORT = 8108


def _run(cmd: list[str], check: bool = True, capture: bool = False):
    """Run a subprocess command."""
    return subprocess.run(cmd, check=check, capture_output=capture, text=True)


def _container_running() -> bool:
    """Check if the Typesense container is already running."""
    result = _run(["docker", "inspect", "-f", "{{.State.Running}}", CONTAINER_NAME], check=False, capture=True)
    return result.returncode == 0 and "true" in result.stdout.lower()


def _pull_image():
    """Pull the Typesense Docker image if not already present."""
    logger.info(f"Pulling Docker image: {IMAGE}")
    _run(["docker", "pull", IMAGE])


def start_typesense(detach: bool = False):
    """Start Typesense in Docker."""
    # Check Docker is available
    try:
        _run(["docker", "info"], capture=True)
    except FileNotFoundError:
        logger.error("Docker is not installed or not in PATH.")
        sys.exit(1)
    except subprocess.CalledProcessError:
        logger.error("Docker daemon is not running. Start Docker Desktop first.")
        sys.exit(1)

    # If container already running, just report
    if _container_running():
        logger.info(f"Typesense container '{CONTAINER_NAME}' is already running on port {PORT}")
        logger.info(f"  Stop:   docker stop {CONTAINER_NAME}")
        logger.info(f"  Logs:   docker logs -f {CONTAINER_NAME}")
        return

    # Remove any stopped container with the same name
    _run(["docker", "rm", "-f", CONTAINER_NAME], check=False, capture=True)

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    _pull_image()

    cmd = [
        "docker", "run",
        "--name", CONTAINER_NAME,
        "-p", f"{PORT}:{PORT}",
        "-v", f"{DATA_DIR}:/data",
        "--restart", "unless-stopped",
    ]

    if detach:
        cmd.append("-d")

    cmd.extend([
        IMAGE,
        "--data-dir=/data",
        f"--api-key={API_KEY}",
        f"--api-port={PORT}",
        "--enable-cors",
    ])

    logger.info(f"Starting Typesense {TYPESENSE_VERSION} via Docker...")
    logger.info(f"  Container : {CONTAINER_NAME}")
    logger.info(f"  Port      : {PORT}")
    logger.info(f"  Data dir  : {DATA_DIR}")
    logger.info(f"  API key   : {API_KEY}")
    if detach:
        logger.info("  Mode      : detached (background)")
    else:
        logger.info("  Mode      : foreground (Ctrl+C to stop)")

    logger.info("")

    try:
        _run(cmd)
        if detach:
            logger.info(f"Typesense running at http://localhost:{PORT}")
            logger.info(f"  Stop:  docker stop {CONTAINER_NAME}")
            logger.info(f"  Logs:  docker logs -f {CONTAINER_NAME}")
    except KeyboardInterrupt:
        logger.info("\nStopping Typesense...")
        _run(["docker", "stop", CONTAINER_NAME], check=False)
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to start Typesense: {e}")
        sys.exit(1)


if __name__ == "__main__":
    detach = "--detach" in sys.argv or "-d" in sys.argv
    start_typesense(detach=detach)
