import uvicorn
import os
import socket
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

def get_local_ip():
    """Detects computer's primary local IPv4 address on the Wi-Fi/LAN."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

def get_usable_port(preferred=8080):
    candidates = [preferred, 8001, 8008, 8888, 5000]
    for p in candidates:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(('0.0.0.0', p))
            s.close()
            return p
        except Exception:
            continue
    return preferred

if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    raw_port = int(os.getenv("BACKEND_PORT", "8080"))
    port = get_usable_port(raw_port)
    local_ip = get_local_ip()

    print(f"==================================================")
    print(f"   BookLoop AI Server Running (Multi-Device LAN)  ")
    print(f"==================================================")
    print(f"   Local Computer: http://localhost:{port}")
    print(f"   Mobile / Phone: http://{local_ip}:{port}")
    print(f"   API Swagger:    http://{local_ip}:{port}/docs")
    print(f"==================================================")
    uvicorn.run("backend.main:app", host=host, port=port, reload=True)
