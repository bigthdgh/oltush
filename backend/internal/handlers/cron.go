package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"oltush/internal/db"
)

type CleanupResult struct {
	Cancelled int `json:"cancelled"`
}

func CleanupPendingBookings(w http.ResponseWriter, r *http.Request) {
	result, err := db.DB.Exec(
		`UPDATE bookings
		 SET status = 'cancelled', updated_at = NOW()
		 WHERE status = 'pending'
		   AND created_at < NOW() - INTERVAL '15 minutes'`,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CleanupResult{Cancelled: int(rowsAffected)})
}

func StartPendingCleanupTicker() {
	ticker := time.NewTicker(5 * time.Minute)
	go func() {
		for range ticker.C {
			_, err := db.DB.Exec(
				`UPDATE bookings
				 SET status = 'cancelled', updated_at = NOW()
				 WHERE status = 'pending'
				   AND created_at < NOW() - INTERVAL '15 minutes'`,
			)
			if err != nil {
				// silently log or ignore in background
				_ = err
			}
		}
	}()
}
