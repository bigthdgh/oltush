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
	rows, err := db.DB.Query("SELECT id, name, type, price_per_night, max_guests, is_active, description, photo_url FROM items WHERE is_active = true")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var it models.Item
		if err := rows.Scan(&it.ID, &it.Name, &it.Type, &it.PricePerNight, &it.MaxGuests, &it.IsActive, &it.Description, &it.PhotoURL); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
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
	err = db.DB.QueryRow(
		"SELECT id, name, type, price_per_night, max_guests, is_active, description, photo_url FROM items WHERE id = $1",
		id,
	).Scan(&it.ID, &it.Name, &it.Type, &it.PricePerNight, &it.MaxGuests, &it.IsActive, &it.Description, &it.PhotoURL)
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
