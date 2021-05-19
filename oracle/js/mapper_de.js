// mapper.js
// custom module for mapping address inputs

function getDataFromQuery(queryName) {
  var data = datasets.filter(function(d) {
    if (d) {
      return d.queryName == queryName;
    }
  })[0];

  if (!data) {
    alert("No such query: '" + queryName + "'");
    return [];
  }
  return data.content;
}

function icon_sourcer(transit_type, route) {
  url_stem = 'https://raw.githubusercontent.com/alextruesdale/oracle_modules/master/transport/';
  if (transit_type == 'ubahn') {
    return url_stem + 'ubahn/Berlin_' + route + '.svg?sanitize=true';
  } else if (transit_type == 'sbahn') {
    return url_stem + 'sbahn/Berlin_' + route + '.svg?sanitize=true';
  } else if (transit_type == 'tram') {
    return url_stem + 'tram/Berlin_Tram_' + route + '.svg?sanitize=true';
  } else if (transit_type == 'bus') {
    return url_stem + 'BUS-Logo-BVG.svg?sanitize=true';
  } else if (transit_type == 'ferry') {
    return url_stem + 'F%C3%A4hre-Logo-BVG.svg?sanitize=true';
  }
}

(function checkIfElemExists() {
  if (!document.querySelector('.object-frame .col11')) {
    window.requestAnimationFrame(checkIfElemExists);
  } else {
    setTimeout(function() {

      // mapbox mapping script

      var map = $("#map-object");
      var latitudes = [],
          longitudes = [];

      lat_lng_dict = {
        ".col2": latitudes,
        ".col3": longitudes
      };

      for (var column_id_reference in lat_lng_dict) {
        $('.reference-table').find(column_id_reference).not('.col_heading').each(function() {
          lat_lng_dict[column_id_reference].push(parseFloat($(this).text()));
        });
      }

      lat_lng_zip = [];
      for (i=0; i<latitudes.length; i++) {
        lat_lng_zip.push([latitudes[i], longitudes[i]]);
      }

      // Attributes from Table

      var similarities = [],
          distances = [],
          prices = [],
          pricesSqm = [],
          occupancies = [],
          floor = [],
          area = [],
          rooms = [],
          accommodates = [],
          balcony = [],
          elevator = [],
          wifi = [],
          washingMachine = [],
          dishWasher = [],
          active = [],
          online = [],
          hyperlink = [];

      table_attribute_dict = {
        ".col0": similarities,
        ".col1": distances,
        ".col4": prices,
        ".col5": pricesSqm,
        ".col6": occupancies,
        ".col8": floor,
        ".col9": area,
        ".col10": rooms,
        ".col11": accommodates,
        ".col12": balcony,
        ".col13": elevator,
        ".col14": wifi,
        ".col15": washingMachine,
        ".col16": dishWasher,
        ".col19": active,
        ".col20": online,
        ".col21": hyperlink
      };

      for (var column_id_table in table_attribute_dict) {
        if (column_id_table === ".col21") {
          $('.reference-table').find(column_id_table).not('.col_heading').each(function() {
            table_attribute_dict[column_id_table].push($(this).find('a').attr('href'));
          });
        }
        else {
          $('.reference-table').find(column_id_table).not('.col_heading').each(function() {
            table_attribute_dict[column_id_table].push($(this).text());
          });
        }
      }

      attributes_dict = {
        "Objekt Ähnlichkeit": similarities,
        "Objekt Entfernung": distances,
        "Monatlicher Preis": prices,
        "Preis m²": pricesSqm,
        "Belegung": occupancies,
        "Stockwerk": floor,
        "Wohnfläche": area,
        "Zimmer": rooms,
        "Anzahl Personen": accommodates,
        "Balkon": balcony,
        "Aufzug": elevator,
        "WLAN": wifi,
        "Waschmaschine": washingMachine,
        "Geschirrspüler": dishWasher,
        "Aktiv": active,
        "Online": online,
        "Web Link": hyperlink
      };

      var objectAttributes = [];
      for (i=0; i<latitudes.length; i++) {
        var subAttributes = [];
        for (var attribute in attributes_dict) {
          if (['Aktiv', 'Online', 'Web Link'].indexOf(attribute) < 0) {
            subAttributes.push(["<strong>", attribute, "</strong>: ", attributes_dict[attribute][i], "<br>"].join(''));
          } else if (attribute == 'Online' && attributes_dict[attribute][i] == 'True') {
            subAttributes.push([
              "<div class='hyperlink-wrapper'>",
                "<img class='hyperlink-logo' src='https://raw.githubusercontent.com/alextruesdale/oracle_modules/master/images/wf_logo.png'>",
                "<a href='", attributes_dict['Web Link'][i], "' target='_blank'>Listing Page</a>",
              "</div>"
              ].join(''));
          } else if (attribute == 'Aktiv' && attributes_dict[attribute][i] == 'True') {
            subAttributes.push([
              "<div class='active-signal'>",
                "<div class='active-light-active'></div>",
                "<p class='active-text'>Listing is Active</p>",
              "</div>"
            ].join(''));
          } else if (attribute == 'Aktiv' && attributes_dict[attribute][i] == 'False') {
            subAttributes.push([
              "<div class='active-signal'>",
                "<div class='active-light-inactive'></div>",
                "<p class='active-text'>Listing is Inactive</p>",
              "</div>"
            ].join(''));
          }
        }
        objectAttributes.push(subAttributes.join("\n"));
      }

      // Mapping

      var mapHeight = 500,
          title = "Reference Objects Map",
          id = "reference-map-map",
          idMap = "map-object";

      var objectAddress = $('.apartment-location').find('.python-results-text').text().trim(),
          objectLatitude = parseFloat($('.object-frame').find('.col1').not('.col_heading').text()),
          objectLongitude = parseFloat($('.object-frame').find('.col2').not('.col_heading').text()),
          objectPostcode = objectAddress.match(/.*(\d{5}).*/)[1];

      $("<div id='" + id + "'></div>").addClass(id)
                                      .addClass("mode-graphic-container")
                                      .addClass("col-md-12")
                                      .appendTo(".reference-map");

      d3.select("." + id)
        .style("margin-top", "20px");

      d3.select("." + id)
        .append("div")
        .attr("class", "mode-leaflet-map")
        .attr("id", idMap)
        .style("height", mapHeight + "px")
        .style("border-radius", "7px");

      var baseLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 18});

      var streets = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        accessToken: 'pk.eyJ1IjoiYWxleHRydWVzZGFsZSIsImEiOiJjazVmaWJ2NWYyOTBkM2pyZnBpNzdmaW82In0.mDjb2KOatX3l1o6Q1xdRGg'
      });

      var grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/light-v10',
        accessToken: 'pk.eyJ1IjoiYWxleHRydWVzZGFsZSIsImEiOiJjazVmaWJ2NWYyOTBkM2pyZnBpNzdmaW82In0.mDjb2KOatX3l1o6Q1xdRGg'
      });


      var objectIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/alextruesdale/oracle_modules/master/images/oracle_object_icon.png',
        iconSize: [27, 29],
        iconAnchor: [14, 27],
        popupAnchor: [1, -30]
      });

      var wfIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/alextruesdale/oracle_modules/master/images/wf_logo.png',
        iconSize: [23, 25],
        iconAnchor: [11, 21],
        popupAnchor: [-50, 0]
      });

      var objectOptions = {'className' : 'object-popup'};
      var routeOptions = {'className' : 'route-popup'};
      var referenceOptions = {'className' : 'reference-object-popup'};

      var Controls = {
        "lat": objectLatitude,
        "lng": objectLongitude,
        "zoom": 14
      };

      var buildMap = function(transport_data, plz_data) {

        // Postcodes

        var postcode_layers_list = [];
        $.each(plz_data, function(i) {
            var data = plz_data[i];
            var plz = String(data.plz),
                coordinates = JSON.parse(data.coordinates);

            var object = {
                "type": "Polygon",
                "coordinates": [coordinates]
            };

            var styling_plz = {
                "fillColor": "gray",
                "weight": 1,
                "opacity": 0.7,
                "color": "white",
                "fillOpacity": 0.3
            };

            if (plz == objectPostcode) {
              styling_plz.color = "red";
              styling_plz.opacity = 1;
              styling_plz.fillOpacity = 0;

              var plz_layer_target = L.geoJSON(object, {style: styling_plz}).bindTooltip(plz, {permanent: true, direction: "center", className: 'postcode-tooltip'}).openTooltip();
              postcode_layers_list.unshift(plz_layer_target);
            } else {
              var plz_layer = L.geoJSON(object, {style: styling_plz}).bindTooltip(plz, {permanent: true, direction: "center", className: 'postcode-tooltip'}).openTooltip();
              postcode_layers_list.push(plz_layer);
            }
        });

        postcode_layers_list.push(postcode_layers_list.shift());
        var plz_layers = L.layerGroup(postcode_layers_list);

        // Public Transport

        var bus_layers_list = [],
            ubahn_layers_list = [],
            sbahn_layers_list = [],
            tram_layers_list = [],
            ferry_layers_list = [];

        $.each(transport_data, function(i) {
            var data = transport_data[i];
            var route = data.route,
                route_colour = data.route_colour,
                transit_type = data.transit_type,
                coordinates = JSON.parse(data.coordinates),
                icon_source = icon_sourcer(transit_type, route);

            var styling_transport = {
                "color": "#fff",
                "weight": 3,
                "opacity": 0.70
            };

            styling_transport.color = route_colour;
            if (transit_type === "bus") {
              styling_transport.weight = 2;
            }

            var object = {
              "type": "LineString",
              "coordinates": coordinates
            };

            var object_layer = L.geoJSON(object, {style: styling_transport}).bindPopup("<img class='route-icon' src='" + icon_source + "'/>", routeOptions);

            if (transit_type === "bus") {
                bus_layers_list.push(object_layer);
            } else if (transit_type === "ubahn") {
                ubahn_layers_list.push(object_layer);
            } else if (transit_type === "sbahn") {
                sbahn_layers_list.push(object_layer);
            } else if (transit_type === "tram") {
                tram_layers_list.push(object_layer);
            } else if (transit_type === "ferry") {
                ferry_layers_list.push(object_layer);
            }
        });

        var bus_layers = L.layerGroup(bus_layers_list),
            ubahn_layers = L.layerGroup(ubahn_layers_list),
            sbahn_layers = L.layerGroup(sbahn_layers_list),
            tram_layers = L.layerGroup(tram_layers_list),
            ferry_layers = L.layerGroup(ferry_layers_list);

        var map = new L.Map(idMap, {
          center: new L.LatLng(Controls.lat, Controls.lng),
          zoom: Math.floor(Controls.zoom),
          layers: [baseLayer, streets, plz_layers, ubahn_layers, sbahn_layers, ferry_layers, tram_layers]
        });

        L.marker([objectLatitude, objectLongitude], {icon: objectIcon}).addTo(map).bindPopup(objectAddress, objectOptions).openPopup();

        for (i=0; i<lat_lng_zip.length; i++) {
          L.marker(lat_lng_zip[i], {icon: wfIcon}).addTo(map).bindPopup(objectAttributes[i], referenceOptions);
        }

        var control_panel_layers = {
          "Bus Linien": bus_layers,
          "U-Bahn Linien": ubahn_layers,
          "S-Bahn Linien": sbahn_layers,
          "Tram Linien": tram_layers,
          "PLZ Polygons": plz_layers,
          "Straßenansicht": streets,
          "Monochrom-Ansicht": grayscale
        };

        L.control.layers(null, control_panel_layers).addTo(map);
        return map;
      };

      var transport_data = getDataFromQuery('public_transport');
      var plz_data = getDataFromQuery('postcodes');
      var map_built = buildMap(transport_data, plz_data);

      return map_built;
    }, 2000);
  }
})();
