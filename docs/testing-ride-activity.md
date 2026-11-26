# Test automatic ride detection on iPhone

Use a physical iPhone and a fresh development build with Live Activities enabled in iOS Settings. Expo Go can display the transit board. The ride detector uses native background location and a widget extension supplied by the development build.

1. Run `npx eas-cli@latest build --platform ios --profile development`, install the resulting build on the registered iPhone, and run `npm run start:dev` on your computer. Open the project from the development client.
2. In Merre, open **Settings → Ride Live Activity → Detect my ride in the background**. Grant precise location and Always access. Check that enabling the switch leaves the Lock Screen clear.
3. Board a vehicle with a live position in Merre. For the first test keep Merre open until it matches the ride. The matcher needs multiple fresh fixes, at least 20 seconds and about 100 metres of shared movement. A cluster of vehicles can delay identification.
4. Lock the screen. Compare the line, headsign, stop times and delays with the trip in Merre. Long-press the Dynamic Island on a supported iPhone to see the expanded stop list. Disable detection in Settings to end the activity immediately.

## Test boarding with the phone already locked

This exercises a different iOS path. On iOS 17.2 or newer, Merre can ask Apple Push Notification service (APNs) to start the activity after a background match. The app can then update the activity from subsequent location fixes.

- Serve the included `POST /api/rides/start` Expo Router API on a Node server with outbound HTTP/2 access to APNs. For development you can run Expo on your computer and point `EXPO_PUBLIC_RIDE_API_ORIGIN` at its phone-accessible HTTPS origin. Set that variable before starting Metro and reload the client. The default origin is `https://merre.bencica.hu`.
- Set `APNS_TEAM_ID`, `APNS_KEY_ID` and `APNS_PRIVATE_KEY` on the API server. Use the Apple team's APNs signing key in PEM format. The key stays on the server. Set `APNS_ENVIRONMENT=sandbox` for a development-signed binary or `production` for an ad hoc or TestFlight binary. Match the signed build's `aps-environment` entitlement.
- Enable detection, then lock the phone **before boarding** and leave Merre running in the background. The Lock Screen should stay clear at the stop. After the phone and a uniquely identifiable vehicle move together, the first activity should show that vehicle's details. When checking server logs, HTTP 202 means APNs accepted the start request, 503 means server credentials are missing, and 502 means the APNs request failed.

See [Expo SDK 58 Live Activities](https://docs.expo.dev/versions/v58.0.0/sdk/widgets/#live-activities).
