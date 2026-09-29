package game

import (
	"encoding/json"
	"math/rand"
	"os"
	"time"
)

var defaultWords = []string{
	"apple", "banana", "car", "dog", "elephant",
	"flower", "guitar", "house", "ice cream", "jacket",
	"kite", "lion", "moon", "notebook", "orange",
	"piano", "queen", "rainbow", "sun", "tree",
	"umbrella", "violin", "watermelon", "xylophone", "yacht",
	"zebra", "airplane", "beach", "castle", "dragon",
	"eagle", "forest", "ghost", "hamburger", "island",
	"jungle", "kangaroo", "lighthouse", "mountain", "ninja",
	"octopus", "penguin", "robot", "snowman", "tornado",
	"unicorn", "volcano", "wizard", "butterfly", "camera",
	"diamond", "firework", "giraffe", "helicopter", "igloo",
	"jellyfish", "keyboard", "lemon", "mushroom", "necklace",
	"owl", "parachute", "rocket", "spider", "telescope",
	"treasure", "vampire", "whale", "angel", "balloon",
	"candle", "dolphin", "envelope", "feather", "globe",
	"hammer", "iceberg", "jigsaw", "koala", "ladder",
	"magnet", "nest", "onion", "pumpkin", "quilt",
	"river", "scissors", "thunder", "universe", "village",
	"window", "yogurt", "zipper", "anchor", "bridge",
	"clock", "drum", "earth", "flag", "grapes",
}

var words []string

func init() {
	rand.Seed(time.Now().UnixNano())
	words = defaultWords
}

func LoadWords(filepath string) error {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return err
	}
	
	var loadedWords []string
	if err := json.Unmarshal(data, &loadedWords); err != nil {
		return err
	}
	
	if len(loadedWords) > 0 {
		words = loadedWords
	}
	return nil
}

func GetRandomWords(count int) []string {
	if count > len(words) {
		count = len(words)
	}
	
	// Shuffle and pick first N
	shuffled := make([]string, len(words))
	copy(shuffled, words)
	
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})
	
	return shuffled[:count]
}

func GetRandomWord() string {
	return words[rand.Intn(len(words))]
}
