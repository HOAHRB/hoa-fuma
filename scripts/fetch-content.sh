#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

hoa_backend="${HOA_BACKEND:-$repo_root/.tools/bin/hoa-backend}"
major_data_archive="https://github.com/HOAHRB/hoa-major-data/archive/refs/heads/main.tar.gz"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir" temp' EXIT

rm -rf content/blog content/news content/docs
mkdir -p content
for type in blog news; do
  rm -rf temp
  git clone --depth 1 --filter=blob:none "https://github.com/HOAHRB/hoa-${type}" temp
  mv "temp/${type}" "content/${type}"
  rm -rf temp
done

curl -fsSL "$major_data_archive" | tar -xz -C "$workdir"
mv "$workdir/hoa-major-data-main" "$workdir/hoa-major-data"
# The site temporarily publishes ordinary undergraduate plans only.
rm -f \
  "$workdir/hoa-major-data/plans"/辅修_*.toml \
  "$workdir/hoa-major-data/plans"/第二学士学位_*.toml
ln -s "$repo_root/content" "$workdir/content"

(
  cd "$workdir"
  "$hoa_backend" --fetch
)
