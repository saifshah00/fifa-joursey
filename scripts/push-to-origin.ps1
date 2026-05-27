# Push current workspace to origin main
# Usage: Open an elevated PowerShell in the repo root and run: .\scripts\push-to-origin.ps1

param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$RemoteUrl = 'https://github.com/saifshah00/Fifa-Jersey-Shop.git',
    [string]$CommitMessage = 'Make Cloudflare-ready: fix Hono routing, drizzle types, Vite SPA fallback'
)

function ExitWith($code, $msg) {
    Write-Error $msg
    exit $code
}

Set-Location -Path $RepoPath

# Check git availability
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    ExitWith 2 "Git is not installed or not in PATH. Install Git for Windows: https://git-scm.com/download/win"
}

Write-Host "Git found: $(git --version)"

# Ensure we're in a git repo
try {
    git rev-parse --is-inside-work-tree >$null 2>&1
} catch {
    ExitWith 3 "Not a git repository. Initialize one first: git init"
}

# Show status
Write-Host "Staging all changes..."
git add -A

# Commit
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "No staged changes to commit. Creating commit anyway if there are unstaged changes."
}

Write-Host "Committing with message: $CommitMessage"
try {
    git commit -m "$CommitMessage" --allow-empty
} catch {
    Write-Host "git commit failed or nothing to commit. Continuing..."
}

# Ensure branch is main
Write-Host "Setting current branch to 'main'"
try {
    git branch -M main
} catch {
    Write-Host "Could not rename branch to main (it may already be named main)."
}

# Add or update remote
$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote 'origin' exists: $existing"
    if ($existing -ne $RemoteUrl) {
        Write-Host "Updating remote 'origin' to $RemoteUrl"
        git remote remove origin
        git remote add origin $RemoteUrl
    } else {
        Write-Host "Remote 'origin' already points to $RemoteUrl"
    }
} else {
    Write-Host "Adding remote 'origin' -> $RemoteUrl"
    git remote add origin $RemoteUrl
}

# Push
Write-Host "Pushing to origin main..."
try {
    git push -u origin main
    Write-Host "Push completed successfully."
} catch {
    ExitWith 4 "git push failed. Resolve auth or network issues and try again."
}
