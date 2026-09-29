package room

import (
	"log"
	"sync"

	"github.com/Swadesh-c0de/GoScribbl/internal/models"
	"github.com/Swadesh-c0de/GoScribbl/internal/websocket"
	"github.com/Swadesh-c0de/GoScribbl/pkg/constants"
)

type Room struct {
	ID        string
	Players   map[string]*models.Player
	Clients   map[string]*websocket.Client
	GameState *GameState

	// Player order for drawer rotation
	PlayerOrder []string
	DrawerIndex int

	mu sync.RWMutex
}

func NewRoom(id string) *Room {
	return &Room{
		ID:          id,
		Players:     make(map[string]*models.Player),
		Clients:     make(map[string]*websocket.Client),
		GameState:   NewGameState(constants.RoundsPerGame),
		PlayerOrder: make([]string, 0),
		DrawerIndex: -1,
	}
}

func (r *Room) AddPlayer(client *websocket.Client, name string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	player := models.NewPlayer(client.ID, name)
	r.Players[client.ID] = player
	r.Clients[client.ID] = client
	r.PlayerOrder = append(r.PlayerOrder, client.ID)

	client.RoomID = r.ID
	client.Name = name

	return nil
}

func (r *Room) RemovePlayer(clientID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.Players, clientID)
	delete(r.Clients, clientID)

	// Remove from player order
	for i, id := range r.PlayerOrder {
		if id == clientID {
			r.PlayerOrder = append(r.PlayerOrder[:i], r.PlayerOrder[i+1:]...)
			break
		}
	}

	// Adjust drawer index if needed
	if r.DrawerIndex >= len(r.PlayerOrder) {
		r.DrawerIndex = 0
	}
}

func (r *Room) GetPlayerCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.Players)
}

func (r *Room) IsFull() bool {
	return r.GetPlayerCount() >= constants.MaxPlayersPerRoom
}

func (r *Room) IsEmpty() bool {
	return r.GetPlayerCount() == 0
}

func (r *Room) GetNextDrawer() (string, string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.PlayerOrder) == 0 {
		return "", ""
	}

	r.DrawerIndex = (r.DrawerIndex + 1) % len(r.PlayerOrder)
	drawerID := r.PlayerOrder[r.DrawerIndex]

	// Mark as drawer
	for id, player := range r.Players {
		player.IsDrawer = (id == drawerID)
	}

	if player, ok := r.Players[drawerID]; ok {
		return drawerID, player.Name
	}
	return drawerID, ""
}

func (r *Room) GetPlayerList() []websocket.PlayerInfo {
	r.mu.RLock()
	defer r.mu.RUnlock()

	players := make([]websocket.PlayerInfo, 0, len(r.Players))
	for _, p := range r.Players {
		players = append(players, websocket.PlayerInfo{
			ID:       p.ID,
			Name:     p.Name,
			Score:    p.Score,
			IsDrawer: p.IsDrawer,
		})
	}
	return players
}

func (r *Room) Broadcast(msg interface{}) {
	r.mu.RLock()
	clients := make([]*websocket.Client, 0, len(r.Clients))
	for _, c := range r.Clients {
		clients = append(clients, c)
	}
	r.mu.RUnlock()

	for _, client := range clients {
		client.SendMessage(msg)
	}
}

func (r *Room) BroadcastExcept(msg interface{}, excludeID string) {
	r.mu.RLock()
	clients := make(map[string]*websocket.Client, len(r.Clients))
	for id, c := range r.Clients {
		clients[id] = c
	}
	r.mu.RUnlock()

	log.Printf("[ROOM] BroadcastExcept: excludeID=%s, totalClients=%d", excludeID, len(clients))
	for id, client := range clients {
		if id != excludeID {
			log.Printf("[ROOM] Sending to client %s", id)
			client.SendMessage(msg)
		} else {
			log.Printf("[ROOM] Skipping excluded client %s", id)
		}
	}
}

func (r *Room) BroadcastBinary(data []byte) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, client := range r.Clients {
		client.SendBinary(data)
	}
}

func (r *Room) BroadcastBinaryExcept(data []byte, excludeID string) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for id, client := range r.Clients {
		if id != excludeID {
			client.SendBinary(data)
		}
	}
}

func (r *Room) SendToPlayer(playerID string, msg interface{}) {
	r.mu.RLock()
	client := r.Clients[playerID]
	r.mu.RUnlock()

	log.Printf("[ROOM] SendToPlayer: playerID=%s, clientExists=%v", playerID, client != nil)
	if client != nil {
		client.SendMessage(msg)
	} else {
		log.Printf("[ROOM] ERROR: Client %s not found in room!", playerID)
	}
}

func (r *Room) AddScore(playerID string, points int) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if player, ok := r.Players[playerID]; ok {
		player.Score += points
	}
}

func (r *Room) ResetScores() {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, player := range r.Players {
		player.Score = 0
		player.HasGuessed = false
	}
}

func (r *Room) ResetRoundState() {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, player := range r.Players {
		player.HasGuessed = false
	}
}

func (r *Room) GetNonDrawerCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	count := 0
	for _, player := range r.Players {
		if !player.IsDrawer {
			count++
		}
	}
	return count
}
