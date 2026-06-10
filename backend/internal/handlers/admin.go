package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"oltush/internal/bot"
	"oltush/internal/config"
	"oltush/internal/db"
	"oltush/internal/models"

	"github.com/go-chi/chi/v5"
)

type ManualBookingRequest struct {
	ItemID     int    `json:"item_id"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	GuestName  string `json:"guest_name"`
	GuestPhone string `json:"guest_phone"`
}

type UpdateItemRequest struct {
	Name          *string  `json:"name,omitempty"`
	Type          *string  `json:"type,omitempty"`
	PricePerNight *float64 `json:"price_per_night,omitempty"`
	MaxGuests     *int     `json:"max_guests,omitempty"`
	IsActive      *bool    `json:"is_active,omitempty"`
	Description   *string  `json:"description,omitempty"`
	PhotoURL      *string  `json:"photo_url,omitempty"`
	MapX          *float64 `json:"map_x,omitempty"`
	MapY          *float64 `json:"map_y,omitempty"`
}

type AdminUpdateBookingRequest struct {
	StartDate  string  `json:"start_date,omitempty"`
	EndDate    string  `json:"end_date,omitempty"`
	Status     string  `json:"status,omitempty"`
	GuestName  string  `json:"guest_name,omitempty"`
	GuestPhone string  `json:"guest_phone,omitempty"`
	TotalPrice float64 `json:"total_price,omitempty"`
}

func GetAllItems(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query("SELECT id, name, type, price_per_night, max_guests, is_active, description, photo_url, COALESCE(map_x,0), COALESCE(map_y,0) FROM items ORDER BY id")
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

func CreateManualBooking(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ManualBookingRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		start, err := time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			http.Error(w, "invalid start_date", http.StatusBadRequest)
			return
		}
		end, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			http.Error(w, "invalid end_date", http.StatusBadRequest)
			return
		}
		if !start.Before(end) {
			http.Error(w, "start_date must be before end_date", http.StatusBadRequest)
			return
		}

		nights := int(end.Sub(start).Hours() / 24)
		if nights <= 0 {
			http.Error(w, "invalid date range", http.StatusBadRequest)
			return
		}

		tx, err := db.DB.Begin()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		var price float64
		err = tx.QueryRow(
			"SELECT price_per_night FROM items WHERE id = $1",
			req.ItemID,
		).Scan(&price)
		if err == sql.ErrNoRows {
			http.Error(w, "item not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var overlap bool
		err = tx.QueryRow(
			`SELECT EXISTS(
				SELECT 1 FROM bookings
				WHERE item_id = $1 AND status IN ('pending', 'confirmed')
				AND start_date < $3 AND end_date > $2
			)`,
			req.ItemID, req.StartDate, req.EndDate,
		).Scan(&overlap)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if overlap {
			http.Error(w, "selected dates overlap with existing booking", http.StatusConflict)
			return
		}

		totalPrice := float64(nights) * price
		var bookingID int
		err = tx.QueryRow(
			`INSERT INTO bookings (item_id, start_date, end_date, status, total_price, is_manual_override, guest_name, guest_phone, created_at, updated_at)
			 VALUES ($1, $2, $3, 'confirmed', $4, true, $5, $6, NOW(), NOW())
			 RETURNING id`,
			req.ItemID, req.StartDate, req.EndDate, totalPrice, req.GuestName, req.GuestPhone,
		).Scan(&bookingID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := tx.Commit(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		go bot.NotifyBookingCreated(bookingID, cfg)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]any{"booking_id": bookingID})
	}
}

func UpdateItem(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req UpdateItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	var sets []string
	var args []interface{}
	argID := 1

	if req.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argID))
		args = append(args, *req.Name)
		argID++
	}
	if req.Type != nil {
		sets = append(sets, fmt.Sprintf("type = $%d", argID))
		args = append(args, *req.Type)
		argID++
	}
	if req.PricePerNight != nil {
		sets = append(sets, fmt.Sprintf("price_per_night = $%d", argID))
		args = append(args, *req.PricePerNight)
		argID++
	}
	if req.MaxGuests != nil {
		sets = append(sets, fmt.Sprintf("max_guests = $%d", argID))
		args = append(args, *req.MaxGuests)
		argID++
	}
	if req.IsActive != nil {
		sets = append(sets, fmt.Sprintf("is_active = $%d", argID))
		args = append(args, *req.IsActive)
		argID++
	}
	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", argID))
		args = append(args, *req.Description)
		argID++
	}
	if req.PhotoURL != nil {
		sets = append(sets, fmt.Sprintf("photo_url = $%d", argID))
		args = append(args, *req.PhotoURL)
		argID++
	}
	if req.MapX != nil {
		sets = append(sets, fmt.Sprintf("map_x = $%d", argID))
		args = append(args, *req.MapX)
		argID++
	}
	if req.MapY != nil {
		sets = append(sets, fmt.Sprintf("map_y = $%d", argID))
		args = append(args, *req.MapY)
		argID++
	}

	if len(sets) == 0 {
		http.Error(w, "nothing to update", http.StatusBadRequest)
		return
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE items SET %s WHERE id = $%d", strings.Join(sets, ", "), argID)
	_, err = db.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetAllBookings(w http.ResponseWriter, r *http.Request) {
	month := r.URL.Query().Get("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	monthStart, _ := time.Parse("2006-01", month)
	monthEnd := monthStart.AddDate(0, 1, 0)

	type bookingWithItem struct {
		models.Booking
		ItemName string `json:"item_name"`
	}

	rows, err := db.DB.Query(
		`SELECT b.id, b.item_id, b.customer_id, b.start_date, b.end_date, b.status, b.total_price, b.is_manual_override, b.guest_name, b.guest_phone, b.created_at, b.updated_at, i.name
		 FROM bookings b
		 JOIN items i ON b.item_id = i.id
		 WHERE b.status IN ('pending', 'confirmed')
		 AND b.start_date < $1 AND b.end_date > $2
		 ORDER BY b.start_date`,
		monthEnd.Format("2006-01-02"), monthStart.Format("2006-01-02"),
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	bookings := []bookingWithItem{}
	for rows.Next() {
		var b models.Booking
		var itemName string
		var startDate, endDate time.Time
		if err := rows.Scan(&b.ID, &b.ItemID, &b.CustomerID, &startDate, &endDate, &b.Status, &b.TotalPrice, &b.IsManualOverride, &b.GuestName, &b.GuestPhone, &b.CreatedAt, &b.UpdatedAt, &itemName); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		b.StartDate = startDate.Format("2006-01-02")
		b.EndDate = endDate.Format("2006-01-02")
		bookings = append(bookings, bookingWithItem{
			Booking:  b,
			ItemName: itemName,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}

func GetAllCustomers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(
		`SELECT id, telegram_id, username, first_name, last_name, phone, created_at
		 FROM customers
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	customers := []models.Customer{}
	for rows.Next() {
		var c models.Customer
		var username, firstName, lastName sql.NullString
		if err := rows.Scan(&c.ID, &c.TelegramID, &username, &firstName, &lastName, &c.Phone, &c.CreatedAt); err == nil {
			if username.Valid {
				c.Username = &username.String
			}
			if firstName.Valid {
				c.FirstName = &firstName.String
			}
			if lastName.Valid {
				c.LastName = &lastName.String
			}
			customers = append(customers, c)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(customers)
}

func AdminCancelBooking(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec("UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func AdminUpdateBooking(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var req AdminUpdateBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}

	var sets []string
	var args []interface{}
	argID := 1

	if req.StartDate != "" {
		sets = append(sets, fmt.Sprintf("start_date = $%d", argID))
		args = append(args, req.StartDate)
		argID++
	}
	if req.EndDate != "" {
		sets = append(sets, fmt.Sprintf("end_date = $%d", argID))
		args = append(args, req.EndDate)
		argID++
	}
	if req.Status != "" {
		sets = append(sets, fmt.Sprintf("status = $%d", argID))
		args = append(args, req.Status)
		argID++
	}
	if req.GuestName != "" {
		sets = append(sets, fmt.Sprintf("guest_name = $%d", argID))
		args = append(args, req.GuestName)
		argID++
	}
	if req.GuestPhone != "" {
		sets = append(sets, fmt.Sprintf("guest_phone = $%d", argID))
		args = append(args, req.GuestPhone)
		argID++
	}
	if req.TotalPrice > 0 {
		sets = append(sets, fmt.Sprintf("total_price = $%d", argID))
		args = append(args, req.TotalPrice)
		argID++
	}

	if len(sets) == 0 {
		http.Error(w, "nothing to update", http.StatusBadRequest)
		return
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE bookings SET %s, updated_at = NOW() WHERE id = $%d", strings.Join(sets, ", "), argID)
	_, err = db.DB.Exec(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
