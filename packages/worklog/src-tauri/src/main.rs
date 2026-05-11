// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix for "Could not create default EGL display: EGL_BAD_PARAMETER" on AppImage
        // This forces WebKitGTK to fall back to stable rendering modes and prevents crashes on systems with broken EGL/Wayland/NVIDIA setups.
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        // Force X11 backend to avoid Wayland-specific library mismatch/grey-screen issues in AppImages
        std::env::set_var("GDK_BACKEND", "x11");
    }

    worklog_lib::run()
}
