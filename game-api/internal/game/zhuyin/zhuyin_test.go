package zhuyin

import "testing"

func TestCategory(t *testing.T) {
	if len(Initials) != 21 || len(Medials) != 3 || len(Finals) != 13 {
		t.Fatalf("符號數量錯誤：%d %d %d", len(Initials), len(Medials), len(Finals))
	}
	for _, s := range Initials {
		if Category(s) != CategoryInitial {
			t.Errorf("%s 應為聲母", s)
		}
	}
	for _, s := range Medials {
		if Category(s) != CategoryMedial {
			t.Errorf("%s 應為介音", s)
		}
	}
	for _, s := range Finals {
		if Category(s) != CategoryFinal {
			t.Errorf("%s 應為韻母", s)
		}
	}
	for _, s := range []string{"ˉ", "ˊ", "ˇ", "ˋ", "˙"} {
		if Category(s) != CategoryTone {
			t.Errorf("%s 應為聲調", s)
		}
	}
	if Category("a") != "" {
		t.Error("非注音符號應回傳空字串")
	}
}

func TestParse(t *testing.T) {
	cases := []struct {
		in   string
		want Syllable
	}{
		{"ㄑㄧㄡ", Syllable{"ㄑ", "ㄧ", "ㄡ", 1}},
		{"ㄇㄧㄠˋ", Syllable{"ㄇ", "ㄧ", "ㄠ", 4}},
		{"˙ㄉㄜ", Syllable{"ㄉ", "", "ㄜ", 5}},
		{"ㄚ", Syllable{"", "", "ㄚ", 1}},
		{"ㄦˊ", Syllable{"", "", "ㄦ", 2}},
		{"ㄧˇ", Syllable{"", "ㄧ", "", 3}},
		{"ㄓ", Syllable{"ㄓ", "", "", 1}},
		{"ㄙˇ", Syllable{"ㄙ", "", "", 3}},
	}
	for _, c := range cases {
		got, err := Parse(c.in)
		if err != nil || got != c.want {
			t.Errorf("Parse(%q) = %+v, %v；想要 %+v", c.in, got, err, c.want)
		}
		if Format(got) != c.in {
			t.Errorf("Format(Parse(%q)) = %q", c.in, Format(got))
		}
	}
	for _, bad := range []string{"", "ㄚㄅ", "ㄅㄆ", "ˇˇ", "ㄧㄧ", "abc", "ㄅ˙"} {
		if _, err := Parse(bad); err == nil {
			t.Errorf("Parse(%q) 應該失敗", bad)
		}
	}
}

func TestSize(t *testing.T) {
	for in, want := range map[string]int{"ㄚ": 1, "ㄎㄚˇ": 2, "ㄑㄧㄡ": 3} {
		if got := Size(MustParse(in)); got != want {
			t.Errorf("Size(%q) = %d；想要 %d", in, got, want)
		}
	}
}
