import WebSocket, { WebSocketServer } from "ws";

const PORT: number = 8080;

// Create a WebSocket server
const server: WebSocketServer = new WebSocketServer({ port: PORT });

server.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  // function for sending messages from server
  const sendMessage = (message: string, delay: number): void => {
    setTimeout(() => {
      ws.send(message);
      console.log(`Sent: ${message}`);
    }, delay);
  };

  // Send messages with specified delays
  sendMessage("hello", 2000);
  sendMessage("still here?", 5000);

  const leaveMessages: string[] = [
    "you can leave now",
    "you can leave now",
    "you can leave now",
    "you can leave now",
  ];

  leaveMessages.forEach((msg: string, index: number) => {
    //   use index in leaveMessages to increase time between messages
    sendMessage(msg, 8500 + index * 3500);
  });

  ws.on("close", (): void => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);

// Delay client connection to ensure server is ready
setTimeout(() => {
  class Protocol {
    private expectedMessages: { message: string; time: number }[] = [];
    private socket: WebSocket;
    private lastReceivedTime: number | null = null;
    private startTime: number;

    constructor(url: string) {
      this.socket = new WebSocket(url);
      this.startTime = Date.now();

      this.socket.on("open", (): void => {
        console.log("Connected to server");
      });

      this.socket.on("message", (data: WebSocket.RawData): void => {
        this.handleMessage(data.toString());
      });
    }

    setupProtocol(): void {
      this.expectedMessages = [
        { message: "hello", time: 2000 },
        { message: "still here?", time: 5000 },
        { message: "you can leave now", time: 8500 },
        { message: "you can leave now", time: 12000 },
        { message: "you can leave now", time: 15500 },
        { message: "you can leave now", time: 19000 },
      ];
    }

    handleMessage(message: string): void {
      const receivedTime: number = Date.now() - this.startTime;
      const expected = this.expectedMessages.shift();

      if (!expected) {
        console.error(`Unexpected message received: ${message}`);
        return;
      }

      const lowerBound: number = expected.time - 300;
      const upperBound: number = expected.time + 300;

      //  console.log(
      //    ` Received "${message}" at ${receivedTime}ms (Expected: ${expected.time}ms)`
      //  );

      if (receivedTime >= lowerBound && receivedTime <= upperBound) {
        console.info(
          `Protocol OK: ${message} received at ${new Date().toISOString()}`
        );
      } else {
        console.error(
          `Protocol ERR: expected "${expected.message}" between ${lowerBound} and ${upperBound}, but got it at ${receivedTime}`
        );
        this.socket.close();
      }
    }
  }

  const protocol: Protocol = new Protocol(`ws://localhost:${PORT}`);
  protocol.setupProtocol();
}, 1000); // Wait 1 second before starting client
