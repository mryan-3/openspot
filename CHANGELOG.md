# Changelog

## [v2.0.2] - 2025-01-16

### Added
- **macOS Support**: Full desktop app support for macOS with native window controls and audio management
- **Project Structure**: Added complete Electron desktop app alongside existing React Native mobile app

## [v2.0.1] - 2025-07-15

### Added
- File sharing support using `expo-sharing`, with proper permission handling and bundle identifier updates.

### Changed
- Switched audio backend from `expo-av` to `expo-audio` for improved stability and performance ([reference](https://www.reddit.com/r/reactnative/comments/1lzpqrl/comment/n34j1k8/)).
- Updated app icon.

### Fixed
- Downloading issues on some devices by replacing media library saving with sharing flow.
- Search functionality errors in **TopBar** component resolved.

