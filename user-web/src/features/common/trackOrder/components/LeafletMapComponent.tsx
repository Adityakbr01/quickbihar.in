import React, { useRef, useEffect, useState, useCallback } from "react";
import { LocateFixed } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const theme = useTheme() as any;
  // ponytail: dark basemap tiles (CARTO, free) instead of a CSS filter —
  // filters blur markers and cost GPU on every frame.
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Send update to the map iframe
  const postToMap = useCallback((message: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), "*");
  }, []);

  const sendUpdate = useCallback((loc: LatLng | null, head: number) => {
    if (isWebViewLoaded) {
      postToMap({
        type: "UPDATE_RIDER",
        lat: loc ? loc.latitude : null,
        lng: loc ? loc.longitude : null,
        heading: head || 0,
      });
    }
  }, [isWebViewLoaded, postToMap]);

  const handleRecenter = () => {
    if (isWebViewLoaded) {
      postToMap({ type: "RECENTER" });
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
          html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; background: ${isDark ? "#0f0f0f" : "#e5e3df"}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
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

          // Free tiles: OSM standard (light) / CARTO dark_matter (dark).
          // Both require © OpenStreetMap credit; CARTO additionally © CARTO.
          L.tileLayer('${tileUrl}', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; OpenStreetMap contributors${isDark ? " &copy; CARTO" : ""}'
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

  // Bridge for window.ReactNativeWebView.postMessage inside the iframe
  // (the map HTML was written for react-native-webview).
  const bridgedHTML = leafletHTML.replace(
    "</head>",
    `<script>window.ReactNativeWebView={postMessage:function(m){window.parent.postMessage(m,"*");}};</script></head>`
  );

  // Map -> parent messages (READY).
  useEffect(() => {
    const onMapMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data && data.type === "READY") {
          setIsWebViewLoaded(true);
          if (riderLocation) sendUpdate(riderLocation, heading);
        }
      } catch {
        // Ignore parse errors
      }
    };
    window.addEventListener("message", onMapMessage);
    return () => window.removeEventListener("message", onMapMessage);
  }, [riderLocation, heading, sendUpdate]);

  return (
    <div className="relative h-full w-full flex-1" style={{ backgroundColor: "#e5e3df" }}>
      <iframe ref={iframeRef}
        srcDoc={bridgedHTML}
        title="Delivery tracking map"
        style={{ border: "none", width: "100%", height: "100%" }}
        onLoad={() => {
          setIsWebViewLoaded(true);
          if (riderLocation) sendUpdate(riderLocation, heading);
        }}
      />

      {/* Recenter Button */}
      {isWebViewLoaded && (
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map"
          className="absolute right-4 bottom-6 z-[999] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl"
        >
          <LocateFixed size={20} color="#FF6B00" />
        </button>
      )}

      {!isWebViewLoaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
          <span
            className="animate-spin rounded-full"
            style={{
              width: 36,
              height: 36,
              borderWidth: 3,
              borderStyle: "solid",
              borderColor: "#FF6B00",
              borderTopColor: "transparent",
            }}
          />
        </div>
      )}
    </div>
  );
};
