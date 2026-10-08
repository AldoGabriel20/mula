package storage

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
	"time"
)

func testImage() image.Image {
	img := image.NewRGBA(image.Rect(0, 0, 8, 8))
	for x := 0; x < 8; x++ {
		for y := 0; y < 8; y++ {
			img.Set(x, y, color.RGBA{uint8(x * 30), uint8(y * 30), 120, 255})
		}
	}
	return img
}

// jpegWithEXIF returns a valid JPEG with an APP1/Exif segment (containing a GPS-looking
// marker string) spliced in right after SOI — i.e. what a phone photo carries.
func jpegWithEXIF(t *testing.T, marker string) []byte {
	t.Helper()
	var plain bytes.Buffer
	if err := jpeg.Encode(&plain, testImage(), nil); err != nil {
		t.Fatal(err)
	}
	b := plain.Bytes()
	payload := append([]byte("Exif\x00\x00"), []byte(marker)...)
	seg := []byte{0xFF, 0xE1, byte((len(payload) + 2) >> 8), byte((len(payload) + 2) & 0xFF)}
	seg = append(seg, payload...)
	out := append([]byte{}, b[:2]...) // SOI
	out = append(out, seg...)
	return append(out, b[2:]...)
}

func TestStripMetadataRemovesEXIF(t *testing.T) {
	const gps = "GPS:-6.2088,106.8456"
	dirty := jpegWithEXIF(t, gps)
	if !bytes.Contains(dirty, []byte(gps)) {
		t.Fatal("test setup: EXIF marker not embedded")
	}
	// the dirty file is still a valid JPEG
	if _, err := jpeg.Decode(bytes.NewReader(dirty)); err != nil {
		t.Fatalf("dirty jpeg should decode: %v", err)
	}

	clean, err := StripMetadata(dirty, "image/jpeg")
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(clean, []byte(gps)) || bytes.Contains(clean, []byte("Exif")) {
		t.Fatal("EXIF/GPS survived the strip")
	}
	got, err := jpeg.Decode(bytes.NewReader(clean))
	if err != nil {
		t.Fatalf("clean jpeg must still decode: %v", err)
	}
	if got.Bounds().Dx() != 8 || got.Bounds().Dy() != 8 {
		t.Fatalf("dimensions changed: %v", got.Bounds())
	}
}

func TestStripMetadataPNGAndRejects(t *testing.T) {
	var p bytes.Buffer
	_ = png.Encode(&p, testImage())
	if out, err := StripMetadata(p.Bytes(), "image/png"); err != nil || len(out) == 0 {
		t.Fatalf("png strip: %v", err)
	}
	if _, err := StripMetadata([]byte("not an image at all"), "image/jpeg"); err == nil {
		t.Fatal("garbage must be rejected")
	}
	// truncated JPEG header is rejected, not passed through
	if _, err := StripMetadata(p.Bytes()[:20], "image/png"); err == nil {
		t.Fatal("truncated png must be rejected")
	}
	// unsupported type
	if _, err := StripMetadata(p.Bytes(), "image/webp"); err == nil {
		t.Fatal("webp must be rejected (cannot be re-encoded)")
	}
}

func TestSigner(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	s := NewSigner("secret")
	s.now = func() time.Time { return now }

	tok := s.Sign("media-1", time.Minute)
	if err := s.Verify("media-1", tok); err != nil {
		t.Fatalf("valid token rejected: %v", err)
	}
	// scoped to the resource
	if err := s.Verify("media-2", tok); err == nil {
		t.Fatal("token for media-1 must not verify for media-2")
	}
	// tampered signature / expiry
	if err := s.Verify("media-1", tok+"0"); err == nil {
		t.Fatal("tampered signature accepted")
	}
	if err := s.Verify("media-1", "9999999999."+tok[len(tok)-64:]); err == nil {
		t.Fatal("extended expiry with old signature accepted")
	}
	for _, bad := range []string{"", "nodot", "abc.def", "."} {
		if err := s.Verify("media-1", bad); err == nil {
			t.Fatalf("malformed token %q accepted", bad)
		}
	}
	// different secret
	if err := NewSigner("other").Verify("media-1", tok); err == nil {
		t.Fatal("token verified under a different secret")
	}
	// expiry
	s.now = func() time.Time { return now.Add(2 * time.Minute) }
	if err := s.Verify("media-1", tok); err == nil {
		t.Fatal("expired token accepted")
	}
}
