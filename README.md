# WING to LiveTrax



## Description

WING to LiveTrax lets you synchronize your WING output group source names directly with LiveTrax, arm & record all tracks, and even schedule a recording in the future --- all with just a few mouse clicks.

## How to Use

1. **Download & Install**  
   Grab the latest installer for your platform from the [Releases](https://github.com/austinginn/WING-to-LiveTrax/releases) page and follow the normal installation steps.

2. **Launch the App**  
   Open Wing to LiveTrax from your Applications (macOS), Start Menu (Windows), or App Menu (Linux).

3. **Configure Connections**  
   - Enter your WING’s IP address in the **WING IP** field.  
   - Enter your LiveTrax machine’s IP address in the **LiveTrax IP** field. Leave it as `127.0.0.1` (localhost) unless WING to LiveTrax is running on a different computer than LiveTrax, in which case enter that machine’s IP.  
   - Select the **Source Group** (USB, MOD, CRD) that you are using for multi-tracking.

4. **Start Transfer**  
   Click **Start Transfer**. The app will connect to your WING, and trigger recordings in LiveTrax.

5. **Monitor Logs**  
   The built-in log panel shows connection status, timeouts, and success messages. Use it to verify that communication between the WING and LiveTrax are flowing correctly.

6. **Update & Donate**  
   - Check back on the [Releases](https://github.com/austinginn/WING-to-LiveTrax/releases) page for updates.  
   - If you find Wing to LiveTrax useful, you can support future development via Ko‑fi:

   [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M81985YD)

## Notes From Austin
Wing to LiveTrax is currently built with Electron and Vue to enable rapid prototyping and quick iteration, which results in a larger app footprint. Once the core functionality stabilizes and only minor updates remain, I plan to port the app to a more lightweight Rust-based framework (e.g., Tauri), reducing the final package size to <15 MB.

- **Built With:**  
  - Electron  
  - Vue 3 + Vite  
- **TODO:**  
  - Persist last used WING IP 


- **Packaging Targets:**  
  - macOS: Universal DMG & ZIP  
  - Windows: NSIS installer & ZIP  
  - Linux: AppImage & Debian (.deb)

- **License:** MIT © Austin Ginn

