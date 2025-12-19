import sys
import traceback
import signal

sys.path.insert(0, 'src/backend')

def signal_handler(sig, frame):
    print('\n\nServer stopped by user')
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

try:
    print("Importing app...")
    import app
    
    print("Starting server on port 10000...")
    print("Server URL: http://localhost:10000")
    print("Press Ctrl+C to stop\n")
    
    app.socketio.run(
        app.app, 
        debug=False, 
        host='0.0.0.0', 
        port=10000,
        use_reloader=False
    )
except SystemExit as e:
    print(f"\n[EXIT] SystemExit with code: {e.code}")
    if e.code != 0:
        traceback.print_exc()
    input("\nPress Enter to exit...")
except KeyboardInterrupt:
    print("\n\n[STOP] Server stopped by user")
except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    print("\nFull traceback:")
    traceback.print_exc()
    input("\nPress Enter to exit...")
