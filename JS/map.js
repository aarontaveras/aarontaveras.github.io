// Begin JavaScript Document

/////////////////////////////////////////////////////////////
// MAP ACCESS TOKEN & BOUNDS
/////////////////////////////////////////////////////////////

// Initiate map
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5hZ3JhbXN0dWRpbyIsImEiOiJjanNsZHBsY2wwOGFvNDlueDBkZDExdWdtIn0.9XMxTQbfO7-_7JVTT4vtZg';

var bounds = [
	[-120.877490, 37.227085], // Southwest coordinates
	[-118.153135, 38.458969] // Northeast coordinates
];

/////////////////////////////////////////////////////////////
// MAP
/////////////////////////////////////////////////////////////

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/anagramstudio/cjszguam515hr1fllwnx7s55p',
	center: [-119.573159, 37.739671],
	zoom: 11,
	minZoom: 10,
	maxZoom: 15,
	maxBounds: bounds
});

// Add zoom controls
map.addControl(new mapboxgl.NavigationControl());

/////////////////////////////////////////////////////////////
// LOAD POINT LAYERS
/////////////////////////////////////////////////////////////

map.on('style.load', function () {
	map.addSource("points", {
		type: "geojson",
		data: "https://raw.githubusercontent.com/aarontaveras/Points/master/points.geojson"
	});

	map.addLayer({
		"id": "trailhead",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Trailhead",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('trailhead', ['==', 'TYPE', 'Trailhead']); // layer, attribute, name

	map.addLayer({
		"id": "high-camp",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Trailhead",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('high-camp', ['==', 'TYPE', 'High Camp']); // layer, attribute, name

	map.addLayer({
		"id": "climbing-area",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Trailhead",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('climbing-area', ['==', 'TYPE', 'Climbing Area']); // layer, attribute, name

	map.addLayer({
		"id": "campsite",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Trailhead",
			"icon-size": 1,
			"icon-anchor": "center",
			"visibility": "none",
		}
	});

	map.setFilter('campsite', ['==', 'TYPE', 'Campsite']); // layer, attribute, name
});

/////////////////////////////////////////////////////////////
// LOAD ALL POINT LAYERS WITH NAMES FOR LIST
/////////////////////////////////////////////////////////////

var stores = "https://raw.githubusercontent.com/aarontaveras/Trailheads/master/Trailheads.geojson";

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
					'icon-image': 'Trailhead',
					"icon-size": 1,
					"icon-anchor": "center",
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
		.setHTML(currentFeature.properties.NAME)
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
		link.innerHTML = prop.NAME;

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
		layers: ["trailhead", "high-camp", "climbing-area", "campsite"] // Add layers
	});

	if (!features.length) {
		return;
	}

	var feature = features[0];

	var popup = new mapboxgl.Popup({
			offset: 8 // Change popup tooltip offset from icon
		})
		.setLngLat(feature.geometry.coordinates)
		.setHTML(feature.properties.NAME) // Change attribute, properties.'Replace' (Uppercase)
		.addTo(map);
});



/////////////////////////////////////////////////////////////
// MOUSEOVERS
/////////////////////////////////////////////////////////////

map.on('mousemove', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["trailhead", "high-camp", "climbing-area", "locations", "campsite"] // Add layers
	});

	map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

/////////////////////////////////////////////////////////////
// ADD POPUPS TO ALL POLYGONS
/////////////////////////////////////////////////////////////

//map.on('click', "trail-mileage", function (e) {
//new mapboxgl.Popup()
//.setLngLat(e.lngLat)
//.setHTML(e.features[0].properties.MILES + " miles")
//.addTo(map);
//});

/////////////////////////////////////////////////////////////
// MOUSEOVERS
/////////////////////////////////////////////////////////////

//map.on('mousemove', "trail-mileage", function (e) {
// Change the cursor style as a UI indicator.
//map.getCanvas().style.cursor = 'pointer';
//});

/////////////////////////////////////////////////////////////
// TOGGLE A SINGLE LAYER
/////////////////////////////////////////////////////////////

// Toggle trailhead layer
var toggletrailheadId = ["trailhead"]; // Add layer

document.getElementById("trailheadIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggletrailheadId) {
		var clickedLayer = toggletrailheadId[index];
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

// Toggle high camp layer
var togglehighcampId = ["high-camp"]; // Add layer

document.getElementById("backcountryIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglehighcampId) {
		var clickedLayer = togglehighcampId[index];
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

// Toggle climbing area layer
var toggleclimbingId = ["climbing-area"]; // Add layer

document.getElementById("climbingIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggleclimbingId) {
		var clickedLayer = toggleclimbingId[index];
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

// Toggle climbing area layer
var togglecampsiteId = ["campsite"]; // Add layer

document.getElementById("campsiteIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglecampsiteId) {
		var clickedLayer = togglecampsiteId[index];
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

var toggleAllLayerIds = ["trailhead", "high-camp", "climbing-area", "campsite"];

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
