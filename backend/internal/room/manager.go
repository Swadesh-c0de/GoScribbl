package room

import (
	"encoding/json"
	"errors"
	"log"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/harshcodesdev/scrrblIX/internal/game"
	"github.com/harshcodesdev/scrrblIX/internal/websocket"
	"github.com/harshcodesdev/scrrblIX/pkg/constants"
)

type Manager struct {
	Rooms map[string]*Room
	mu    sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		Rooms: make(map[string]*Room),
	}
}

func (m *Manager) CreateRoom(client *websocket.Client, playerName string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	roomID := generateRoomID()
	room := NewRoom(roomID)
	room.AddPlayer(client, playerName)
	m.Rooms[roomID] = room

	log.Printf("Room %s created by %s", roomID, playerName)

	// Send room info to client
	m.sendRoomInfo(room, client)
	return nil
}

func (m *Manager) JoinRoom(client *websocket.Client, roomID, playerName string) error {
	m.mu.Lock()
	room, exists := m.Rooms[roomID]
	m.mu.Unlock()

	if !exists {
		return errors.New("room not found")
	}

	if room.IsFull() {
		return errors.New("room is full")
	}

	if room.GameState.IsActive {
		return errors.New("game already in progress")
	}

	room.AddPlayer(client, playerName)
	log.Printf("Player %s joined room %s", playerName, roomID)

	// Send room info to all players
	m.broadcastRoomInfo(room)
	return nil
}

func (m *Manager) LeaveRoom(client *websocket.Client) error {
	if client.RoomID == "" {
		return nil
	}

	m.mu.Lock()
	room, exists := m.Rooms[client.RoomID]
	m.mu.Unlock()

	if !exists {
		return nil
	}

	wasDrawer := false
	if room.GameState.IsActive && room.GameState.CurrentDrawer == client.ID {
		wasDrawer = true
	}

	room.RemovePlayer(client.ID)
	client.RoomID = ""

	log.Printf("Player %s left room %s", client.Name, room.ID)

	// Clean up empty room
	if room.IsEmpty() {
		m.mu.Lock()
		delete(m.Rooms, room.ID)
		m.mu.Unlock()
		log.Printf("Room %s deleted (empty)", room.ID)
		return nil
	}

	// If drawer left during game, end round early
	if wasDrawer && room.GameState.RoundStarted {
		room.GameState.EndRound()
		m.startNextRound(room)
	}

	// Broadcast updated player list
	m.broadcastRoomInfo(room)
	return nil
}

func (m *Manager) HandleStartGame(client *websocket.Client) error {
	m.mu.RLock()
	room, exists := m.Rooms[client.RoomID]
	m.mu.RUnlock()

	if !exists {
		return errors.New("room not found")
	}

	if room.GetPlayerCount() < constants.MinPlayersToStart {
		return errors.New("need at least 2 players to start")
	}

	if room.GameState.IsActive {
		return errors.New("game already in progress")
	}

	room.GameState.IsActive = true
	room.ResetScores()

	// Broadcast game started
	msg := websocket.Message{
		Type: constants.EventGameStarted,
	}
	room.Broadcast(msg)

	// Start first round
	m.startNextRound(room)
	return nil
}

func (m *Manager) HandleWordSelected(client *websocket.Client, word string) error {
	log.Printf("[WORD] HandleWordSelected called by client %s, word=%s", client.ID, word)

	m.mu.RLock()
	room, exists := m.Rooms[client.RoomID]
	m.mu.RUnlock()

	if !exists {
		log.Printf("[WORD] ERROR: room not found for client %s", client.ID)
		return errors.New("room not found")
	}

	log.Printf("[WORD] CurrentDrawer=%s, client.ID=%s", room.GameState.CurrentDrawer, client.ID)
	if room.GameState.CurrentDrawer != client.ID {
		log.Printf("[WORD] ERROR: client %s is not the drawer (drawer is %s)", client.ID, room.GameState.CurrentDrawer)
		return errors.New("only drawer can select word")
	}

	// Start the round with selected word
	log.Printf("[WORD] Starting round with word: %s", word)
	room.GameState.StartRound(client.ID, word, constants.RoundDuration)

	// Broadcast round start to all players
	roundData := websocket.RoundStartData{
		Round:      room.GameState.CurrentRound,
		DrawerID:   client.ID,
		DrawerName: client.Name,
		WordLength: len(word),
		WordHint:   room.GameState.WordHint,
	}

	msg := websocket.Message{
		Type: constants.EventRoundStart,
		Data: mustMarshal(roundData),
	}
	room.Broadcast(msg)

	// Send actual word to drawer
	drawerMsg := websocket.Message{
		Type: constants.EventWordSelected,
		Data: mustMarshal(word),
	}
	room.SendToPlayer(client.ID, drawerMsg)

	// Start timer in goroutine
	go room.GameState.StartTimer(
		constants.RoundDuration,
		func(timeLeft int) {
			timerMsg := websocket.Message{
				Type: constants.EventTimerUpdate,
				Data: mustMarshal(websocket.TimerUpdateData{TimeLeft: timeLeft}),
			}
			room.Broadcast(timerMsg)
		},
		func() {
			m.endRound(room)
		},
	)

	return nil
}

func (m *Manager) HandleGuess(client *websocket.Client, text string) error {
	m.mu.RLock()
	room, exists := m.Rooms[client.RoomID]
	m.mu.RUnlock()

	if !exists {
		return errors.New("room not found")
	}

	// Can't guess if drawer or already guessed
	if room.GameState.CurrentDrawer == client.ID {
		return nil
	}

	if room.GameState.HasGuessed(client.ID) {
		return nil
	}

	// Check if correct guess
	if strings.EqualFold(strings.TrimSpace(text), room.GameState.Word) {
		// Correct guess!
		guessOrder := room.GameState.GetGuessedCount()
		points := game.CalculateGuessPoints(room.GameState.TimeLeft, guessOrder)

		room.AddScore(client.ID, points)
		room.GameState.MarkGuessed(client.ID)

		// Broadcast correct guess
		correctMsg := websocket.Message{
			Type: constants.EventCorrectGuess,
			Data: mustMarshal(websocket.CorrectGuessData{
				PlayerID:   client.ID,
				PlayerName: client.Name,
				Points:     points,
			}),
		}
		room.Broadcast(correctMsg)

		// Check if all non-drawers have guessed
		nonDrawerCount := room.GetNonDrawerCount()
		if room.GameState.GetGuessedCount() >= nonDrawerCount {
			m.endRound(room)
		}
	} else {
		// Wrong guess - broadcast as chat
		chatMsg := websocket.Message{
			Type: constants.EventChat,
			Data: mustMarshal(websocket.ChatData{
				PlayerID:   client.ID,
				PlayerName: client.Name,
				Text:       text,
			}),
		}
		room.Broadcast(chatMsg)
	}

	return nil
}

func (m *Manager) BroadcastDrawToRoom(roomID string, data []byte, excludeClientID string) {
	m.mu.RLock()
	room, exists := m.Rooms[roomID]
	m.mu.RUnlock()

	if !exists {
		return
	}

	room.BroadcastBinaryExcept(data, excludeClientID)
}

func (m *Manager) BroadcastClearCanvas(roomID string) {
	m.mu.RLock()
	room, exists := m.Rooms[roomID]
	m.mu.RUnlock()

	if !exists {
		return
	}

	msg := websocket.Message{
		Type: constants.EventClearCanvas,
	}
	room.Broadcast(msg)
}

func (m *Manager) startNextRound(room *Room) {
	log.Printf("[ROUND] startNextRound called for room %s, currentRound=%d, totalRounds=%d",
		room.ID, room.GameState.CurrentRound, room.GameState.TotalRounds)

	room.ResetRoundState()

	// Check if game is over
	if room.GameState.IsGameOver() {
		log.Printf("[ROUND] Game is over, ending game")
		m.endGame(room)
		return
	}

	// Get next drawer
	drawerID, drawerName := room.GetNextDrawer()
	log.Printf("[ROUND] Next drawer: ID=%s, Name=%s", drawerID, drawerName)
	if drawerID == "" {
		log.Printf("[ROUND] ERROR: No drawer found!")
		return
	}

	// Set current drawer in game state so HandleWordSelected can validate
	room.GameState.CurrentDrawer = drawerID
	log.Printf("[ROUND] Set GameState.CurrentDrawer = %s", drawerID)

	// Get word choices
	words := game.GetRandomWords(constants.WordChoiceCount)
	log.Printf("[ROUND] Word choices: %v", words)

	// Send word choices to drawer
	choicesMsg := websocket.Message{
		Type: constants.EventWordChoices,
		Data: mustMarshal(websocket.WordChoicesData{Words: words}),
	}
	log.Printf("[ROUND] Sending word_choices to drawer %s", drawerID)
	room.SendToPlayer(drawerID, choicesMsg)

	// Notify others that drawer is choosing
	roundData := websocket.RoundStartData{
		Round:      room.GameState.CurrentRound + 1,
		DrawerID:   drawerID,
		DrawerName: drawerName,
		WordLength: 0,
		WordHint:   "",
	}
	msg := websocket.Message{
		Type: constants.EventNextRound,
		Data: mustMarshal(roundData),
	}
	room.BroadcastExcept(msg, drawerID)
}

func (m *Manager) endRound(room *Room) {
	log.Printf("[ROUND] endRound called, RoundStarted=%v", room.GameState.RoundStarted)
	if !room.GameState.RoundStarted {
		log.Printf("[ROUND] Round not started, skipping endRound")
		return
	}

	// Award drawer points
	correctGuesses := room.GameState.GetGuessedCount()
	totalPlayers := room.GetPlayerCount()
	drawerPoints := game.CalculateDrawerPoints(correctGuesses, totalPlayers)
	room.AddScore(room.GameState.CurrentDrawer, drawerPoints)

	word := room.GameState.Word
	room.GameState.EndRound()

	// Broadcast round end with scores
	roundEndMsg := websocket.Message{
		Type: constants.EventRoundEnd,
		Data: mustMarshal(websocket.RoundEndData{
			Word:   word,
			Scores: room.GetPlayerList(),
		}),
	}
	room.Broadcast(roundEndMsg)

	// Start next round after delay (handled by client)
	m.startNextRound(room)
}

func (m *Manager) endGame(room *Room) {
	room.GameState.IsActive = false

	players := room.GetPlayerList()

	// Find winner
	var winner websocket.PlayerInfo
	maxScore := -1
	for _, p := range players {
		if p.Score > maxScore {
			maxScore = p.Score
			winner = p
		}
	}

	gameOverMsg := websocket.Message{
		Type: constants.EventGameOver,
		Data: mustMarshal(websocket.GameOverData{
			Winner: winner,
			Scores: players,
		}),
	}
	room.Broadcast(gameOverMsg)
}

func (m *Manager) sendRoomInfo(room *Room, client *websocket.Client) {
	msg := websocket.Message{
		Type: constants.EventRoomInfo,
		Data: mustMarshal(websocket.RoomInfoData{
			RoomID:  room.ID,
			Players: room.GetPlayerList(),
		}),
	}
	client.SendMessage(msg)
}

func (m *Manager) broadcastRoomInfo(room *Room) {
	msg := websocket.Message{
		Type: constants.EventRoomInfo,
		Data: mustMarshal(websocket.RoomInfoData{
			RoomID:  room.ID,
			Players: room.GetPlayerList(),
		}),
	}
	room.Broadcast(msg)
}

func generateRoomID() string {
	return uuid.New().String()[:8]
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}
