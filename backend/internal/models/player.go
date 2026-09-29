package models

type Player struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Score     int    `json:"score"`
	IsDrawer  bool   `json:"isDrawer"`
	HasGuessed bool  `json:"hasGuessed"`
}

func NewPlayer(id, name string) *Player {
	return &Player{
		ID:         id,
		Name:       name,
		Score:      0,
		IsDrawer:   false,
		HasGuessed: false,
	}
}
