#!/bin/bash
set -e

echo "📦 Installing Worklog for Linux..."

# Detect latest version
# echo "🔍 Finding latest release..."
# API_RESPONSE=$(curl -s "https://api.github.com/repos/regisx001/Worklog/releases/latest")
# VERSION=$(echo "$API_RESPONSE" | grep -oP '"tag_name": "\K(.*)(?=")' | sed 's/^app-v//')

# if [ -z "$VERSION" ]; then
#     echo "❌ Failed to fetch latest version."
#     exit 1
# fi

# echo "🚀 Found version v$VERSION"

# # Setup temporary installation directory
# TMP_DIR=$(mktemp -d -t worklog-install-XXXXXX)
# cd "$TMP_DIR"

# Download AppImage
APPIMAGE_URL="https://github.com/regisx001/Worklog/releases/download/app-v1.2.18/worklog_1.2.17_amd64.AppImage"
echo "⬇️ Downloading AppImage..."
curl -L -o worklog.AppImage "$APPIMAGE_URL"
chmod +x worklog.AppImage

# Extract AppImage (This automatically bypasses the Wayland bug by dropping bundled libs!)
echo "📦 Extracting native binaries..."
./worklog.AppImage --appimage-extract > /dev/null

# Setup destination directories
mkdir -p ~/.local/bin
mkdir -p ~/.local/share/applications
mkdir -p ~/.local/share/icons/hicolor/256x256/apps

# Install files natively
echo "⚙️ Installing files..."
cp squashfs-root/usr/bin/worklog ~/.local/bin/worklog
chmod +x ~/.local/bin/worklog
cp -dr squashfs-root/usr/share/icons/hicolor/* ~/.local/share/icons/hicolor/

# Create Desktop Entry
echo "📝 Creating desktop shortcut..."
cat << EOF > ~/.local/share/applications/worklog.desktop
[Desktop Entry]
Name=Worklog
Exec=env WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_COMPOSITING_MODE=1 GDK_BACKEND=x11 $HOME/.local/bin/worklog
Icon=worklog
Type=Application
Categories=Development;Utility;Office;
Terminal=false
Comment=Local-first desktop project manager
EOF

# Update desktop databases
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database ~/.local/share/applications || true
fi

if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor || true
fi

# Cleanup
rm -rf "$TMP_DIR"

echo "✅ Installation complete!"
echo "You can now launch 'Worklog' from your application menu,"
echo "or run 'worklog' from the terminal (ensure ~/.local/bin is in your PATH)."
