package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

type Client struct {
	ID       string
	Name     string
	RoomID   string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan []byte
	SendJSON chan interface{}
	mu       sync.Mutex
}

func NewClient(id string, conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		ID:       id,
		Conn:     conn,
		Hub:      hub,
		Send:     make(chan []byte, 256),
		SendJSON: make(chan interface{}, 256),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		messageType, data, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		if messageType == websocket.BinaryMessage {
			// Handle binary draw data
			c.Hub.HandleBinaryMessage(c, data)
		} else if messageType == websocket.TextMessage {
			// Handle JSON messages
			var msg Message
			if err := json.Unmarshal(data, &msg); err != nil {
				log.Printf("JSON unmarshal error: %v", err)
				continue
			}
			c.Hub.HandleMessage(c, &msg)
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.BinaryMessage, message); err != nil {
				return
			}

		case message, ok := <-c.SendJSON:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) SendMessage(msg interface{}) {
	select {
	case c.SendJSON <- msg:
	default:
		log.Printf("Client %s send buffer full, dropping message", c.ID)
	}
}

func (c *Client) SendBinary(data []byte) {
	select {
	case c.Send <- data:
	default:
		log.Printf("Client %s binary send buffer full, dropping message", c.ID)
	}
}
