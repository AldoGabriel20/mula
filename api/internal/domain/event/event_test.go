package event

import "testing"

// The role→capability matrix is the backbone of authorization; pin it down exactly.
func TestRoleCapabilities(t *testing.T) {
	cases := []struct {
		role                 Role
		editor, owner, staff bool
	}{
		{RoleOwner, true, true, true},
		{RoleCohost, true, false, true},
		{RolePlanner, true, false, true},
		{RoleFamily, false, false, false},
		{RoleUsher, false, false, true},
		{Role(""), false, false, false},           // unknown/empty role gets nothing
		{Role("superadmin"), false, false, false}, // arbitrary strings get nothing
	}
	for _, c := range cases {
		if got := c.role.IsEditor(); got != c.editor {
			t.Errorf("%q IsEditor=%v want %v", c.role, got, c.editor)
		}
		if got := c.role.IsOwner(); got != c.owner {
			t.Errorf("%q IsOwner=%v want %v", c.role, got, c.owner)
		}
		if got := c.role.IsStaff(); got != c.staff {
			t.Errorf("%q IsStaff=%v want %v", c.role, got, c.staff)
		}
	}
}

func TestValidTimezone(t *testing.T) {
	for tz, want := range map[string]bool{
		"Asia/Jakarta": true, "Europe/Amsterdam": true, "UTC": true,
		"": false, "Local": false, "Mars/Base": false, "asia jakarta": false,
	} {
		if got := ValidTimezone(tz); got != want {
			t.Errorf("ValidTimezone(%q)=%v want %v", tz, got, want)
		}
	}
}
