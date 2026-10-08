package storage

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
)

// maxPixels bounds decoded size to stop decompression bombs (a tiny file can claim a
// huge canvas). 40 MP covers any realistic phone photo.
const maxPixels = 40_000_000

var ErrBadImage = errors.New("not a decodable image")

// StripMetadata decodes a JPEG or PNG and re-encodes it, which discards every
// ancillary block — EXIF (incl. GPS), XMP, ICC, comments — leaving pixels only.
// Returns the clean bytes. Other types are rejected (WebP cannot be re-encoded with
// the standard library, so it is not accepted; see the media allowlist).
func StripMetadata(data []byte, contentType string) ([]byte, error) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return nil, ErrBadImage
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width*cfg.Height > maxPixels {
		return nil, ErrBadImage
	}
	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, ErrBadImage
	}
	var out bytes.Buffer
	switch contentType {
	case "image/jpeg":
		if err := jpeg.Encode(&out, img, &jpeg.Options{Quality: 90}); err != nil {
			return nil, err
		}
	case "image/png":
		if err := png.Encode(&out, img); err != nil {
			return nil, err
		}
	default:
		return nil, ErrBadImage
	}
	return out.Bytes(), nil
}
