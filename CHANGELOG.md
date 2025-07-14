# Changelog

## [v2.0.1] - 2025-07-15

### Added
- File sharing support using `expo-sharing`, with proper permission handling and bundle identifier updates.

### Changed
- Switched audio backend from `expo-av` to `expo-audio` for improved stability and performance ([reference](https://www.reddit.com/r/reactnative/comments/1lzpqrl/comment/n34j1k8/)).
- Updated app icon.

### Fixed
- Downloading issues on some devices by replacing media library saving with sharing flow.
- Search functionality errors in **TopBar** component resolved.
