package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	"oltush/internal/bot"
	"oltush/internal/config"
	"oltush/internal/db"
	handlers "oltush/internal/handlers"
	appmw "oltush/internal/middleware"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		slog.Warn("failed to load .env file", "error", err)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg := config.Load()

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(appmw.CORS)

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if err := database.Ping(); err != nil {
			logger.Error("healthcheck db ping failed", "error", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte("unhealthy"))
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	r.Get("/api/items", handlers.GetItems)
	r.Get("/api/items/{id}", handlers.GetItem)

	r.Get("/api/bookings/busy", handlers.GetBusyDates)
	r.Get("/api/bookings/my", handlers.GetMyBookings)
	r.Post("/api/bookings/create", handlers.CreateBooking(cfg))
	r.Post("/api/payments/create", handlers.CreatePayment(cfg))
	r.Post("/api/webhooks/bepaid", handlers.BePaidWebhook(cfg))
	r.Post("/api/cron/cleanup-pending", handlers.CleanupPendingBookings)

	r.Get("/api/me", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		isAdmin := false
		for _, id := range cfg.AdminTgIDs {
			if id != "" && id == userID {
				isAdmin = true
				break
			}
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"is_admin":` + fmt.Sprintf("%t", isAdmin) + `}`))
	})

	r.Route("/api/admin", func(r chi.Router) {
		r.Use(appmw.AdminOnly(cfg))
		r.Get("/bookings", handlers.GetAllBookings)
		r.Get("/bookings/all", handlers.GetAllBookings)
		r.Post("/bookings/manual", handlers.CreateManualBooking(cfg))
		r.Put("/bookings/{id}", handlers.AdminUpdateBooking)
		r.Post("/bookings/{id}/cancel", handlers.AdminCancelBooking)
		r.Get("/customers", handlers.GetAllCustomers)
		r.Get("/items/all", handlers.GetAllItems)
		r.Put("/items/{id}", handlers.UpdateItem)
	})

	r.Post("/webhooks/telegram", bot.HandleWebhook(cfg))

	// Serve frontend static files
	fs := http.FileServer(http.Dir("../frontend/dist"))
	r.Get("/*", func(w http.ResponseWriter, req *http.Request) {
		// If the path is an API route, let chi handle it (shouldn't reach here due to order)
		// Check if file exists, otherwise serve index.html for SPA routing
		path := "../frontend/dist" + req.URL.Path
		if _, err := os.Stat(path); os.IsNotExist(err) {
			req.URL.Path = "/"
		}
		fs.ServeHTTP(w, req)
	})

	handlers.StartPendingCleanupTicker()

	addr := ":" + cfg.Port
	logger.Info("server starting", "addr", addr)

	server := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server listen error", "error", err)
			os.Exit(1)
		}
	}()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	<-ctx.Done()
	logger.Info("shutdown signal received, gracefully stopping")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("server shutdown error", "error", err)
	}

	logger.Info("server stopped")
}
