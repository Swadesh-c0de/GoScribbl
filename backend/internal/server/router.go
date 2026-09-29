package server

import (
	"encoding/json"
	"net/http"

	"github.com/Swadesh-c0de/GoScribbl/internal/room"
	"github.com/Swadesh-c0de/GoScribbl/internal/websocket"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type Server struct {
	Hub         *websocket.Hub
	RoomManager *room.Manager
	Router      *gin.Engine
}

func NewServer() *Server {
	hub := websocket.NewHub()
	roomManager := room.NewManager()
	hub.SetRoomManager(roomManager)

	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	server := &Server{
		Hub:         hub,
		RoomManager: roomManager,
		Router:      router,
	}

	server.setupRoutes()
	return server
}

func (s *Server) setupRoutes() {
	// CORS middleware
	s.Router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health check
	s.Router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// WebSocket endpoint
	s.Router.GET("/ws", s.handleWebSocket)
}

func (s *Server) handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	clientID := uuid.New().String()
	client := websocket.NewClient(clientID, conn, s.Hub)

	s.Hub.Register <- client

	go client.WritePump()

	// Send the client their own ID immediately
	connectMsg := websocket.Message{
		Type: "connect",
		Data: mustMarshal(map[string]string{"playerId": clientID}),
	}
	client.SendMessage(connectMsg)

	go client.ReadPump()
}

func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}

func (s *Server) Run(addr string) error {
	go s.Hub.Run()
	return s.Router.Run(addr)
}
