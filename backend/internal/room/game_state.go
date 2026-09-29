package room

import (
	"sync"
	"time"
)

type GameState struct {
	IsActive      bool
	CurrentRound  int
	TotalRounds   int
	CurrentDrawer string
	Word          string
	WordHint      string
	TimeLeft      int
	RoundStarted  bool
	
	// Track who has guessed correctly this round
	GuessedPlayers map[string]bool
	
	// Timer control
	timerStop chan struct{}
	mu        sync.Mutex
}

func NewGameState(totalRounds int) *GameState {
	return &GameState{
		IsActive:       false,
		CurrentRound:   0,
		TotalRounds:    totalRounds,
		GuessedPlayers: make(map[string]bool),
	}
}

func (gs *GameState) StartRound(drawerID, word string, duration int) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	
	gs.CurrentRound++
	gs.CurrentDrawer = drawerID
	gs.Word = word
	gs.WordHint = generateHint(word)
	gs.TimeLeft = duration
	gs.RoundStarted = true
	gs.GuessedPlayers = make(map[string]bool)
	gs.timerStop = make(chan struct{})
}

func (gs *GameState) EndRound() {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	
	gs.RoundStarted = false
	gs.Word = ""
	gs.WordHint = ""
	
	if gs.timerStop != nil {
		close(gs.timerStop)
		gs.timerStop = nil
	}
}

func (gs *GameState) MarkGuessed(playerID string) {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	gs.GuessedPlayers[playerID] = true
}

func (gs *GameState) HasGuessed(playerID string) bool {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	return gs.GuessedPlayers[playerID]
}

func (gs *GameState) GetGuessedCount() int {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	return len(gs.GuessedPlayers)
}

func (gs *GameState) IsGameOver() bool {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	return gs.CurrentRound >= gs.TotalRounds
}

func (gs *GameState) DecrementTimer() int {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	gs.TimeLeft--
	return gs.TimeLeft
}

func (gs *GameState) GetTimerStop() chan struct{} {
	gs.mu.Lock()
	defer gs.mu.Unlock()
	return gs.timerStop
}

func (gs *GameState) StartTimer(duration int, onTick func(int), onEnd func()) {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	
	stopChan := gs.GetTimerStop()
	if stopChan == nil {
		return
	}
	
	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			timeLeft := gs.DecrementTimer()
			onTick(timeLeft)
			if timeLeft <= 0 {
				onEnd()
				return
			}
		}
	}
}

func generateHint(word string) string {
	hint := make([]rune, len(word))
	for i, c := range word {
		if c == ' ' {
			hint[i] = ' '
		} else {
			hint[i] = '_'
		}
	}
	return string(hint)
}
