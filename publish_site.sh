#!/bin/zsh
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$repo_dir"

if [[ $# -lt 1 ]]; then
  echo "usage: ./publish_site.sh \"commit message\""
  exit 1
fi

commit_message="$1"

git add -A

if git diff --cached --quiet; then
  echo "No staged changes to publish."
  exit 0
fi

git commit -m "$commit_message"
git push origin main

local_head="$(git rev-parse HEAD)"
remote_head="$(git ls-remote origin refs/heads/main | awk '{print $1}')"

if [[ -z "$remote_head" ]]; then
  echo "Remote head check failed."
  exit 1
fi

if [[ "$local_head" != "$remote_head" ]]; then
  echo "Remote mismatch: local=$local_head remote=$remote_head"
  exit 1
fi

echo "Published successfully: $local_head"
