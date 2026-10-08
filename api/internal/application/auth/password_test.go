package auth

import "testing"

func TestPasswordHashVerify(t *testing.T) {
	h, err := HashPassword("correct horse battery")
	if err != nil {
		t.Fatal(err)
	}
	ok, err := VerifyPassword("correct horse battery", h)
	if err != nil || !ok {
		t.Fatalf("expected match, got ok=%v err=%v", ok, err)
	}
	bad, err := VerifyPassword("wrong", h)
	if err != nil {
		t.Fatal(err)
	}
	if bad {
		t.Fatal("wrong password verified as correct")
	}
	// distinct salts → distinct encodings
	h2, _ := HashPassword("correct horse battery")
	if h == h2 {
		t.Fatal("expected unique salt per hash")
	}
}
