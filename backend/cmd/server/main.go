package main

import (
	"log"
	"os"

	"github.com/harshcodesdev/scrrblIX/internal/game"
	"github.com/harshcodesdev/scrrblIX/internal/server"
)

func main() {
	// Try to load custom words
	if err := game.LoadWords("data/words.json"); err != nil {
		log.Printf("Using default word list: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := server.NewServer()
	log.Printf("Server starting on :%s", port)

	if err := srv.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
