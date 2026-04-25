import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

interface LatLng {
  latitude: number;
  longitude: number;
}

interface LeafletMapComponentProps {
  riderLocation: LatLng | null;
  destination: LatLng;
  heading: number;
  onPanDrag?: () => void;
}

export const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  riderLocation,
  destination,
  heading,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);

  // Send update to WebView helper
  const sendUpdate = (loc: LatLng, head: number) => {
    if (webViewRef.current && isWebViewLoaded) {
      console.log("[LeafletMap] Sending Position to WebView:", loc);
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "UPDATE_RIDER",
          lat: loc.latitude,
          lng: loc.longitude,
          heading: head,
        })
      );
    }
  };

  // HTML + Leaflet Template
  const leafletHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; }
          #map { height: 100vh; width: 100vw; background: #f0f0f0; }
          .rider-marker {
            transition: all 0.5s linear;
          }
          .bicycle-icon {
            background-color: #FF6B00;
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            width: 36px;
            height: 36px;
            transform-origin: center;
          }
          .dest-icon {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { 
            zoomControl: false,
            attributionControl: false
          }).setView([${destination.latitude}, ${destination.longitude}], 15);
          
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          // Destination Marker
          var destIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1239/1239525.png', // House icon
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            className: 'dest-icon'
          });

          L.marker([${destination.latitude}, ${destination.longitude}], { icon: destIcon }).addTo(map);

          var riderMarker = null;
          var routeLine = null;

          function updateRider(lat, lng, heading) {
            var newLatLng = [lat, lng];
            var destLatLng = [${destination.latitude}, ${destination.longitude}];
            
            // 1. Create/Update Rider
            if (!riderMarker) {
              var bicycleIcon = L.divIcon({
                className: 'rider-marker',
                html: '<div class="bicycle-icon" id="rider-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
              });
              riderMarker = L.marker(newLatLng, { icon: bicycleIcon }).addTo(map);
            } else {
              riderMarker.setLatLng(newLatLng);
              var iconEl = document.getElementById('rider-icon');
              if (iconEl) iconEl.style.transform = 'rotate(' + (heading || 0) + 'deg)';
            }

            // 2. Create/Update Route Path
            var path = [newLatLng, destLatLng];
            if (!routeLine) {
              routeLine = L.polyline(path, { 
                color: '#FF6B00', 
                weight: 4, 
                opacity: 0.6,
                dashArray: '8, 8'
              }).addTo(map);
            } else {
              routeLine.setLatLngs(path);
            }

            // 3. Smart Fit Bounds
            var bounds = L.latLngBounds([newLatLng, destLatLng]);
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
          }

          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.type === 'UPDATE_RIDER') {
                updateRider(data.lat, data.lng, data.heading);
              }
            } catch (e) {}
          });
          
          // Let React Native know we are ready
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
        </script>
      </body>
    </html>
  `;

  // Sync rider location when props change
  useEffect(() => {
    if (riderLocation) {
        sendUpdate(riderLocation, heading);
    }
  }, [riderLocation, heading, isWebViewLoaded]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: leafletHTML }}
        style={styles.webview}
        scrollEnabled={false}
        onLoadEnd={() => {
            setIsWebViewLoaded(true);
            // Immediate update if we have data already
            if (riderLocation) sendUpdate(riderLocation, heading);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'READY') {
                setIsWebViewLoaded(true);
            }
          } catch (e) {}
        }}
      />
      {!isWebViewLoaded && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
