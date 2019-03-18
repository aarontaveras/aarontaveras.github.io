// Begin JavaScript Document

/////////////////////////////////////////////////////////////
// MAP ACCESS TOKEN & BOUNDS
/////////////////////////////////////////////////////////////

// Initiate map
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hZ3JhbXN0dWRpbyIsImEiOiJjanNsZHBsY2wwOGFvNDlueDBkZDExdWdtIn0.9XMxTQbfO7-_7JVTT4vtZg';

//var bounds = [
//[-120.088033, 37.345039], // Southwest coordinates
//[-119.049850, 38.236698]  // Northeast coordinates
//];

/////////////////////////////////////////////////////////////
// MAP
/////////////////////////////////////////////////////////////

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/outdoors-v10',
	center: [-77.016664, 38.921741],
	zoom: 13,
	minZoom: 2,
	maxZoom: 15,
	//maxBounds: bounds
});

// Add zoom controls
map.addControl(new mapboxgl.NavigationControl());

/////////////////////////////////////////////////////////////
// LOAD POINT LAYERS
/////////////////////////////////////////////////////////////

map.on('style.load', function () {
	map.addSource("sample", {
		type: "geojson",
		data: "https://raw.githubusercontent.com/aarontaveras/Sample-GeoJSON-Data/master/sample.geojson"
	});

	map.addLayer({
		"id": "sample-point-one",
		"type": "symbol",
		"source": "sample",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "circle-15",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('sample-point-one', ['==', 'region', 'North America']);

	map.addLayer({
		"id": "sample-point-two",
		"type": "symbol",
		"source": "sample",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "circle-15",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('sample-point-two', ['==', 'region', 'South America']);
});

/////////////////////////////////////////////////////////////
// LOAD LINESTRING LAYERS
/////////////////////////////////////////////////////////////

var stores = "https://raw.githubusercontent.com/aarontaveras/Sweetgreens/master/sweetgreens.geojson";

map.on('load', () => {
	fetch(stores)
		.then(response => response.json())
		.then((data) => {
			map.addSource("locations", {
				type: 'geojson',
				data: data
			});

			map.addLayer({
				"id": "locations",
				"type": "symbol",
				"source": "locations",
				"layout": {
					'icon-image': 'circle-15',
					'icon-allow-overlap': true,
				}
			});
		
			// Initialize the list
			buildLocationList(data);
		});
});

/////////////////////////////////////////////////////////////
// ADD EVENT LISTENER FOR WHEN A USER CLICKS ON THE MAP
/////////////////////////////////////////////////////////////

map.on('click', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["locations"]
	});

	if (features.length) {
		var clickedPoint = features[0];
		// 1. Fly to the point
		flyToStore(clickedPoint);

		// 2. Close all other popups and display popup for clicked store
		createPopUp(clickedPoint);

		// 3. Highlight listing in sidebar (and remove highlight for all other listings)
		var activeItem = document.getElementsByClassName('active');
		if (activeItem[0]) {
			activeItem[0].classList.remove('active');
		}

		var selectedFeature = clickedPoint.properties.address;

		for (var i = 0; i < stores.features.length; i++) {
			if (stores.features[i].properties.address === selectedFeature) {
				selectedFeatureIndex = i;
			}
		}

		var listing = document.getElementById('listing-' + selectedFeatureIndex);
		listing.classList.add('active');
	}
});

/////////////////////////////////////////////////////////////
// FLYTO CURRENT SELECTED LOCATION
/////////////////////////////////////////////////////////////

function flyToStore(currentFeature) {
	map.flyTo({
		center: currentFeature.geometry.coordinates,
		zoom: 15
	});
}

/////////////////////////////////////////////////////////////
// CREATE POPUP DURING FLYTO
/////////////////////////////////////////////////////////////

function createPopUp(currentFeature) {
	var popUps = document.getElementsByClassName('mapboxgl-popup');
	if (popUps[0]) popUps[0].remove();

	var popup = new mapboxgl.Popup({
		closeOnClick: true,
		offset: 8,
	})

	.setLngLat(currentFeature.geometry.coordinates)
		.setHTML(currentFeature.properties.address)
		.addTo(map);
}

/////////////////////////////////////////////////////////////
// BUILD LIST FROM GEOJSON PROPERTIES & ADD LISTENER
/////////////////////////////////////////////////////////////

function buildLocationList(data) {
	for (i = 0; i < data.features.length; i++) {
		// Create an array of all the stores and their properties
		var currentFeature = data.features[i];
		// Shorten data.feature.properties to just `prop` so we're not
		// writing this long form over and over again.
		var prop = currentFeature.properties;
		// Select the listing container in the HTML
		var listings = document.getElementById('listings');
		// Append a div with the class 'item' for each store 
		var listing = listings.appendChild(document.createElement('div'));
		listing.className = 'item';
		listing.id = "listing-" + i;

		// Create a new link with the class 'title' for each store 
		// and fill it with the store address
		var link = listing.appendChild(document.createElement('a'));
		link.href = '#';
		link.className = 'title';
		link.dataPosition = i;
		link.innerHTML = prop.address;

		// Create a new div with the class 'details' for each store 
		// and fill it with the city and phone number
		var details = listing.appendChild(document.createElement('div'));
		details.innerHTML = prop.city;
		if (prop.phone) {
			details.innerHTML += ' &middot; ' + prop.phoneFormatted;
		}

		// Create event listener for clicked location
		link.addEventListener('click', function (e) {
			// Update the currentFeature to the store associated with the clicked link
			var clickedListing = data.features[this.dataPosition];

			// 1. Fly to the point associated with the clicked link
			flyToStore(clickedListing);

			// 2. Close all other popups and display popup for clicked store
			createPopUp(clickedListing);

			// 3. Highlight listing in sidebar (and remove highlight for all other listings)
			var activeItem = document.getElementsByClassName('active');

			if (activeItem[0]) {
				activeItem[0].classList.remove('active');
			}
			this.parentNode.classList.add('active');

		});
	}
}

/////////////////////////////////////////////////////////////
// ADD POPUPS TO ALL ACTIVE ICONS
/////////////////////////////////////////////////////////////

map.on('click', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["sample-point-one", "sample-point-two"] // Add layers
	});

	if (!features.length) {
		return;
	}

	var feature = features[0];

	var popup = new mapboxgl.Popup({
			offset: 8 // Change popup tooltip offset from icon
		})
		.setLngLat(feature.geometry.coordinates)
		.setHTML(feature.properties.elevation) // Change attribute, properties.'Replace'
		.addTo(map);
});

/////////////////////////////////////////////////////////////
// MOUSEOVERS
/////////////////////////////////////////////////////////////

map.on('mousemove', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["sample-point-one", "sample-point-two", "locations"] // Add layers
	});

	map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

/////////////////////////////////////////////////////////////
// TOGGLE A SINGLE LAYER
/////////////////////////////////////////////////////////////

// Toggle single layer
var toggleLayerId = ["sample-point-one"]; // Add layer

document.getElementById("campsiteIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggleLayerId) {
		var clickedLayer = toggleLayerId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'active';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

/////////////////////////////////////////////////////////////
// TOGGLE ALL LAYERS
/////////////////////////////////////////////////////////////

var toggleAllLayerIds = ["sample-point-one", "sample-point-two"];

document.getElementById("selectIcon").onclick = function (e) {
	for (var index in toggleAllLayerIds) {
		var clickedLayer = toggleAllLayerIds[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'active';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

/////////////////////////////////////////////////////////////
// UTILITIES
/////////////////////////////////////////////////////////////

// Initiate focus for keyboard users
function handleFirstTab(e) {
	if (e.keyCode === 9) {
		document.body.classList.add('user-is-tabbing');
		window.removeEventListener('keydown', handleFirstTab);
	}
}

window.addEventListener('keydown', handleFirstTab);

// Keep button active when clicked
$('button').click(function () {
	if ($(this).hasClass('active')) {
		$(this).removeClass('active');
	} else {
		$(this).addClass('active');
	}
});

// End JavaScript
