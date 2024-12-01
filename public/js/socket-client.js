class SocketClient {
    constructor(port) {
        this.port = port;
        this.socket = null;
        this.socketId = localStorage.getItem('socketId');
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second delay
        this.handlers = new Map();
        
        this.connect();
    }

    connect() {
        try {
            this.socket = new WebSocket(`ws://${window.location.hostname}:${this.port}`);
            
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                
                // If we have a stored socket ID, send it to the server
                if (this.socketId) {
                    this.send('restore_session', { socketId: this.socketId });
                }
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Handle socket ID messages
                    if (data.type === 'socket_id') {
                        this.socketId = data.id;
                        localStorage.setItem('socketId', data.id);
                        return;
                    }

                    console.log('Received message:', data);
                    const expiresAt = new Date(data.expiresAt);
                    if (expiresAt < new Date(Date.now() - 3600 * 1000)) {
                        console.error('Token expires in less than 1 hour');
                        return;
                    } else {
                        console.log("Token expires in " + (expiresAt - Date.now()) / 1000 + " seconds");
                    }
                    
                    // Handle other message types
                    if (this.handlers.has(data.type)) {
                        this.handlers.get(data.type)(data);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.handleDisconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.handleDisconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            this.handleDisconnect();
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            // Exponential backoff for reconnect delay
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
            
            this.reconnectDelay *= 2; // Double the delay for next attempt
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    send(type, data = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type,
                ...data
            }));
        } else {
            console.error('Socket is not connected');
        }
    }

    on(type, handler) {
        this.handlers.set(type, handler);
    }

    off(type) {
        this.handlers.delete(type);
    }
}

// Initialize socket client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // The websocketPort variable should be set in your template
    if (typeof websocketPort !== 'undefined') {
        window.socketClient = new SocketClient(websocketPort);
    } else {
        console.error('WebSocket port not defined');
    }
});
