package db

import (
	"database/sql"
	"fmt"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	DB *sql.DB
	Mu sync.RWMutex
)

func Connect(databaseURL string) (*sql.DB, error) {
	var err error
	DB, err = sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := DB.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if err := runMigrations(DB); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	if err := seedData(DB); err != nil {
		return nil, fmt.Errorf("seed data: %w", err)
	}

	return DB, nil
}

func runMigrations(db *sql.DB) error {
	schema, err := readSchemaSQL()
	if err != nil {
		return fmt.Errorf("read schema: %w", err)
	}
	_, err = db.Exec(schema)
	return err
}

func seedData(db *sql.DB) error {
	seed, err := readSeedSQL()
	if err != nil {
		return fmt.Errorf("read seed: %w", err)
	}
	_, err = db.Exec(seed)
	return err
}
