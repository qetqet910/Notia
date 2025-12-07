#!/bin/bash
set -e

# Update package lists and install Tauri dependencies
echo "Updating package lists and installing Tauri dependencies..."
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Add this section to fix the locale issue
echo "Setting Korean locale..."
sudo apt-get install -y locales
sudo sed -i -e 's/# ko_KR.UTF-8 UTF-8/ko_KR.UTF-8 UTF-8/' /etc/locale.gen
sudo locale-gen

# Install project npm dependencies
echo "Installing project npm dependencies..."
npm install

# Install Gemini CLI globally
echo "Installing Gemini CLI globally..."
npm install -g @google/gemini-cli

# Add alias to .bashrc and set locale permanently
echo "alias treex='tree -I \"node_modules|dist|target|.git|.vscode|.devcontainer|coverage\"'" >> ~/.bashrc
echo 'export LANG="ko_KR.UTF-8"' >> ~/.bashrc
echo 'export LC_ALL="ko_KR.UTF-8"' >> ~/.bashrc

echo "Post-create script finished successfully."