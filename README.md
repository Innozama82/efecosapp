# Fuel Tracking App

A React Native app for tracking fuel consumption and finding nearby fuel stations.

## Features

### Fuel Station Map
- **Find Nearby Fuel Stations**: Press the "Find Fuel Stations Nearby" button on the dashboard to navigate to the fuel log screen with an interactive map
- **Interactive Map**: View nearby fuel stations with prices and distances
- **Location Services**: Uses device GPS to find your current location
- **Station Details**: Tap on stations to see prices and get navigation options

### How to Use the Map Feature

1. **From Dashboard**: 
   - Press the "Find Fuel Stations Nearby" button in the nearest fuel station card
   - This will navigate you to the fuel log screen

2. **On Fuel Log Screen**:
   - Press the "Show Map" button in the header
   - The app will request location permissions
   - A map will appear showing nearby fuel stations
   - Tap on any station to see details and navigation options

3. **Station Information**:
   - Each station shows name, distance, and price per liter
   - Tap on a station to get navigation options

## Setup Requirements

### OpenStreetMap Integration
The app uses OpenStreetMap for displaying maps, which provides:

1. **Free and Open Source**: No API keys required
2. **Global Coverage**: Maps available worldwide
3. **No Usage Limits**: Unlimited map requests
4. **Community Driven**: Updated by volunteers worldwide

### Location Permissions
The app requires location permissions to:
- Find your current location
- Show nearby fuel stations
- Provide accurate distance calculations

## Dependencies Added

- `react-native-maps`: For displaying interactive maps
- `expo-location`: For accessing device location services

## Development Notes

- The map currently shows mock fuel station data
- In a production app, you would integrate with a real fuel station API
- The navigation feature is currently a placeholder
- Location services work on both iOS and Android

## Troubleshooting

If the map doesn't load:
1. Check your internet connection
2. Ensure location permissions are granted
3. Verify that react-native-maps is properly installed
4. Try restarting the development server 