package middleware

import (
	"net/http"
	"os"
	"strings"

	"oltush/internal/config"
)

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// Allow requests with no origin (e.g. mobile apps, curl)
		// Or allow specific origins in production
		allowedOrigins := []string{
			"https://t.me",
			"https://web.telegram.org",
		}

		// Add frontend URL from env if set
		if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
			allowedOrigins = append(allowedOrigins, frontendURL)
		}

		allowOrigin := ""
		if origin == "" {
			allowOrigin = "*"
		} else {
			for _, o := range allowedOrigins {
				if origin == o {
					allowOrigin = origin
					break
				}
			}
		}

		if allowOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Telegram-ID")
		if allowOrigin != "*" && allowOrigin != "" {
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func AdminOnly(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tgID := r.Header.Get("X-Telegram-ID")
			if tgID == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			for _, admin := range cfg.AdminTgIDs {
				if strings.TrimSpace(admin) == tgID {
					next.ServeHTTP(w, r)
					return
				}
			}
			http.Error(w, "Forbidden", http.StatusForbidden)
		})
	}
}
