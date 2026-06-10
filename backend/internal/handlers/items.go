package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"oltush/internal/db"
	"oltush/internal/models"

	"github.com/go-chi/chi/v5"
)

func GetItems(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query("SELECT id, name, type, price_per_night, max_guests, is_active, description, photo_url, COALESCE(map_x,0), COALESCE(map_y,0) FROM items WHERE is_active = true ORDER BY id")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []models.Item{}
	for rows.Next() {
		var it models.Item
		var mapX, mapY float64
		if err := rows.Scan(&it.ID, &it.Name, &it.Type, &it.PricePerNight, &it.MaxGuests, &it.IsActive, &it.Description, &it.PhotoURL, &mapX, &mapY); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		it.MapX = &mapX
		it.MapY = &mapY
		items = append(items, it)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func GetItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var it models.Item
	var mapX, mapY float64
	err = db.DB.QueryRow(
		"SELECT id, name, type, price_per_night, max_guests, is_active, description, photo_url, COALESCE(map_x,0), COALESCE(map_y,0) FROM items WHERE id = $1",
		id,
	).Scan(&it.ID, &it.Name, &it.Type, &it.PricePerNight, &it.MaxGuests, &it.IsActive, &it.Description, &it.PhotoURL, &mapX, &mapY)
	it.MapX = &mapX
	it.MapY = &mapY
	if err == sql.ErrNoRows {
		http.Error(w, "item not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(it)
}
