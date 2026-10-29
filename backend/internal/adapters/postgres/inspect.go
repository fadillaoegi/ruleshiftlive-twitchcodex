package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

const RequiredMajor = 18

var ErrVersion = errors.New("PostgreSQL server major version must be 18")

type Info struct {
	Major    int    `json:"major"`
	Version  string `json:"version"`
	Database string `json:"database"`
}

func inspect(ctx context.Context, pool *pgxpool.Pool) (Info, error) {
	var info Info
	var number int
	err := pool.QueryRow(ctx, `SELECT current_setting('server_version_num')::integer, current_setting('server_version'), current_database()`).Scan(&number, &info.Version, &info.Database)
	if err != nil {
		return info, err
	}
	info.Major = number / 10000
	if info.Major != RequiredMajor {
		return info, fmt.Errorf("%w (connected to major %d)", ErrVersion, info.Major)
	}
	return info, nil
}

// Inspect reads server metadata without migrating or creating database objects.
// Connection errors can contain credentials; callers must redact before output.
func Inspect(ctx context.Context, connectionString string) (Info, error) {
	pool, err := pgxpool.New(ctx, connectionString)
	if err != nil {
		return Info{}, err
	}
	defer pool.Close()
	return inspect(ctx, pool)
}
