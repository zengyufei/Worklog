#!/bin/bash
set -e

echo "📦 Installing Worklog for Linux..."

# Detect latest version
echo "🔍 Finding latest release..."
API_RESPONSE=$(curl -s "https://api.github.com/repos/regisx001/Worklog/releases/latest")
VERSION=$(echo "$API_RESPONSE" | grep -oP '"tag_name": "\K(.*)(?=")' | sed 's/^app-v//')

if [ -z "$VERSION" ]; then
    echo "❌ Failed to fetch latest version."
    exit 1
fi

echo "🚀 Found version v$VERSION"

# Setup directories
mkdir -p ~/.local/bin
mkdir -p ~/.local/share/applications
mkdir -p ~/.local/share/icons/hicolor/256x256/apps

# Download AppImage
APPIMAGE_URL="https://github.com/regisx001/Worklog/releases/latest/download/worklog_${VERSION}_amd64.AppImage"
echo "⬇️ Downloading AppImage..."
curl -L -o ~/.local/bin/worklog.AppImage "$APPIMAGE_URL"
chmod +x ~/.local/bin/worklog.AppImage

# Create Wrapper Script for Wayland fix
echo "⚙️ Creating wrapper script..."
cat << 'EOF' > ~/.local/bin/worklog
#!/bin/bash
# Bypass Wayland AppImage crash by prioritizing system libwayland
LD_PRELOAD=/usr/lib/libwayland-client.so ~/.local/bin/worklog.AppImage "$@"
EOF
chmod +x ~/.local/bin/worklog

# Download Icon
ICON_URL="https://raw.githubusercontent.com/regisx001/Worklog/master/packages/site/static/favicon.png"
curl -sL -o ~/.local/share/icons/hicolor/256x256/apps/worklog.png "$ICON_URL" || true

# Create Desktop Entry
echo "📝 Creating desktop shortcut..."
cat << EOF > ~/.local/share/applications/worklog.desktop
[Desktop Entry]
Name=Worklog
Exec=$HOME/.local/bin/worklog
Icon=worklog
Type=Application
Categories=Development;Utility;Office;
Terminal=false
Comment=Local-first desktop project manager
EOF

# Update desktop database
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database ~/.local/share/applications || true
fi

echo "✅ Installation complete!"
echo "You can now launch 'Worklog' from your application menu,"
echo "or run 'worklog' from the terminal (ensure ~/.local/bin is in your PATH)."
