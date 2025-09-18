import asyncio
import websockets
import json

async def handler(websocket, path):
    print("Client connected")
    try:
        async for message in websocket:
            data = json.loads(message)
            print("Event received:", data)
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")

async def main():
    async with websockets.serve(handler, "localhost", 5001):
        print("WebSocket server running on ws://localhost:5001")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
