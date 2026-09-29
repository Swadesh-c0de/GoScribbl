package websocket

import "encoding/json"

type Message struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data,omitempty"`
}

type JoinRoomData struct {
	RoomID     string `json:"roomId"`
	PlayerName string `json:"playerName"`
}

type CreateRoomData struct {
	PlayerName string `json:"playerName"`
}

type GuessData struct {
	Text string `json:"text"`
}

type ChatData struct {
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
	Text       string `json:"text"`
}

type RoomInfoData struct {
	RoomID  string `json:"roomId"`
	Players []PlayerInfo `json:"players"`
}

type PlayerInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Score    int    `json:"score"`
	IsDrawer bool   `json:"isDrawer"`
}

type ErrorData struct {
	Message string `json:"message"`
}

type RoundStartData struct {
	Round       int    `json:"round"`
	DrawerID    string `json:"drawerId"`
	DrawerName  string `json:"drawerName"`
	WordLength  int    `json:"wordLength"`
	WordHint    string `json:"wordHint"`
}

type WordChoicesData struct {
	Words []string `json:"words"`
}

type CorrectGuessData struct {
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
	Points     int    `json:"points"`
}

type TimerUpdateData struct {
	TimeLeft int `json:"timeLeft"`
}

type RoundEndData struct {
	Word   string       `json:"word"`
	Scores []PlayerInfo `json:"scores"`
}

type GameOverData struct {
	Winner PlayerInfo   `json:"winner"`
	Scores []PlayerInfo `json:"scores"`
}

type LeaderboardData struct {
	Players []PlayerInfo `json:"players"`
}
