// Contenu du fichier script.js

var map = L.map('map').setView([43.30071967259973, 0.8488742581919677], 14); 

var PlanIGN = L.tileLayer('https://wxs.ign.fr/{ignApiKey}/geoportail/wmts?' +
    '&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM' +
    '&LAYER={ignLayer}&STYLE={style}&FORMAT={format}' +
    '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}', {
        ignApiKey: 'decouverte',
        ignLayer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
        style: 'normal',
        format: 'image/png',
        service: 'WMTS',
        opacity: 1,
        attribution: ', Carte © IGN-F/Geoportail'
    });

var ortholayer = L.tileLayer(
    'https://wxs.ign.fr/decouverte/geoportail/wmts?service=WMTS&request=GetTile&version=1.0.0&tilematrixset=PM&tilematrix={z}&tilecol={x}&tilerow={y}&layer=ORTHOIMAGERY.ORTHOPHOTOS&format=image/jpeg&style=normal', {
        minZoom: 0,
        maxZoom: 18,
        tileSize: 256,
        attribution: "IGN-F/Géoportail"
    });

var ndviLayer = L.tileLayer.wms('https://www.geotests.net/geoserver/ows', {
        layers: 'fdelahaye:ndvi_15042021',
        format: 'image/png',
        transparent: true,
        attribution: 'Paul Faucher',
    }).addTo(map);

var baseLayers = {
    'Plan IGN': PlanIGN,
    'IGN Orthophoto': ortholayer
};

var addLayers = {
    'NDVI 15/04/2021':ndviLayer
}

L.control.layers(baseLayers, addLayers).addTo(map);
L.control.scale().addTo(map);

// Set the default base layer
ortholayer.addTo(map);

map.on('click', function(e) {
    var url = getFeatureInfoUrl(map, ndviLayer, e.latlng, { 'info_format': 'text/plain' });
    fetchAndDisplayInfo(url, e.latlng, map);
});


function getFeatureInfoUrl(map, layer, latlng, params) {
    var point = map.latLngToContainerPoint(latlng),
        size = map.getSize(),
        bounds = map.getBounds(),
        sw = bounds.getSouthWest(),
        ne = bounds.getNorthEast();

    var defaultParams = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: '',
        version: layer._wmsVersion,
        format: layer.options.format,
        bbox: sw.lng + ',' + sw.lat + ',' + ne.lng + ',' + ne.lat,
        height: size.y,
        width: size.x,
        layers: layer.options.layers,
        query_layers: layer.options.layers,
        info_format: 'text/plain'
    };

    params = L.Util.extend(defaultParams, params || {});
    params[params.version === '1.3.0' ? 'i' : 'x'] = parseInt(point.x);
    params[params.version === '1.3.0' ? 'j' : 'y'] = parseInt(point.y);

    return layer._url + L.Util.getParamString(params, layer._url, true);
}

// Créer une balise d'image
var img = document.createElement('img');
img.src = 'ndvi_img.jpg';
img.style.width = '200px';

function fetchAndDisplayInfo(url, latlng, map) {
    fetch(url)
        .then(function(response) {
            return response.text();
        })
        .then(function(data) {
            var ndviValue = parseFloat(data.split('=')[1].trim());
            ndviValue = ndviValue.toFixed(2);
            
            // Vérifier si la valeur NDVI est égale à zéro
            if (ndviValue == 0) {
                L.popup()
                    .setLatLng(latlng)
                    .setContent('<p style="font-size: 12px; text-align: center;">Pas d\'information sur le NDVI à cet endroit :(</p>')
                    .openOn(map);
            } else {
                L.popup()
                    .setLatLng(latlng)
                    .setContent('<p style="font-size: 12px; text-align: center;">La valeur de NDVI est de ' + ndviValue + '</p>'+ img.outerHTML)
                    .openOn(map);
            }
        });
};

