// Package storage provides media blob storage. The Storage interface has two real
// implementations by design (docs/10): Local (dev) and S3-compatible (prod, later).
package storage

import (
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type Storage interface {
	Put(ctx context.Context, key string, data []byte) error
	Open(ctx context.Context, key string) (io.ReadCloser, error)
	Delete(ctx context.Context, key string) error
}

// Local stores blobs under a root directory. Keys are server-generated (random),
// never user-supplied; path traversal is still rejected defensively.
type Local struct{ root string }

func NewLocal(root string) (*Local, error) {
	if err := os.MkdirAll(root, 0o750); err != nil {
		return nil, err
	}
	return &Local{root: root}, nil
}

func (l *Local) path(key string) (string, error) {
	if key == "" || strings.Contains(key, "..") || strings.ContainsAny(key, `/\`) {
		return "", errors.New("invalid storage key")
	}
	return filepath.Join(l.root, key), nil
}

func (l *Local) Put(_ context.Context, key string, data []byte) error {
	p, err := l.path(key)
	if err != nil {
		return err
	}
	return os.WriteFile(p, data, 0o640)
}

func (l *Local) Open(_ context.Context, key string) (io.ReadCloser, error) {
	p, err := l.path(key)
	if err != nil {
		return nil, err
	}
	return os.Open(p)
}

func (l *Local) Delete(_ context.Context, key string) error {
	p, err := l.path(key)
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
