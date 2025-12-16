import webview
import threading
import uvicorn
from app.main import app  # Import the FastAPI app

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")  # Use port 8000 to match main.py

if __name__ == "__main__":
    # Start FastAPI server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait a moment for server to start
    import time
    time.sleep(1)

    # Open PyWebView window pointing to the root URL which serves index.html
    webview.create_window(
        'Blue Gold Investment Bank',
        'http://127.0.0.1:8000/',  # Point to root URL where index.html is served
        width=1400,
        height=900,
        resizable=True,
        fullscreen=False
    )
    webview.start()