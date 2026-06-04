package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"oltush/internal/bot"
	"oltush/internal/config"
	"oltush/internal/db"
	"oltush/internal/models"
)

type CreatePaymentRequest struct {
	BookingID int `json:"booking_id"`
}

type CreatePaymentResponse struct {
	CheckoutURL string `json:"checkout_url"`
}

type BePaidRequest struct {
	Checkout struct {
		Test       bool   `json:"test,omitempty"`
		TransactionType string `json:"transaction_type"`
		Order        struct {
			Amount      float64 `json:"amount"`
			Currency    string  `json:"currency"`
			Description string  `json:"description"`
			TrackingID  string  `json:"tracking_id"`
		} `json:"order"`
		Settings struct {
			SuccessURL string `json:"success_url"`
			FailURL    string `json:"fail_url"`
		} `json:"settings"`
	} `json:"checkout"`
}

type BePaidResponse struct {
	Checkout struct {
		RedirectURL string `json:"redirect_url"`
		Token       string `json:"token"`
	} `json:"checkout"`
}

type BePaidWebhookBody struct {
	Transaction struct {
		UID     string `json:"uid"`
		Status  string `json:"status"`
		Amount  float64 `json:"amount"`
		OrderID string `json:"order_id"`
		Payment struct {
			Type string `json:"type"`
		} `json:"payment"`
	} `json:"transaction"`
}

func CreatePayment(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cfg.BePaidID == "" || cfg.BePaidSecret == "" {
			http.Error(w, "payment service not configured", http.StatusServiceUnavailable)
			return
		}

		var req CreatePaymentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		var booking models.Booking
		var itemName string
		var startDate, endDate time.Time
		err := db.DB.QueryRow(
			`SELECT b.id, b.item_id, b.customer_id, b.start_date, b.end_date, b.status, b.total_price, i.name
			 FROM bookings b
			 JOIN items i ON b.item_id = i.id
			 WHERE b.id = $1`,
			req.BookingID,
		).Scan(&booking.ID, &booking.ItemID, &booking.CustomerID, &startDate, &endDate, &booking.Status, &booking.TotalPrice, &itemName)
		if err == sql.ErrNoRows {
			http.Error(w, "booking not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		booking.StartDate = startDate.Format("2006-01-02")
		booking.EndDate = endDate.Format("2006-01-02")

		if booking.Status != "pending" {
			http.Error(w, "booking already processed", http.StatusBadRequest)
			return
		}

		payload := BePaidRequest{}
		payload.Checkout.Test = cfg.AppEnv == "development"
		payload.Checkout.TransactionType = "payment"
		payload.Checkout.Order.Amount = booking.TotalPrice
		payload.Checkout.Order.Currency = "BYN"
		payload.Checkout.Order.Description = fmt.Sprintf("Бронирование %s с %s по %s", itemName, booking.StartDate, booking.EndDate)
		payload.Checkout.Order.TrackingID = fmt.Sprintf("booking_%d_%d", booking.ID, time.Now().Unix())
		payload.Checkout.Settings.SuccessURL = cfg.FrontendURL
		payload.Checkout.Settings.FailURL = cfg.FrontendURL

		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		reqHTTP, err := http.NewRequest("POST", cfg.BePaidCheckoutURL, bytes.NewBuffer(jsonPayload))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		reqHTTP.Header.Set("Content-Type", "application/json")
		reqHTTP.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(cfg.BePaidID+":"+cfg.BePaidSecret)))

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(reqHTTP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
			http.Error(w, "payment gateway error", http.StatusBadGateway)
			return
		}

		var bePaidResp BePaidResponse
		if err := json.NewDecoder(resp.Body).Decode(&bePaidResp); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Store payment record
		uid := bePaidResp.Checkout.Token
		paymentType := "card"
		_, err = db.DB.Exec(
			`INSERT INTO payments (booking_id, bepaid_uid, tracking_id, amount, status, payment_type)
			 VALUES ($1, $2, $3, $4, 'incomplete', $5)`,
			booking.ID, uid, payload.Checkout.Order.TrackingID, booking.TotalPrice, paymentType,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(CreatePaymentResponse{CheckoutURL: bePaidResp.Checkout.RedirectURL})
	}
}

func BePaidWebhook(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "failed to read body", http.StatusBadRequest)
			return
		}

		// Verify bePaid webhook signature (HMAC-SHA256 of body, base64 encoded)
		sig := r.Header.Get("Signature")
		if sig != "" {
			mac := hmac.New(sha256.New, []byte(cfg.BePaidSecret))
			mac.Write(body)
			expected := base64.StdEncoding.EncodeToString(mac.Sum(nil))
			if sig != expected {
				http.Error(w, "invalid signature", http.StatusUnauthorized)
				return
			}
		}

		var webhook BePaidWebhookBody
		if err := json.Unmarshal(body, &webhook); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		// Find payment by tracking_id (order_id) and update
		var paymentID int
		var bookingID int
		var amount float64
		if webhook.Transaction.OrderID != "" {
			err = db.DB.QueryRow(
				"SELECT id, booking_id, amount FROM payments WHERE tracking_id = $1",
				webhook.Transaction.OrderID,
			).Scan(&paymentID, &bookingID, &amount)
		}
		if err != nil || webhook.Transaction.OrderID == "" {
			// Fallback: try bepaid_uid if tracking_id not found or empty
			err = db.DB.QueryRow(
				"SELECT id, booking_id, amount FROM payments WHERE bepaid_uid = $1",
				webhook.Transaction.UID,
			).Scan(&paymentID, &bookingID, &amount)
		}
		if err != nil {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("ok"))
			return
		}

		_, err = db.DB.Exec(
			"UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2",
			webhook.Transaction.Status, paymentID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if webhook.Transaction.Status == "successful" {
			_, err = db.DB.Exec(
				"UPDATE bookings SET status = 'confirmed', updated_at = NOW() WHERE id = $1",
				bookingID,
			)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			go bot.NotifyPaymentReceived(bookingID, amount, cfg)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}
}
