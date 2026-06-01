package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	db, err := sql.Open("sqlite3", "./oltush.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	sqlBytes, err := ioutil.ReadFile("../migrations/001_init.sql")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(string(sqlBytes))
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Database initialized successfully!")
}
