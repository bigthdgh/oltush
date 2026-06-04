package models

import (
	"time"
)

type Item struct {
	ID            int       `json:"id" db:"id"`
	Name          string    `json:"name" db:"name"`
	Type          string    `json:"type" db:"type"`
	PricePerNight float64   `json:"price_per_night" db:"price_per_night"`
	MaxGuests     int       `json:"max_guests" db:"max_guests"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	Description   *string   `json:"description,omitempty" db:"description"`
	PhotoURL      *string   `json:"photo_url,omitempty" db:"photo_url"`
	MapX          *float64  `json:"map_x,omitempty" db:"map_x"`
	MapY          *float64  `json:"map_y,omitempty" db:"map_y"`
}

type Customer struct {
	ID         int       `json:"id" db:"id"`
	TelegramID int64     `json:"telegram_id" db:"telegram_id"`
	Username   *string   `json:"username,omitempty" db:"username"`
	FirstName  *string   `json:"first_name,omitempty" db:"first_name"`
	LastName   *string   `json:"last_name,omitempty" db:"last_name"`
	Phone      string    `json:"phone" db:"phone"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Booking struct {
	ID               int       `json:"id" db:"id"`
	ItemID           int       `json:"item_id" db:"item_id"`
	CustomerID       *int      `json:"customer_id,omitempty" db:"customer_id"`
	StartDate        string    `json:"start_date" db:"start_date"`
	EndDate          string    `json:"end_date" db:"end_date"`
	Status           string    `json:"status" db:"status"`
	TotalPrice       float64   `json:"total_price" db:"total_price"`
	IsManualOverride bool      `json:"is_manual_override" db:"is_manual_override"`
	GuestName        *string   `json:"guest_name,omitempty" db:"guest_name"`
	GuestPhone       *string   `json:"guest_phone,omitempty" db:"guest_phone"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type Payment struct {
	ID          int       `json:"id" db:"id"`
	BookingID   int       `json:"booking_id" db:"booking_id"`
	BePaidUID   *string   `json:"bepaid_uid,omitempty" db:"bepaid_uid"`
	Amount      float64   `json:"amount" db:"amount"`
	Status      string    `json:"status" db:"status"`
	PaymentType *string   `json:"payment_type,omitempty" db:"payment_type"`
	RawResponse *string   `json:"raw_response,omitempty" db:"raw_response"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
