import express from "express";
import { OPEN, WebSocket, WebSocketServer } from "ws";
import { parse } from "url";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { createClient } from "redis";

const app = express();
const client = createClient();
client.on('error', (e) => { console.error("Redis client connection error", e) });

const httpServer = app.listen(8080, () => {
    console.log("Server is running on port 8080");
});

// Authentication function with types
const authenticate = (request: IncomingMessage): { isAuthenticated: boolean; userId?: string } => {
    const { token, userId } = parse(request.url || '', true).query;

    console.log("Parsed query:", { token, userId });

    // TODO: Actually authenticate token
    if (token === "abc") {
        return { isAuthenticated: true, userId: userId as string };
    }
    return { isAuthenticated: false };
};

const wss = new WebSocketServer({ noServer: true });

// Map to keep track of userId to WebSocket connection
const connections: Record<string, WebSocket> = {};

httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const { isAuthenticated, userId } = authenticate(request);

    if (!isAuthenticated) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(request, socket, head, (connection: WebSocket) => {
        socket.removeAllListeners('upgrade');

        if (userId) {
            // Store the connection associated with the userId
            connections[userId] = connection;
            console.log(`User connected: ${userId}`);

            connection.on('close', () => {
                // Remove connection on disconnect
                delete connections[userId];
                console.log(`User disconnected: ${userId}`);
            });

            connection.send("Hello! Socket connected!!");
        }

        connection.on('message', (data, isBinary) => {
            wss.clients.forEach((client) => {
                if (client.readyState === OPEN) {
                    client.send(data, { binary: isBinary });
                }
            });
        });

        connection.on('error', console.error);
    });
});

async function handleRedisMessages() {
    await client.connect();
    const pub = 'problems_done';
        await client.subscribe(pub, (message) => {
            const msg = JSON.parse(message);
            const userId = msg.userId;
            const status = msg.status;
    
            // Send the message to the specific userId's WebSocket connection
            const userConnection = connections[userId];
            if (userConnection && userConnection.readyState === OPEN) {
                userConnection.send(JSON.stringify({ status }));  // Sending the status to the specific user
                console.log(`Message sent to userId ${userId}:`, JSON.stringify({ status }));
            } else {
                console.log(`No active connection found for userId ${userId}`);
            }
        });
}

handleRedisMessages().catch(console.error);
