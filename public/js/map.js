
	mapboxgl.accessToken = mapToken;
    const parsedCoordinates = JSON.parse(coordinates);

    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: "mapbox://styles/mapbox/streets-v12",  //style URL
        center: parsedCoordinates, // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 9 // starting zoom
    });
   
    const marker = new mapboxgl.Marker({color:'red'})
    .setLngLat(parsedCoordinates)
    .setPopup(new mapboxgl.Popup({offset: 25})
    .setHTML(`<p>Exact location will be provided after booking!</p>`))
    .addTo(map);