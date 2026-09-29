package constants

const (
	// Connection events
	EventConnect    = "connect"
	EventDisconnect = "disconnect"

	// Room events
	EventCreateRoom = "create_room"
	EventJoinRoom   = "join_room"
	EventLeaveRoom  = "leave_room"
	EventRoomInfo   = "room_info"
	EventPlayerList = "player_list"

	// Game events
	EventStartGame    = "start_game"
	EventGameStarted  = "game_started"
	EventNextRound    = "next_round"
	EventRoundStart   = "round_start"
	EventRoundEnd     = "round_end"
	EventGameOver     = "game_over"
	EventWordChoices  = "word_choices"
	EventWordSelected = "word_selected"
	EventTimerUpdate  = "timer_update"

	// Drawing events (binary protocol)
	EventDraw       = "draw"
	EventClearCanvas = "clear_canvas"

	// Guess/Chat events
	EventGuess        = "guess"
	EventCorrectGuess = "correct_guess"
	EventChat         = "chat"

	// Scoreboard events
	EventScoreUpdate = "score_update"
	EventLeaderboard = "leaderboard"

	// Error events
	EventError = "error"
)

// Message types for binary protocol
const (
	MsgTypeDraw       byte = 0x01
	MsgTypeClear      byte = 0x02
	MsgTypeDrawBatch  byte = 0x03
)

// Game configuration
const (
	MaxPlayersPerRoom = 5
	RoundsPerGame     = 3
	RoundDuration     = 60 // seconds
	CanvasWidth       = 800
	CanvasHeight      = 600
	MinPlayersToStart = 2
	WordChoiceCount   = 3
	BatchIntervalMs   = 16 // ~60 FPS
)
