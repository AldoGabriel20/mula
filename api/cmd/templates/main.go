// Command templates maintains the template catalog (docs/17 §9.2):
//
//	go run ./cmd/templates validate [-catalog ../catalog] [-web ../web]
//	go run ./cmd/templates sync     [-catalog ../catalog]          (needs DATABASE_URL)
//	go run ./cmd/templates gen-web  [-catalog ../catalog] [-web ../web]
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/mula/mula/internal/catalog"
	"github.com/mula/mula/internal/platform/config"
)

func main() {
	if len(os.Args) < 2 {
		usage()
	}
	cmd := os.Args[1]
	fs := flag.NewFlagSet(cmd, flag.ExitOnError)
	dir := fs.String("catalog", "../catalog", "catalog directory")
	web := fs.String("web", "../web", "web directory (renderer and font files; gen-web output)")
	_ = fs.Parse(os.Args[2:])

	cat, problems := catalog.Load(*dir)
	switch cmd {
	case "validate", "gen-web", "sync":
		problems = append(problems, cat.Validate(catalog.Options{WebDir: *web})...)
	default:
		usage()
	}
	if len(problems) > 0 {
		for _, p := range problems {
			fmt.Fprintln(os.Stderr, p)
		}
		fmt.Fprintf(os.Stderr, "%d problem(s)\n", len(problems))
		os.Exit(1)
	}

	switch cmd {
	case "validate":
		fmt.Printf("catalog ok: %d template(s), %d palette(s), %d track(s)\n", len(cat.Templates), len(cat.Palettes), len(cat.Tracks))
	case "gen-web":
		files, err := catalog.GenerateWeb(cat, *web)
		if err != nil {
			fatal(err)
		}
		fmt.Printf("generated %d file(s) under %s/lib/kit/generated\n", files, *web)
	case "sync":
		dsn, err := config.Load().RequireDatabaseURL()
		if err != nil {
			fatal(err)
		}
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		pool, err := pgxpool.New(ctx, dsn)
		if err != nil {
			fatal(err)
		}
		defer pool.Close()
		tx, err := pool.Begin(ctx)
		if err != nil {
			fatal(err)
		}
		defer tx.Rollback(ctx) //nolint:errcheck // no-op after Commit
		rep, err := catalog.Sync(ctx, tx, cat)
		if err != nil {
			fatal(err)
		}
		if err := tx.Commit(ctx); err != nil {
			fatal(err)
		}
		fmt.Println(rep)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, "usage: templates validate|sync|gen-web [-catalog dir] [-web dir]")
	os.Exit(2)
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "templates:", err)
	os.Exit(1)
}
