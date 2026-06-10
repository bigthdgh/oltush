package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"oltush/internal/bot"
	"oltush/internal/config"
	"oltush/internal/db"
)

type BusyDatesResponse struct {
	Dates []string `json:"dates"`
}

type CreateBookingRequest struct {
	ItemID       int    `json:"item_id"`
	StartDate    string `json:"start_date"`
	EndDate      string `json:"end_date"`
	TelegramID   *int64 `json:"customer_id,omitempty"` // Telegram user ID from frontend
	GuestName    string `json:"guest_name"`
	GuestPhone   string `json:"guest_phone"`
	PaymentType  string `json:"payment_type,omitempty"` // "full" | "deposit"
}

type CreateBookingResponse struct {
	BookingID   int    `json:"booking_id"`
	CheckoutURL string `json:"checkout_url,omitempty"`
}

type MyBooking struct {
	ID         int       `json:"id"`
	ItemID     int       `json:"item_id"`
	ItemName   string    `json:"item_name"`
	ItemPhoto  *string   `json:"item_photo,omitempty"`
	StartDate  string    `json:"start_date"`
	EndDate    string    `json:"end_date"`
	Status     string    `json:"status"`
	TotalPrice float64   `json:"total_price"`
	GuestName  string    `json:"guest_name"`
	GuestPhone string    `json:"guest_phone"`
	CreatedAt  time.Time `json:"created_at"`
}

type MyBookingsResponse struct {
	Data []MyBooking `json:"data"`
}

func GetBusyDates(w http.ResponseWriter, r *http.Request) {
	itemIDStr := r.URL.Query().Get("item_id")
	monthStr := r.URL.Query().Get("month")
	if itemIDStr == "" || monthStr == "" {
		http.Error(w, "item_id and month are required", http.StatusBadRequest)
		return
	}

	itemID, err := strconv.Atoi(itemIDStr)
	if err != nil {
		http.Error(w, "invalid item_id", http.StatusBadRequest)
		return
	}

	_, err = time.Parse("2006-01", monthStr)
	if err != nil {
		http.Error(w, "invalid month format, expected YYYY-MM", http.StatusBadRequest)
		return
	}

	monthStart, _ := time.Parse("2006-01", monthStr)
	monthEnd := monthStart.AddDate(0, 1, 0)

	rows, err := db.DB.Query(
		`SELECT start_date, end_date FROM bookings
		 WHERE item_id = $1 AND status IN ('pending', 'confirmed')
		 AND start_date < $2 AND end_date > $3`,
		itemID, monthEnd.Format("2006-01-02"), monthStart.Format("2006-01-02"),
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	dates := []string{}
	for rows.Next() {
		var startDate, endDate time.Time
		if err := rows.Scan(&startDate, &endDate); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for d := startDate; d.Before(endDate); d = d.AddDate(0, 0, 1) {
			if d.Month() == monthStart.Month() && d.Year() == monthStart.Year() {
				dates = append(dates, d.Format("2006-01-02"))
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(BusyDatesResponse{Dates: dates})
}

// upsertCustomerByTelegramID creates or updates a customer record and returns the internal DB id.
func upsertCustomerByTelegramID(telegramID int64, name, phone string) (*int, error) {
	var id int
	err := db.DB.QueryRow(
		`INSERT INTO customers (telegram_id, first_name, phone)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (telegram_id) DO UPDATE
		 SET first_name = COALESCE(EXCLUDED.first_name, customers.first_name),
		     phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE customers.phone END
		 RETURNING id`,
		telegramID, name, phone,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

func CreateBooking(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateBookingRequest
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

		// Resolve Telegram ID to internal customer ID
		var customerID *int
		if req.TelegramID != nil && *req.TelegramID > 0 {
			cid, err := upsertCustomerByTelegramID(*req.TelegramID, req.GuestName, req.GuestPhone)
			if err == nil {
				customerID = cid
			}
			// If upsert fails, proceed without customer_id (guest booking)
		}

		tx, err := db.DB.Begin()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		_, err = tx.Exec("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var price float64
		err = tx.QueryRow(
			"SELECT price_per_night FROM items WHERE id = $1 AND is_active = true",
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
				FOR UPDATE
			)`,
			req.ItemID, req.StartDate, req.EndDate,
		).Scan(&overlap)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if overlap {
			http.Error(w, "selected dates are not available", http.StatusConflict)
			return
		}

		totalPrice := float64(nights) * price
		if req.PaymentType == "deposit" {
			totalPrice = price // оплата только за 1 сутки
		}
		var bookingID int
		err = tx.QueryRow(
			`INSERT INTO bookings (item_id, customer_id, start_date, end_date, status, total_price, is_manual_override, guest_name, guest_phone, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, 'pending', $5, false, $6, $7, NOW(), NOW())
			 RETURNING id`,
			req.ItemID, customerID, req.StartDate, req.EndDate, totalPrice, req.GuestName, req.GuestPhone,
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
		json.NewEncoder(w).Encode(CreateBookingResponse{BookingID: bookingID})
	}
}

func GetMyBookings(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	// user_id is the Telegram user ID; look up the internal customer ID first
	telegramID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "invalid user_id", http.StatusBadRequest)
		return
	}

	rows, err := db.DB.Query(
		`SELECT b.id, b.item_id, i.name, i.photo_url,
		        b.start_date, b.end_date, b.status, b.total_price,
		        COALESCE(b.guest_name, ''), COALESCE(b.guest_phone, ''), b.created_at
		 FROM bookings b
		 JOIN items i ON b.item_id = i.id
		 JOIN customers c ON b.customer_id = c.id
		 WHERE c.telegram_id = $1
		 ORDER BY b.created_at DESC`,
		telegramID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	bookings := []MyBooking{}
	for rows.Next() {
		var b MyBooking
		var startDate, endDate time.Time
		if err := rows.Scan(
			&b.ID, &b.ItemID, &b.ItemName, &b.ItemPhoto,
			&startDate, &endDate, &b.Status, &b.TotalPrice,
			&b.GuestName, &b.GuestPhone, &b.CreatedAt,
		); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		b.StartDate = startDate.Format("2006-01-02")
		b.EndDate = endDate.Format("2006-01-02")
		bookings = append(bookings, b)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bookings)
}
