package db

import (
	_ "embed"
)

//go:embed schema.sql
var schemaSQL string

//go:embed seed.sql
var seedSQL string

func readSchemaSQL() (string, error) {
	return schemaSQL, nil
}

func readSeedSQL() (string, error) {
	return seedSQL, nil
}
