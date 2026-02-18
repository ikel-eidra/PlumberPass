# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- IndexedDB support for larger question banks
- Cloud sync with conflict resolution
- Push notifications for study reminders
- Social features (study groups, leaderboards)

## [1.0.0] - 2025-02-17

### Added
- Initial release of PlumberPass
- **Phantom Audio Mode**: Hands-free studying with voice answers and tap patterns
- **Memory Anchor Algorithm**: Modified SM-2 spaced repetition system
- **PWA Support**: Offline capability with Service Worker
- **Onyx Interface**: AMOLED-optimized dark theme
- **Quiz Engine**: Multiple study modes (Daily, Mistakes, Topic, Custom)
- **Audio Engine**: Text-to-speech and speech-to-text using Web Speech API
- **SRS Engine**: Adaptive scheduling with leech detection
- **Question Bank**: 13+ verified questions from NPCP
- **Statistics Dashboard**: Readiness score, streaks, topic mastery
- **Mistake Library**: Track and review incorrect answers
- **Media Session API**: Lock screen controls for audio mode
- **Wake Lock API**: Keep screen on during study sessions

### Technical
- Vanilla JavaScript frontend (zero framework dependencies)
- FastAPI backend
- LocalStorage for client-side persistence
- CSS custom properties for theming
- Docker support for easy deployment
- Comprehensive documentation
- CI/CD pipeline with GitHub Actions

## [0.9.0] - 2025-02-10

### Added
- Beta release for testing
- Core quiz functionality
- Basic SRS implementation
- Question data structure

### Known Issues
- Audio mode not working on all browsers
- Sync not implemented
- Limited question bank

## [0.1.0] - 2025-02-01

### Added
- Initial project scaffold
- Basic FastAPI backend
- React frontend (later replaced with vanilla JS)
- Project documentation

---

## Release Notes Template

When creating a new release, use this template:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```
