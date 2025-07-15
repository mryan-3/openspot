# OpenSpot 🎶📱

<p align="center">
 <img width="100" alt="OpenSpot Logo" src="https://github.com/user-attachments/assets/a5ce6530-3f01-4418-bfe8-09a0d6055cb1" />
</p>





<h3 align="center">Your Gateway to Limitless Music - Now on Android, MacOS and Windows!</h3>

<p align="center">
  <strong>Stream and download high-quality music for free on your device, with no ads and no login required.</strong>
  <br />
  <em>Note: The Next.js web version has been moved to another branch and the demo URL is no longer active.</em>
</p>

<p align="center">
  <a href="https://github.com/BlackHatDevX/openspot-music-app/stargazers">
    <img src="https://img.shields.io/github/stars/BlackHatDevX/openspot-music-app?style=for-the-badge&color=ffd700" alt="Stars">
  </a>
  <a href="https://github.com/BlackHatDevX/openspot-music-app/network/members">
    <img src="https://img.shields.io/github/forks/BlackHatDevX/openspot-music-app?style=for-the-badge&color=84b4a3" alt="Forks">
  </a>
  <a href="https://github.com/BlackHatDevX/openspot-music-app/issues">
    <img src="https://img.shields.io/github/issues/BlackHatDevX/openspot-music-app?style=for-the-badge&color=f38ba8" alt="Issues">
  </a>
</p>

---

**OpenSpot** is the native version of the popular OpenSpot music streaming application. Built with React Native and Expo (for Android & iOS apps), ElectornJS (for Desktop Apps), it brings the same seamless, high-fidelity listening experience to your Windows, MacOS and Android devices with native performance and optimized features.

## ✨ Screenshots

![2025-07-14 00 51 30](https://github.com/user-attachments/assets/5a48d1e1-c862-4cea-9d0a-a29606ac5b74)

- **Release Notes & Changelog** : [HERE](https://github.com/BlackHatDevX/openspot-music-app/releases)

## 📱 Download Links

### Android
- **Download .apk**: [Latest Release V2.0.2](https://github.com/BlackHatDevX/openspot-music-app/releases/download/v2.0.2/OpenSpot-2.0.2-release.apk)

### MacOS
- **Download .dmg**: Coming Soon!

### Windows
- **Download .exe**: Coming Soon!

### Windows
- **Download .deb**: Coming Soon!

### iOS
- **TestFlight**: Coming Soon!

## ✨ Features

- **Native Experience**: Optimized for MacOS, Linux, Windows and Android  with smooth animations and native performance
- **High-Quality Streaming**: Listen to your favorite tracks in the best possible quality
- **Offline Downloads**: Save music directly to your device for offline listening
- **Background Playback**: Continue listening while using other apps
- **No Login Required**: Jump right in! No accounts or sign-ups needed
- **Like & Collect**: Build your personal collection by liking songs
- **Beautiful UI**: Clean, modern interface designed
- **Persistent Player**: Your queue and playback state are saved across app restarts
- **Completely Free & Ad-Free**: Enjoy uninterrupted music without any cost or advertisements

## 🚀 Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)

### For Development & Testing (Expo Go)

1. **Clone the repository**
   ```bash
   git clone https://github.com/BlackHatDevX/openspot-music-app.git
   cd openspot-music-app/OpenSpot-RN
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Test on your device**
   - Install **Expo Go** from the App Store (iOS) or Google Play Store (Android)
   - Scan the QR code from your terminal with Expo Go
   - The app will load directly on your device for testing

### For Production Builds (EAS Build)

#### Setup EAS

1. **Login to your Expo account**
   ```bash
   eas login
   ```

2. **Initialize EAS in your project**
   ```bash
   eas build:configure
   ```

#### Build for Android

1. **Development Build**
   ```bash
   eas build --platform android --profile development
   ```

2. **Preview Build (APK)**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Production Build**
   ```bash
   eas build --platform android --profile production
   ```

#### Build for iOS

1. **Development Build**
   ```bash
   eas build --platform ios --profile development
   ```

2. **Preview Build**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Production Build**
   ```bash
   eas build --platform ios --profile production
   ```

#### Build for Both Platforms

```bash
eas build --platform all --profile production
```


## 🏗️ Build Configuration

The app uses EAS Build with the following profiles configured in `eas.json`:

- **development**: For development builds with dev client
- **preview**: For internal testing (APK for Android)
- **production**: For app store distribution

## 💻 Tech Stack

- **Mobile Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Desktop Apps Framework**: [ElectornJS](https://www.electronjs.org/) 
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://expo.github.io/router/)
- **Audio**: [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
- **Styling**: [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)
- **State Management**: React Hooks & Context
- **Build System**: [EAS Build](https://docs.expo.dev/build/introduction/)
- **Development**: [Expo Go](https://expo.dev/client) for testing


## 🤝 Contributing & Community

OpenSpot is an open-source project. We welcome all contributions, from bug fixes to feature suggestions. Help us make OpenSpot the best free music platform for all devices!


## **Telegram** : [Openspot Music](https://telegram.dog/Openspot_Music)


### Getting Help

- Check the [Issues](https://github.com/BlackHatDevX/openspot-music-app/issues) section
- Contact the Author (see below)

## 👤 Author & Contact

**Jash Gro**

- **LinkedIn**: [https://linkedin.com/in/jash-gro/](https://linkedin.com/in/jash-gro/)
- **Portfolio**: [https://bit.ly/jashgro](https://bit.ly/jashgro)
- **Telegram**: [https://telegram.dog/deveIoper_x](https://telegram.dog/deveIoper_x)
- **GitHub**: [https://github.com/BlackHatDevX](https://github.com/BlackHatDevX)

## 📄 License

This project is open-source and licensed under the MIT License. See the `LICENSE` file for more information.

---

<p align="center">
  <strong>⭐ If you like this project, please give it a star! ⭐</strong>
  <br />
  <em>Your support helps us continue developing amazing free music apps for everyone.</em>
</p>
