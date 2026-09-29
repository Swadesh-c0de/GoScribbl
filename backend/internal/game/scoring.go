package game

import "github.com/harshcodesdev/scrrblIX/pkg/constants"

// CalculateGuessPoints calculates points for a correct guess
// Earlier guesses get more points, based on time remaining
func CalculateGuessPoints(timeLeft int, guessOrder int) int {
	// Base points: 100-500 based on time remaining
	// timeLeft is 0-60, so we scale it
	timeBonus := (timeLeft * 400) / constants.RoundDuration
	basePoints := 100 + timeBonus

	// Order penalty: first guesser gets full points, subsequent get less
	orderPenalty := guessOrder * 20
	if orderPenalty > 100 {
		orderPenalty = 100
	}

	points := basePoints - orderPenalty
	if points < 50 {
		points = 50
	}

	return points
}

// CalculateDrawerPoints calculates bonus points for the drawer
// Based on how many players guessed correctly
func CalculateDrawerPoints(correctGuesses int, totalPlayers int) int {
	if correctGuesses == 0 {
		return 0
	}

	// Drawer gets points based on percentage of players who guessed
	percentage := float64(correctGuesses) / float64(totalPlayers-1) // -1 for drawer
	basePoints := int(percentage * 200)

	// Bonus if everyone guessed
	if correctGuesses == totalPlayers-1 {
		basePoints += 50
	}

	return basePoints
}
