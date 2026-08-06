# Windows install

The old `vite-plugin-prerender` dependency has been removed because it installed Puppeteer 1.x and attempted to download an obsolete Chromium build during `npm install`.

Open PowerShell in the project folder, stop any running Node process that is using this folder, and run:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm cache verify
npm ci
npm run dev
```

Use `npm ci` with the included `package-lock.json`. Do not delete the lock file before installing.

If Windows still reports `EPERM`, close VS Code terminals, File Explorer previews, and any antivirus scan currently holding the `node_modules` directory, then repeat the commands.
