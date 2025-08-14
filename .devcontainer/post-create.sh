#!/bin/bash
set -e

# Update package lists and install Tauri dependencies
echo "Updating package lists and installing Tauri dependencies..."
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Install project npm dependencies
echo "Installing project npm dependencies..."
npm install

# Install Gemini CLI globally
echo "Installing Gemini CLI globally..."
npm install -g @google/generative-ai/cli

# Add alias to .bashrc
echo "alias treex='tree -I \"node_modules|dist|target|.git|.vscode|.devcontainer|coverage\"'" >> ~/.bashrc

echo "Post-create script finished successfully."