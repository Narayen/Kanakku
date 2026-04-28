# ET - GitHub Actions Workflow Analysis Report

## 📋 Document Overview

This comprehensive report provides a detailed line-by-line analysis of all GitHub Actions workflows used in the ET project. GitHub Actions are automated CI/CD pipelines that trigger on repository events (push, pull request, manual trigger) and execute predefined jobs.

---

## Repository Structure

```
.github/
├── workflows/
│   ├── deploy.yml          # Deploy web app to GitHub Pages
│   └── android-build.yml   # Build Android APK
```

---

## Workflow 1: `deploy.yml` - Web Deployment to GitHub Pages

### File Location
`.github/workflows/deploy.yml`

### Purpose
Automatically build the React web app and deploy to GitHub Pages whenever code is pushed to the main branch or manually triggered.

### Detailed Line-by-Line Analysis

```yaml
name: Deploy to GitHub Pages
```
**Line 1**: Names the workflow. This name appears in GitHub Actions tab and in logs.

```yaml
on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

**Lines 2-5**: Defines workflow triggers:
- **`push:`**: Triggers when code is pushed
- **`branches: [ main ]`**: Only triggers on main branch (not on feature branches)
- **`workflow_dispatch:`**: Allows manual triggering from GitHub Actions admin panel (useful for re-running builds without committing)

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

**Lines 6-9**: Sets minimum required GitHub token permissions:
- **`contents: read`**: Read access to repo contents (checkout code)
- **`pages: write`**: Write access to GitHub Pages (deploy website)
- **`id-token: write`**: Write OIDC token (authenticates with GitHub Pages deployment)

**Why**: GitHub Actions uses least-privilege principle. Only grant needed permissions.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

**Lines 10-12**: Defines first job named "build":
- **`jobs:`**: Starts job section (can have multiple jobs running in parallel)
- **`build:`**: Job identifier (used for dependency chains)
- **`runs-on: ubuntu-latest`**: Executes on latest Ubuntu GitHub-provided runner

**What is Ubuntu**: GitHub's free CI runners run on Ubuntu 22.04 LTS containers. Each job is isolated.

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
```

**Lines 13-15**: First step - checkout source code:
- **`steps:`**: Sequential actions within job
- **`name: Checkout`**: Human-readable step name (displayed in logs)
- **`uses: actions/checkout@v4`**: Pre-built action that clones repo into runner's workspace
  - **`@v4`**: Version 4 (pinned version ensures stability)
  - **GitHub provides**: Checkout, setup-node, upload-artifact, etc. as reusable actions

```yaml
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
```

**Lines 16-19**: Setup Node.js environment:
- **`actions/setup-node@v4`**: Downloads and installs Node.js
- **`with:`**: Pass parameters to the action
- **`node-version: 22`**: Install Node 22 (matches package.json requirement)

**Why**: Runner has no Node pre-installed; must explicitly set it up.

```yaml
      - name: Install dependencies
        run: npm install
```

**Lines 20-21**: Install npm packages:
- **`run:`**: Execute shell command (unlike `uses:` which calls pre-built actions)
- **`npm install`**: Installs dependencies from package.json into node_modules/

**Time**: This typically takes 30-60 seconds for this project.

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

**Lines 22-25**: Build the app:
- **`npm run build`**: Executes vite build command (from package.json)
  - Compiles TypeScript to JavaScript
  - Bundles React components
  - Optimizes with tree-shaking
  - Output goes to `dist/` directory

- **`env:`**: Set environment variables
- **`VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}`**: 
  - **`${{ }}`**: GitHub Actions expression syntax (interpolates values)
  - **`secrets.GEMINI_API_KEY`**: References GitHub secret (stored in repo settings)
  - Passed to build system via env var
  - Vite reads via `import.meta.env.VITE_GEMINI_API_KEY`

**Why Secrets**: API keys must never be committed to git. GitHub Secrets encrypts them and only exposes at runtime.

```yaml
      - name: Setup Pages
        uses: actions/configure-pages@v4
```

**Lines 26-27**: Configure GitHub Pages deployment:
- **`actions/configure-pages@v4`**: Prepares GitHub Pages infrastructure
- Sets artifact permissions, deployment URL, etc.
- Required before `actions/upload-pages-artifact`

```yaml
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
```

**Lines 28-31**: Upload build output:
- **`actions/upload-pages-artifact@v3`**: Packages `dist/` directory
- **`path: './dist'`**: Relative path to upload (contains built HTML/CSS/JS)
- Artifacts are stored in GitHub for downstream jobs

**Important**: This job only builds. Next job will deploy.

```yaml
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
```

**Lines 32-37**: Second job named "deploy":
- **`environment:`**: Specifies GitHub environment (can have approval rules)
- **`name: github-pages`**: Environment name
- **`url:`**: Website URL shown in GitHub (set to deployed page URL)
- **`needs: build`**: **CRITICAL** - This job only runs after build succeeds
  - If build fails, deploy never runs
  - Jobs run in parallel by default; `needs:` creates dependency

```yaml
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Lines 38-41**: Deploy the artifact:
- **`actions/deploy-pages@v4`**: Publishes artifact from build job to GitHub Pages
- **`id: deployment`**: Step identifier for referencing outputs later
  - Used in parent job's `url:` field via `steps.deployment.outputs.page_url`
- Uploads dist/ contents to GitHub's web servers
- Makes website accessible at `https://[owner].github.io/[repo]/`

---

## Workflow 2: `android-build.yml` - Android APK Build

### File Location
`.github/workflows/android-build.yml`

### Purpose
Automatically build Android APK and upload as artifact whenever code is pushed to main or manually triggered. Users can then download the APK to install on Android devices.

### Detailed Line-by-Line Analysis

```yaml
name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:
```

**Lines 1-6**: Similar to web workflow:
- Triggers on main branch push or manual trigger
- No special permissions needed (runs on runner's compute only)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

**Lines 7-9**: Single build job on Ubuntu

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
```

**Lines 10-17**: Same as web workflow, plus:
- **`cache: 'npm'`**: Cache node_modules between runs
  - On first run: downloads dependencies (~2-5 min)
  - On repeat runs: restores from cache (~5-10 sec)
  - Uses npm cache key based on package-lock.json
  - **Optimization**: Speeds up CI significantly

```yaml
      - name: Install dependencies
        run: npm ci
```

**Line 21**: **`npm ci`** (vs `npm install` in web workflow):
- **`npm ci`**: "Clean install" - strict version pinning from package-lock.json
- **`npm install`**: May update package versions (non-deterministic)
- **Why**: CI/CD should be reproducible; use npm ci to ensure exact versions

```yaml
      - name: Build Web App
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

**Lines 22-25**: Same as web workflow - build React app first
- Must build to `dist/` before syncing to Android project

```yaml
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '21'
```

**Lines 26-30**: Install Java compiler:
- **`actions/setup-java@v4`**: Downloads JDK
- **`distribution: 'zulu'`**: Use Azul Zulu JDK (includes all tools)
- **`java-version: '21'`**: Java 21 (required for Android Gradle builds)
- Gradle (Android build tool) requires Java compiler

```yaml
      - name: Set up Android SDK
        uses: android-actions/setup-android@v3
```

**Lines 31-32**: Install Android SDK:
- **`android-actions/setup-android@v3`**: Community action (not official GitHub)
- Installs Android build tools, SDK version managers, emulators
- Configures ANDROID_SDK_ROOT environment variable
- Adds tools to PATH so gradle can find them

```yaml
      - name: Sync Capacitor
        run: npx cap sync android
```

**Lines 33-34**: Copy web files to Android project:
- **`npx cap sync android`**: Capacitor's sync command
- Copies `dist/` (built web app) → `android/app/src/main/assets/`
- Copies Capacitor plugins manifest
- Prepares Android project to build
- Without this, Android app has no code to run

```yaml
      - name: Fix Gradle Wrapper
        run: |
          cd android
          VERSION=$(grep "distributionUrl" gradle/wrapper/gradle-wrapper.properties | grep -oE "[0-9]+\.[0-9]+(\.[0-9]+)?")
          rm -f gradle/wrapper/gradle-wrapper.jar
          curl -L "https://raw.githubusercontent.com/gradle/gradle/v${VERSION}/gradle/wrapper/gradle-wrapper.jar" -o gradle/wrapper/gradle-wrapper.jar
          curl -L "https://raw.githubusercontent.com/gradle/gradle/v${VERSION}/gradlew" -o gradle/wrapper/gradle-wrapper.jar
          chmod +x gradlew
```

**Lines 35-42**: Fix Gradle build tool wrapper:
- **`cd android`**: Change into android/ directory
- **`grep "distributionUrl"...`**: Extracts Gradle version from wrapper.properties
- **`grep -oE "[0-9]+\.[0-9]+(\.[0-9]+)?"`**: Extracts version number (regex)
  - `[0-9]+`: One or more digits
  - `\.`: Literal dot
  - `(\.[0-9]+)?`: Optional version patch
  - Example: "8.0" or "8.0.1"

- **`rm -f gradle/wrapper/gradle-wrapper.jar`**: Delete old jar file (might be corrupted)
- **`curl -L ...jar`**: Download fresh gradle-wrapper.jar from GitHub releases
- **`curl -L ...gradlew`**: Download gradlew wrapper script
- **`chmod +x gradlew`**: Make gradlew executable (Unix permission)

**Why This Step**: GitHub Actions environment sometimes has corrupted Gradle wrapper. This re-downloads from official source.

```yaml
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
```

**Lines 43-46**: Compile Android app:
- **`cd android`**: Enter Android project directory
- **`./gradlew assembleDebug`**: Build unsigned debug APK
  - `./gradlew`: Gradle wrapper (platform-specific script)
  - `assembleDebug`: Gradle task to compile debug version
  - Outputs: `app/build/outputs/apk/debug/app-debug.apk`
  - Takes ~3-5 minutes (compiles Java, Kotlin, C++ code)

**Debug vs Release**:
- **Debug**: Unoptimized, unsigned APK for testing
- **Release**: Optimized, signed APK for Play Store (requires keystore)

```yaml
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

**Lines 47-51**: Save APK as downloadable artifact:
- **`actions/upload-artifact@v4`**: Stores file in GitHub
- **`name: app-debug`**: Artifact name shown in Actions tab
- **`path:`**: Source file (generated by gradle)
- **Retention**: GitHub keeps artifacts for 90 days by default
- **Download**: Users can download from GitHub Actions UI or CLI

---

## Workflow Execution Timeline

### Deploy Workflow (Typical Execution)
```
Event: Push to main branch
      ↓ (0s)
Start build job
      ↓ (5s) Checkout: Clone repo
      ↓ (10s) Setup Node: Download Node 22
      ↓ (15s) Install: npm install (cached)
      ↓ (20s) Build: npm run build (TypeScript compilation, bundling)
      ↓ (45s) Setup Pages: Configure GitHub Pages
      ↓ (50s) Upload artifact: Package dist/ directory
      ↓ (55s) build job completes ✓
      ↓ (55s) Start deploy job (waits for build)
      ↓ (60s) Deploy: Upload to GitHub Pages servers
      ↓ (65s) Deployment complete, website live ✓
```

**Total Time**: ~65 seconds
**Cost**: Free on public repos (60 min/month free on private repos)

### Android Build Workflow (Typical Execution)
```
Event: Push to main branch
      ↓ (0s) Start build job
      ↓ (10s) Checkout: Clone repo
      ↓ (15s) Setup Node: Download Node 22
      ↓ (20s) Install: npm ci (dependencies cached)
      ↓ (25s) Build Web: npm run build (30s)
      ↓ (55s) Setup Java: Download JDK 21
      ↓ (75s) Setup Android SDK: Download build tools
      ↓ (120s) Sync Capacitor: Copy dist/ to Android assets
      ↓ (125s) Fix Gradle Wrapper: Re-download Gradle
      ↓ (130s) Build APK: ./gradlew assembleDebug (3-5 min)
      ↓ (330s) Upload APK: Store artifact
      ↓ (335s) Build complete ✓
```

**Total Time**: ~5-6 minutes
**Cost**: 5-6 free compute minutes (small job)
**Storage**: APK artifact (~60-80 MB) counted toward storage quota

---

## Key Concepts Explained

### 1. Runners
- **What**: Virtual machines that execute workflow jobs
- **Options**: Ubuntu (Linux), Windows, macOS, or self-hosted
- **Ubuntu-latest**: GitHub's free tier runner (2-core CPU, 7GB RAM)
- **Region**: GitHub chooses nearest data center

### 2. Actions
- **Official**: GitHub-provided (setup-node, checkout, upload-artifact)
- **Community**: User-created (android-actions/setup-android)
- **Format**: YAML configuration + bash/Docker execution
- **Reusability**: Import others' actions to avoid reinventing

### 3. Artifacts
- **What**: Files or directories uploaded during workflow
- **Storage**: GitHub's infrastructure (100GB free per repo/month)
- **Retention**: 90 days default, configurable
- **Uses**: Build outputs, test reports, APKs, etc.

### 4. Secrets
- **Storage**: GitHub's encrypted vault
- **Access**: `${{ secrets.KEY_NAME }}` in YAML
- **Scope**: Account or organization
- **Expiry**: None (until manually deleted)
- **Best Practice**: Use least-privilege; rotate periodically

### 5. Environments
- **Purpose**: Group protection rules, secrets, variables
- **Example**: "production" environment requires approval
- **Usage**: Different secrets for dev vs prod deployment

### 6. Status Checks
- **Pass**: All steps succeed, exit code 0
- **Fail**: Any step fails, exit code non-zero
- **Blocked**: Failed status check prevents merge to main
- **Can Configure**: Required checks in branch protection rules

---

## Workflow Customization Guide

### Add Test Step to Deploy Workflow
```yaml
      - name: Run Tests
        run: npm run test    # Requires test script in package.json
```

### Add Notifications
```yaml
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            { "text": "Deployment succeeded!" }
```

### Build for Multiple Platforms
```yaml
jobs:
  deploy:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
```

### Schedule Workflow (Nightly Build)
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
```

---

## Common Issues & Debugging

| Issue | Cause | Solution |
|-------|-------|----------|
| Node modules not found | Cache miss | Run npm ci, add cache step |
| Gradle build fails | JDK version mismatch | Ensure java-version matches build.gradle |
| APK too large | Unoptimized build | Use pro guard rules, minify code |
| Deployment fails | Insufficient permissions | Check permissions: section |
| Secrets not expanding | Wrong syntax | Use `${{ secrets.NAME }}`, not `$secrets.NAME` |

---

## Security Considerations

### 1. Secrets Management
```yaml
# ✅ Correct - Use GitHub Secrets
env:
  API_KEY: ${{ secrets.API_KEY }}

# ❌ Wrong - Hardcoded (visible in logs)
env:
  API_KEY: sk-xxxxxxxxxxxxx
```

### 2. Workflow Permissions
```yaml
# ✅ Minimal required
permissions:
  contents: read
  pages: write

# ❌ Over-permissive
permissions:
  contents: write     # Can push to repo!
  id-token: write     # Can assume any role!
```

### 3. Dependency Security
```yaml
# ✅ Pinned version (stable)
uses: actions/setup-node@v4

# ⚠️ Latest (may break)
uses: actions/setup-node@latest

# ❌ Unversioned (very dangerous)
uses: actions/setup-node
```

### 4. Artifact Access
- Only members of repo can download
- Keep sensitive data (API keys, passwords) off artifacts
- Consider encrypting large datasets

---

## Performance Optimization Tips

### 1. Enable Caching
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'     # Cache node_modules
```

### 2. Use Faster Runners (Paid)
```yaml
runs-on: ubuntu-latest-8-cores  # More CPU = faster builds
```

### 3. Parallel Jobs
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
  # Both run simultaneously
```

### 4. Skip Workflows
```
git commit -m "Fix typo [skip ci]"  # Won't trigger workflow
```

### 5. Conditional Steps
```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main'  # Only on main branch
  run: npm run deploy
```

---

## Troubleshooting Checklist

- [ ] Workflow file valid YAML syntax (no quotes mismatch)
- [ ] `runs-on:` specified for each job
- [ ] All `uses:` actions have `@` version
- [ ] Environment variables spelled correctly
- [ ] `${{ }}` expression syntax correct
- [ ] Steps have `run:` or `uses:` (not both)
- [ ] File paths relative to workspace root
- [ ] Artifacts exist before upload step
- [ ] Secrets added to GitHub repository settings
- [ ] Branch filter matches current branch

---

## Conclusion

The ET project uses two essential GitHub Actions workflows:

1. **`deploy.yml`**: Automatically deploys web app to GitHub Pages (fast, ~1 min)
2. **`android-build.yml`**: Automatically builds Android APK (thorough, ~6 min)

Both workflows demonstrate CI/CD best practices:
- ✅ Version pinning for reproducibility
- ✅ Minimal permissions for security
- ✅ Proper dependency management (npm ci)
- ✅ Artifact storage for distribution
- ✅ Error handling and logging

The workflows enable continuous delivery: every commit to main automatically deploys, reducing manual effort and potential human error.

