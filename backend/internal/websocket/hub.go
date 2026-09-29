package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/harshcodesdev/scrrblIX/pkg/constants"
)

type Hub struct {
	Clients    map[string]*Client
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex

	// Room manager will be injected
	RoomManager RoomManagerInterface
}

type RoomManagerInterface interface {
	CreateRoom(client *Client, playerName string) error
	JoinRoom(client *Client, roomID, playerName string) error
	LeaveRoom(client *Client) error
	HandleGuess(client *Client, text string) error
	HandleStartGame(client *Client) error
	HandleWordSelected(client *Client, word string) error
	BroadcastDrawToRoom(roomID string, data []byte, excludeClientID string)
	BroadcastClearCanvas(roomID string)
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[string]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) SetRoomManager(rm RoomManagerInterface) {
	h.RoomManager = rm
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.ID] = client
			h.mu.Unlock()
			log.Printf("Client %s connected", client.ID)

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client.ID]; ok {
				delete(h.Clients, client.ID)
				close(client.Send)
				close(client.SendJSON)
			}
			h.mu.Unlock()

			// Leave room if in one
			if client.RoomID != "" && h.RoomManager != nil {
				h.RoomManager.LeaveRoom(client)
			}
			log.Printf("Client %s disconnected", client.ID)
		}
	}
}

func (h *Hub) HandleMessage(client *Client, msg *Message) {
	switch msg.Type {
	case constants.EventCreateRoom:
		var data CreateRoomData
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			h.sendError(client, "Invalid create room data")
			return
		}
		if h.RoomManager != nil {
			if err := h.RoomManager.CreateRoom(client, data.PlayerName); err != nil {
				h.sendError(client, err.Error())
			}
		}

	case constants.EventJoinRoom:
		var data JoinRoomData
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			h.sendError(client, "Invalid join room data")
			return
		}
		if h.RoomManager != nil {
			if err := h.RoomManager.JoinRoom(client, data.RoomID, data.PlayerName); err != nil {
				h.sendError(client, err.Error())
			}
		}

	case constants.EventLeaveRoom:
		if h.RoomManager != nil {
			h.RoomManager.LeaveRoom(client)
		}

	case constants.EventStartGame:
		if h.RoomManager != nil {
			if err := h.RoomManager.HandleStartGame(client); err != nil {
				h.sendError(client, err.Error())
			}
		}

	case constants.EventGuess:
		var data GuessData
		if err := json.Unmarshal(msg.Data, &data); err != nil {
			h.sendError(client, "Invalid guess data")
			return
		}
		if h.RoomManager != nil {
			h.RoomManager.HandleGuess(client, data.Text)
		}

	case constants.EventWordSelected:
		var word string
		if err := json.Unmarshal(msg.Data, &word); err != nil {
			h.sendError(client, "Invalid word selection")
			return
		}
		if h.RoomManager != nil {
			h.RoomManager.HandleWordSelected(client, word)
		}

	case constants.EventClearCanvas:
		if h.RoomManager != nil && client.RoomID != "" {
			h.RoomManager.BroadcastClearCanvas(client.RoomID)
		}

	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

func (h *Hub) HandleBinaryMessage(client *Client, data []byte) {
	if client.RoomID == "" {
		return
	}

	if h.RoomManager != nil {
		// Broadcast draw data to room (excluding sender)
		h.RoomManager.BroadcastDrawToRoom(client.RoomID, data, client.ID)
	}
}

func (h *Hub) sendError(client *Client, message string) {
	errMsg := Message{
		Type: constants.EventError,
		Data: mustMarshal(ErrorData{Message: message}),
	}
	client.SendMessage(errMsg)
}

func (h *Hub) GetClient(id string) *Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.Clients[id]
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
