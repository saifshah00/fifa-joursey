# Deploy script for api-server: commit, push, and deploy via pnpm
# Run from repository root in PowerShell

param(
    [string]$CommitMessage = "chore(api-server): make Worker-compatible routes, replace Node libs with Worker-friendly code",
    [switch]$SkipCommit
)

Write-Host "Running deploy script for @workspace/api-server..."

if (-not $SkipCommit) {
    git add -A
    if ($LASTEXITCODE -ne 0) { Write-Error "git add failed. Ensure git is installed and repository is clean."; exit 1 }

    git commit -m "$CommitMessage"
    if ($LASTEXITCODE -ne 0) { Write-Host "No commit created (maybe nothing to commit) or commit failed." }
    else { Write-Host "Committed changes." }

    git push origin main
    if ($LASTEXITCODE -ne 0) { Write-Error "git push failed. Check remote and authentication."; exit 1 }
}

Write-Host "Pushing complete. Deploying api-server with pnpm/wrangler..."

pnpm --filter @workspace/api-server deploy
if ($LASTEXITCODE -ne 0) { Write-Error "pnpm deploy failed. Check pnpm, wrangler, and your Cloudflare credentials."; exit 1 }

Write-Host "Deployment finished. Check Cloudflare dashboard or run 'wrangler tail' for logs." 
