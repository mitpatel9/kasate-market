/**
 * Custom Next.js Server with Socket.IO
 * Run with: node server.js
 *
 * Make sure package.json has:
 * "scripts": {
 *   "server": "node server.js"
 * }
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketServer = require("./sockets/socketServer");
const logger = require("./utils/logger");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    // Create HTTP server
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
        } catch (err) {
            console.error("Error handling request:", err);
            res.statusCode = 500;
            res.end("Internal server error");
        }
    });

    // Initialize Socket.IO
    socketServer.init(server);
    logger.info("[Server] Socket.IO initialized");

    // Start server
    server.listen(port, (err) => {
        if (err) throw err;
        logger.info(`[Server] Server running on http://${hostname}:${port}`);
        logger.info("[Server] Connected users: 0 | Markets active: 0");
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
        logger.warn("[Server] SIGTERM received, shutting down gracefully");
        server.close(() => {
            logger.info("[Server] Server closed");
            process.exit(0);
        });
    });
});
