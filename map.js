document.addEventListener("contextmenu", (event) => event.preventDefault()); //disable right click for map

// api key to access JotForm
JF.initialize({ apiKey: "336b42c904dd34391b7e1c055286588b" });

// get form submissions from JotForm Format: (formID, callback)
JF.getFormSubmissions("223067547406053", function (responses) {
  // array to store all the submissions: we will use this to create the map
  const submissions = [];
  // for each responses
  for (var i = 0; i < responses.length; i++) {
    // create an object to store the submissions and structure as a json
    const submissionProps = {};

    // add all fields of responses.answers to our object
    const keys = Object.keys(responses[i].answers);
    keys.forEach((answer) => {
      const lookup = responses[i].answers[answer].cfname ? "cfname" : "name";
      submissionProps[responses[i].answers[answer][lookup]] =
        responses[i].answers[answer].answer;
    });

    // convert location coordinates string to float array
    submissionProps["Location Coordinates"] = submissionProps[
      "Location Coordinates"
    ]
      .split(/\r?\n/)
      .map((X) => parseFloat(X.replace(/[^\d.-]/g, "")));

    // add submission to submissions array
    submissions.push(submissionProps);
  }

  // Import Layers
  const { MapboxLayer, ScatterplotLayer } = deck;

  // mapbox access token
  mapboxgl.accessToken =
    "pk.eyJ1Ijoibmlrby1kZWxsaWMiLCJhIjoiY2w5c3p5bGx1MDh2eTNvcnVhdG0wYWxkMCJ9.4uQZqVYvQ51iZ64yG8oong";

  const map = new mapboxgl.Map({
    container: document.body,
    style: "mapbox://styles/niko-dellic/cl9t226as000x14pr1hgle9az", // style URL
    center: [-71.10326, 42.36476], // starting position [lng, lat]
    zoom: 12, // starting zoom
    projection: "globe", // display the map as a 3D globe
  });

  map.on("load", () => {
    const firstLabelLayerId = map
      .getStyle()
      .layers.find((layer) => layer.type === "symbol").id;

    map.addLayer(
      new MapboxLayer({
        id: "deckgl-circle",
        type: ScatterplotLayer,
        data: submissions,
        getPosition: (d) => {
          return d["Location Coordinates"];
        },
        // Styles
        radiusUnits: "pixels",
        getRadius: 10,
        opacity: 0.7,
        stroked: false,
        filled: true,
        radiusScale: 3,
        getFillColor: [255, 0, 0],
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 255],
        parameters: {
          depthTest: false,
        },
        onClick: (info) => {
          getImageGallery(
            info.object.fileUpload,
            info.object.describeWhat,
            (preview = false)
          );
          flyToClick(info.object["Location Coordinates"]);
        },
      }),
      firstLabelLayerId
    );

    function getImageGallery(images, text, preview = false) {
      const imageGallery = document.createElement("div");
      imageGallery.id = "image-gallery";

      for (var i = 0; i < images.length; i++) {
        const image = document.createElement("img");
        image.src = images[i];

        imageGallery.appendChild(image);
      }

      // add text to image gallery
      const textDiv = document.createElement("div");
      textDiv.id = "image-gallery-text";
      textDiv.innerHTML = text;

      // add fixed styling if in modal view

      textDiv.style.position = "fixed";
      textDiv.style.top = "0";
      textDiv.style.left = "0";
      textDiv.style.right = "0";
      textDiv.style.borderRadius = "0";
      textDiv.style.padding = "2rem";

      imageGallery.appendChild(textDiv);

      // for closing the image gallery (only for click)
      imageGallery.addEventListener("click", function () {
        imageGallery.remove();
      });
      // append the image gallery to the body
      document.body.appendChild(imageGallery);
    }

    function flyToClick(coords) {
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 17,
        essential: true, // this animation is considered essential with respect to prefers-reduced-motion
      });
    }

    function addUserLocation(latitude, longitude) {
      return map.addLayer(
        new MapboxLayer({
          id: "circle",
          type: ScatterplotLayer,
          data: [{ longitude, latitude }],
          getPosition: (d) => [d.longitude, d.latitude],
          getSourceColor: [0, 255, 0],
          sizeScale: 15,
          getSize: 10,
          radiusUnits: "pixels",
          getRadius: 5,
          opacity: 0.7,
          stroked: false,
          filled: true,
          radiusScale: 3,
          getFillColor: [3, 202, 252],
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 255],
          parameters: {
            depthTest: false,
          },
        })
      );
    }

    // get current location
    const successCallback = (position) => {
      // add new point layer of current location to deck gl
      const { latitude, longitude } = position.coords;
      addUserLocation(latitude, longitude);
    };

    const errorCallback = (error) => {
      console.log(error);
    };

    // create async function to await for current location and then return the promise as lat long coordinates then resolve the promise
    function getCurrentLocation() {
      const currentLocation = navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback
      );
      return currentLocation;
    }
    if (navigator.geolocation) {
      getCurrentLocation();
    }
    const locationButton = document.createElement("div");
    // create a button that will request the users location
    locationButton.textContent = "Where am I?";
    locationButton.id = "location-button";
    locationButton.addEventListener("click", () => {
      // when clicked, get the users location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;

          locationButton.textContent =
            "Where am I? " +
            position.coords.latitude.toFixed(3) +
            ", " +
            position.coords.longitude.toFixed(3);

          addUserLocation(latitude, longitude);
          flyToClick([longitude, latitude]);
        });
      }
    });

    // add a button to take you to the next page
    const nextButton = document.createElement("a");
    nextButton.textContent = "Submit a request";
    nextButton.id = "next-button";
    nextButton.href = "./form.html";

    // append the button
    document.body.appendChild(locationButton);
    document.body.appendChild(nextButton);
  });
});
