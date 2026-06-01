package config

import (
	"os"
	"strings"
)

type Config struct {
	DatabaseURL       string
	BePaidID          string
	BePaidSecret      string
	BePaidCheckoutURL string
	FrontendURL       string
	BotToken          string
	BotWebhookSecret  string
	AdminTgIDs        []string
	AppEnv            string
	Port              string
}

func Load() *Config {
	return &Config{
		DatabaseURL:       getEnv("DATABASE_URL", "postgres://oltush:oltush_secret@localhost:5432/oltush?sslmode=disable"),
		BePaidID:          getEnv("BEPAID_ID", ""),
		BePaidSecret:      getEnv("BEPAID_SECRET", ""),
		BePaidCheckoutURL: getEnv("BEPAID_CHECKOUT_URL", "https://checkout.bepaid.by/v2/checkout"),
		FrontendURL:       getEnv("FRONTEND_URL", ""),
		BotToken:          getEnv("BOT_TOKEN", ""),
		BotWebhookSecret:  getEnv("BOT_WEBHOOK_SECRET", ""),
		AdminTgIDs:        strings.Split(getEnv("ADMIN_TG_IDS", ""), ","),
		AppEnv:            getEnv("APP_ENV", "development"),
		Port:              getEnv("PORT", "8080"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
