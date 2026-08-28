import React, { useRef, useEffect, useState, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface LeafletMapComponentProps {
  riderLocation: LatLng | null;
  destination: LatLng;
  origin?: LatLng | null;
  heading: number;
  onPanDrag?: () => void;
}

export const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  riderLocation,
  destination,
  origin,
  heading,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);

  // Send update to WebView helper
  const sendUpdate = useCallback((loc: LatLng | null, head: number) => {
    if (webViewRef.current && isWebViewLoaded) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "UPDATE_RIDER",
          lat: loc ? loc.latitude : null,
          lng: loc ? loc.longitude : null,
          heading: head || 0,
        })
      );
    }
  }, [isWebViewLoaded]);

  const handleRecenter = () => {
    if (webViewRef.current && isWebViewLoaded) {
      webViewRef.current.postMessage(JSON.stringify({ type: "RECENTER" }));
    }
  };

  // HTML + Leaflet Template with OSRM Road Routing, Smooth Animation & Radar Pulse
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: #e5e3df; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          #map { height: 100%; width: 100%; }

          /* Animated Rider Marker */
          .rider-container {
            position: relative;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pulse-ring {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 107, 0, 0.25);
            animation: pulse 2s infinite ease-out;
            pointer-events: none;
          }
          @keyframes pulse {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          .rider-icon-wrapper {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%);
            border: 2.5px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            transition: transform 0.4s ease-out;
          }

          /* Destination & Origin Markers */
          .dest-marker {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border: 2.5px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
          .store-marker {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            border: 2.5px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var destCoords = [${destination.latitude}, ${destination.longitude}];
          var originCoords = ${origin ? `[${origin.latitude}, ${origin.longitude}]` : "null"};
          var currentRiderCoords = ${riderLocation ? `[${riderLocation.latitude}, ${riderLocation.longitude}]` : "null"};
          
          var map = L.map('map', { 
            zoomControl: false,
            attributionControl: false
          }).setView(currentRiderCoords || destCoords, 15);
          
          // Free OpenStreetMap Tiles
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(map);

          // 1. Destination Marker (Customer House)
          var destIcon = L.divIcon({
            className: 'custom-dest-icon',
            html: '<div class="dest-marker"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          });
          L.marker(destCoords, { icon: destIcon }).addTo(map);

          // 2. Store Marker (Pickup location, if available)
          if (originCoords) {
            var storeIcon = L.divIcon({
              className: 'custom-store-icon',
              html: '<div class="store-marker"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg></div>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });
            L.marker(originCoords, { icon: storeIcon }).addTo(map);
          }

          var riderMarker = null;
          var routePolyline = null;
          var isFetchingRoute = false;
          var lastRouteFetchTime = 0;

          // Free OSRM Road Routing API
          function fetchRoadRoute(startLat, startLng, endLat, endLng) {
            var now = Date.now();
            if (now - lastRouteFetchTime < 4000 || isFetchingRoute) return;
            isFetchingRoute = true;
            lastRouteFetchTime = now;

            var url = 'https://router.project-osrm.org/route/v1/driving/' + 
                      startLng + ',' + startLat + ';' + endLng + ',' + endLat + 
                      '?overview=full&geometries=geojson';

            fetch(url)
              .then(function(res) { return res.json(); })
              .then(function(data) {
                isFetchingRoute = false;
                if (data && data.routes && data.routes.length > 0) {
                  var coordinates = data.routes[0].geometry.coordinates.map(function(coord) {
                    return [coord[1], coord[0]]; // OSRM gives [lng, lat], Leaflet needs [lat, lng]
                  });
                  drawRoute(coordinates);
                } else {
                  // Fallback to straight line
                  drawRoute([[startLat, startLng], [endLat, endLng]]);
                }
              })
              .catch(function(err) {
                isFetchingRoute = false;
                // Fallback to straight line on error
                drawRoute([[startLat, startLng], [endLat, endLng]]);
              });
          }

          function drawRoute(latLngs) {
            if (routePolyline) {
              routePolyline.setLatLngs(latLngs);
            } else {
              routePolyline = L.polyline(latLngs, {
                color: '#FF6B00',
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
            }
          }

          function updateRider(lat, lng, heading) {
            if (!lat || !lng) return;
            var newLatLng = [lat, lng];

            // 1. Create or update rider marker
            if (!riderMarker) {
              var bicycleIcon = L.divIcon({
                className: 'rider-marker-wrapper',
                html: '<div class="rider-container"><div class="pulse-ring"></div><div class="rider-icon-wrapper" id="rider-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div></div>',
                iconSize: [44, 44],
                iconAnchor: [22, 22]
              });
              riderMarker = L.marker(newLatLng, { icon: bicycleIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              riderMarker.setLatLng(newLatLng);
            }

            // Rotate icon based on bearing
            var iconEl = document.getElementById('rider-icon');
            if (iconEl && typeof heading === 'number') {
              iconEl.style.transform = 'rotate(' + heading + 'deg)';
            }

            // 2. Fetch/Update Road Path
            fetchRoadRoute(lat, lng, destCoords[0], destCoords[1]);

            // 3. Smooth Fit Bounds
            var bounds = L.latLngBounds([newLatLng, destCoords]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          }

          function fitAll() {
            var points = [destCoords];
            if (riderMarker) points.push(riderMarker.getLatLng());
            if (originCoords) points.push(originCoords);
            var bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          }

          // Initial Render if rider location exists
          if (currentRiderCoords) {
            updateRider(currentRiderCoords[0], currentRiderCoords[1], ${heading || 0});
          } else {
            fitAll();
          }

          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.type === 'UPDATE_RIDER') {
                updateRider(data.lat, data.lng, data.heading);
              } else if (data.type === 'RECENTER') {
                fitAll();
              }
            } catch (e) {}
          });

          // Inform native React Native component that map is mounted
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
        </script>
      </body>
    </html>
  `;

  // Sync rider location updates
  useEffect(() => {
    if (riderLocation) {
      sendUpdate(riderLocation, heading);
    }
  }, [riderLocation, heading, sendUpdate]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadEnd={() => {
          setIsWebViewLoaded(true);
          if (riderLocation) sendUpdate(riderLocation, heading);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "READY") {
              setIsWebViewLoaded(true);
              if (riderLocation) sendUpdate(riderLocation, heading);
            }
          } catch {
            // Ignore parse errors
          }
        }}
      />

      {/* Recenter Button */}
      {isWebViewLoaded && (
        <TouchableOpacity
          style={styles.recenterBtn}
          activeOpacity={0.8}
          onPress={handleRecenter}
        >
          <Ionicons name="locate" size={20} color="#FF6B00" />
        </TouchableOpacity>
      )}

      {!isWebViewLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e5e3df", position: "relative" },
  webview: { flex: 1, backgroundColor: "#e5e3df" },
  recenterBtn: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#ffffff",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 999,
  },
  loading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
});
