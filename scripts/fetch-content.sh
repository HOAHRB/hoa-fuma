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
# The site publishes ordinary undergraduate plans only. Keep this as a
# whitelist so newly introduced plan categories are excluded by default.
find "$workdir/hoa-major-data/plans" -maxdepth 1 -type f -name '*.toml' ! -name '本_*.toml' -delete
ln -s "$repo_root/content" "$workdir/content"

(
  cd "$workdir"
  "$hoa_backend" --fetch
)
