# GitHub সেটআপ রেকর্ড — iamatiq7

**তারিখ:** ২০২৬-০৯-১০ · **অ্যাকাউন্ট:** iamatiq7 · **রিপো:** `iamatiq7/spus_website`

## ১. যা যা করা হয়েছে

| # | কাজ | আগের অবস্থা | এখনকার অবস্থা |
|---|---|---|---|
| 1 | git কমিট পরিচয় (global) | `kaziatiqurrahman` / `kaziatiqurrahman6@gmail.com` | **`iamatiq7` / `iamatiq7@users.noreply.github.com`** ✔ |
| 2 | git কমিট পরিচয় (এই রিপো) | — | `iamatiq7` / `iamatiq7@users.noreply.github.com` ✔ |
| 3 | রিপোর remote URL | `github.com/kaziatiqurrahman/spus_website.git` | **`github.com/iamatiq7/spus_website.git`** ✔ |
| 4 | SEO ডোমেইন (canonical/OG/sitemap/robots) | — | `https://iamatiq7.github.io/spus_website/` ✔ (সঠিক) |
| 5 | লোকাল রিপো ফোল্ডার | — | `C:\Users\Administrator\Desktop\shantinagar-somiti-website` ✔ |

## ২. যাচাইয়ের ফলাফল

| যাচাই | ফলাফল |
|---|---|
| GitHub-এ রিপো আছে | ✔ `https://github.com/iamatiq7/spus_website` → HTTP 200 |
| রিমোটে বর্তমানে কোন কমিট | `94f78aa` (পুরনো build) |
| লোকালে কমিট | `9bae014`, `b21210c`, `94f78aa` — **৩টি** (২টি push বাকি) |
| লাইভ সাইট | ✔ `https://iamatiq7.github.io/spus_website/` → 200 (পুরনো build) |
| git identity মিল | ✔ `iamatiq7` |

## ৩. বাকি একমাত্র ধাপ: push (ক্রেডেনশিয়াল লাগবে)

**কেন:** এই মেশিনে iamatiq7-এর কোনো সংরক্ষিত ক্রেডেনশিয়াল নেই — push করলে Git Credential Manager (GCM) sign-in চায়।

**দুইটা উপায় (যেকোনো একটা):**
1. **GCM উইন্ডো:** push চালু থাকলে যে sign-in উইন্ডো খোলে, সেখানে **iamatiq7** দিয়ে sign in → **Authorize** (ব্রাউজারেও iamatiq7-এ login থাকতে হবে)।
2. **নতুন টোকেন (দ্রুততম):** GitHub → Settings → Developer settings → Personal access tokens (classic) → Generate new token → ☑ `repo` → টোকেনটা পাঠান; আমি সাথে সাথে push করে দেব।

## ৪. সমস্যা হলে (ট্রাবলশুটিং)

| সমস্যা | লক্ষণ | সমাধান |
|---|---|---|
| ভুল অ্যাকাউন্ট | `403 ... denied to <অন্য-অ্যাকাউন্ট>` | stored credential মুছুন: `git credential reject` → আবার push → সঠিক অ্যাকাউন্টে Authorize |
| টোকেন বাতিল | `Invalid username or token` | নতুন classic token (repo scope) বানান |
| আপলোড রিজেক্ট | `non-fast-forward` | `git pull --rebase origin main` → আবার push |
| উইন্ডো আসে না | GCM prompt না খুললে | `git config --global credential.helper manager` চেক করুন; স্ক্রিন লক থাকলে খুলুন |

## ৫. রোলব্যাক (আগের অবস্থায় ফেরা)

```powershell
# ১) git পরিচয় আগের অ্যাকাউন্টে ফেরানো
git config --global user.name "kaziatiqurrahman"
git config --global user.email "kaziatiqurrahman6@gmail.com"

# ২) remote আগের রিপোতে ফেরানো (দরকার হলে)
cd C:\Users\Administrator\Desktop\shantinagar-somiti-website
git remote set-url origin https://github.com/kaziatiqurrahman/spus_website.git

# ৩) push করা কমিট ফেরানো (সম্মতি নিয়ে)
git revert <commit-hash>      # নিরাপদ: নতুন কমিট দিয়ে বাতিল
# অথবা: git reset --hard 94f78aa && git push --force-with-lease   (সতর্কতা: হিস্টরি বদলায়)
```

- ব্যাকআপ ট্যাগ: `rollback-first-version` (94f78aa-তে) — push-এর পর ট্যাগগুলোও রিমোটে যাবে।
- কিছুই মোছা হয়নি; বিদ্যমান কোনো রিপোতে force-push করা হয়নি।

## ৬. পরবর্তী কাজ (দৈনন্দিন)

1. ফাইল বদলান → GitHub Desktop: Commit → **Push origin** (Desktop-এ iamatiq7 login থাকলে আর কিছু লাগবে না)।
2. Admin panel → Settings → **Download content.json** → ফোল্ডারে রেখে push → সবার জন্য লাইভ।
3. পুরো নিয়ম: `handover.md` দেখুন।
