// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix for "Could not create default EGL display: EGL_BAD_PARAMETER" on AppImage
        // This forces WebKitGTK to fall back to CPU rendering and prevents crashes on systems with broken EGL/Wayland/NVIDIA setups.
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    worklog_lib::run()
}
