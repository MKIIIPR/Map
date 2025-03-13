var data = {
    mapSize: 2000000,
    tileSize: 512,
    transformB: 403,
    transformD: -6.5,
    scale: 1.252
};

var map;

function initMap() {
    map = L.map('map', {
        crs: L.extend({}, L.CRS.Simple, {
            transformation: new L.Transformation(
                1 / (data.mapSize / data.tileSize),
                data.transformB,
                1 / (data.mapSize / data.tileSize),
                data.transformD
            ),
            scale: function (zoom) { return Math.pow(2, zoom) * data.scale; },
            zoom: function (zoom) { return Math.log(zoom / data.scale) / Math.LN2; }
        }),
        zoomControl: false,
        minZoom: 2,
        maxZoom: 8,
        zoom: 2,
        attributionControl: false,
        layers: [
            L.tileLayer('/map/{z}/{x}/{y}.png', { tileSize: data.tileSize })
        ]
    }).setView([570000, -800000]);

    L.control.attribution({ prefix: false })
        .addAttribution('<a href="https://deine-seite.com">Deine Spielkarte</a>')
        .addTo(map);

    map.addEventListener('mousemove', function (ev) {
        // Zeige die Koordinaten im HTML
        document.getElementById('map-coordinates').innerHTML =
            ev.latlng.lng.toFixed(0) + ', ' + ev.latlng.lat.toFixed(0);

        // Sende die Koordinaten an Blazor
        DotNet.invokeMethodAsync('AshesMap', 'UpdateCoordinates', ev.latlng.lat, ev.latlng.lng);
    });
}

function addMarker(lat, lng, text) {
    L.marker([lat, lng]).addTo(map)
        .bindPopup(text)
        .openPopup();
}
