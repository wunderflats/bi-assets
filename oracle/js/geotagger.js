// geotagger.js
// custom module for processing address inputs

function de_umlaut(value) {
  value = value.toLowerCase();
  value = value.replace(/ä/g, 'ae');
  value = value.replace(/ö/g, 'oe');
  value = value.replace(/ü/g, 'ue');
  value = value.replace(/ß/g, 'ss');
  return value
};

function fetch_coordinates(address_field) {
  var base_url = "https://nominatim.openstreetmap.org/search?q=";

  var street = de_umlaut(address_field[0].replace(/ /g, '+').trim()) + "+";
  var house_number = de_umlaut(address_field[1].trim()) + "+";
  var city = de_umlaut(address_field[2].trim()) + "+";
  var postcode = de_umlaut(address_field[3].trim());

  var query_url = base_url + street + house_number + city + postcode + "&format=json&limit=1";

  var Http = new XMLHttpRequest();
  Http.open("GET", 'https://nominatim.openstreetmap.org/search?q=weisestrasse+21+berlin+12049&format=json&limit=1', false);
  Http.send();

  result = JSON.parse(Http.response);
  coords = [result[0].lat, result[0].lon];
  return coords
};

var custom_input_field = `
  <div class="run-parameters-field">
    <div class="label-container">
      <label for="js_address_automater_module" class="control-label" title="Input Address">
        Input Address
      </label>
    </div>

    <div style="display:flex">
      <input style="width: 88%;" type="text" placeholder="Street, House Number, City, Postcode"
             id="js_address_automater_module" name="Input Address"
             class="form-control form-control-sm next-form-control light-form form-control-block">

      <div id="address_fill_button"
           style="background-color: green;
                  height: 24px;
                  width: 8.1%;
                  margin-left: 5px;
                  margin-top: 1px;">
      </div>
    </div>
  </div>
`;

$(document).ready(function() {
  window.parent.$(".run-parameters-container").find(".row").prepend(custom_input_field);
  window.parent.$("#address_fill_button").click(function(){
      var address_field = window.parent.$("#js_address_automater_module").val().split(",");
      var coords = fetch_coordinates(address_field);
      var lat = coords[0];
      var lng = coords[1];

      window.parent.$("#report_run_params_Object_Latitude").val(lat);
      window.parent.$("#report_run_params_Object_Longitude").val(lng);
  });
});
