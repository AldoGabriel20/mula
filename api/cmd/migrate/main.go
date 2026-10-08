// Command migrate applies or rolls back SQL migrations via golang-migrate.
//
// Usage:
//
//	go run ./cmd/migrate up          # apply all
//	go run ./cmd/migrate down 1      # roll back N (default 1); errors if fewer than N are applied
//	go run ./cmd/migrate down-all    # roll back everything (no-op on an empty DB)
//	go run ./cmd/migrate version     # print current version
//
// Reads DATABASE_URL from the environment.
package main

import (
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/mula/mula/internal/platform/config"
)

func main() {
	if len(os.Args) < 2 {
		fail("usage: migrate <up|down|version> [n]")
	}

	dsn, err := config.Load().RequireDatabaseURL()
	if err != nil {
		fail(err.Error())
	}

	m, err := migrate.New("file://migrations", dsn)
	if err != nil {
		fail("init migrate: " + err.Error())
	}
	defer m.Close()

	switch os.Args[1] {
	case "up":
		run(m.Up())
	case "down":
		n := 1
		if len(os.Args) > 2 {
			if n, err = strconv.Atoi(os.Args[2]); err != nil {
				fail("down count must be an integer")
			}
		}
		run(m.Steps(-n))
	case "down-all":
		// m.Down() reverts every applied migration; ErrNoChange (already empty) is fine.
		run(m.Down())
	case "version":
		v, dirty, err := m.Version()
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("version=none (no migrations applied)")
			return
		}
		if err != nil {
			fail(err.Error())
		}
		fmt.Printf("version=%d dirty=%t\n", v, dirty)
	default:
		fail("unknown command: " + os.Args[1])
	}
}

func run(err error) {
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		fail(err.Error())
	}
	fmt.Println("ok")
}

func fail(msg string) {
	fmt.Fprintln(os.Stderr, msg)
	os.Exit(1)
}
