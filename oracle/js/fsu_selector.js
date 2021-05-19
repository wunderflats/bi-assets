// fsu_selector.js
// custom module for fsu demand selector / switcher

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

var buildMenus = function() {
  $.get({url: 'https://raw.githubusercontent.com/alextruesdale/oracle_modules/master/html_modules/select.html',
         async: false}, function(data) {
             $(".mode-grid, .container").prepend(data);
        });
};

function fillMenus(fsu_locations) {
  $('.address-select').empty();
  $('.id-select').empty();

  var listing_ids = [],
      listing_addresses = [],
      reference_options = [
        'Monthly',
        'Weekly',
        'Daily',
      ],

      data_options = [
        'Listing Data',
        'Aggregate FSU Data',
        'WF Platform Data',
      ],

      vacant_options = [
        'No',
        'Yes'
      ];

  var fill_dict = {
    'listing_addresses': [listing_addresses, '.address-select'],
    'listing_ids': [listing_ids, '.id-select'],
    'reference_options': [reference_options, '.reference-select'],
    'data_options': [data_options, '.data-view-select'],
    'vacant_options': [vacant_options, '.vacant-objects-select']
  };

  $.each(fsu_locations, function(i, object) {
      listing_ids.push(object.listing_id);
      listing_addresses.push(object.address);
  });

  for (var collection in fill_dict) {
    if ($(fill_dict[collection][1]).children().length == 0) {
      $.each(fill_dict[collection][0], function(i, object) {
        $(fill_dict[collection][1]).append(
          "<option value='" + object + "' label='" + object + "' index='" + i + "'>" + object + "</option>"
        );
      });
    }
  }
}

function vacancySwitcher() {
  var vacant_only = $(".vacant-objects-select option:selected").text();
  var vacancy_data = getDataFromQuery('days_until_vacant');
  var fsu_locations = getDataFromQuery('live_fsu_listings');

  vacant_units = vacancy_data.filter(function (object) {
      return object.days_until_listing_is_bookable == 0;
    });

  vacant_ids = [];
  $.each(vacant_units, function(i, object) {
      vacant_ids.push(object.listing_id);
    });

  if (vacant_only == 'Yes') {
    fsu_locations = fsu_locations.filter(function(object) {
      return vacant_ids.indexOf(object.listing_id) >= 0;
    });
  } else if (vacant_only == 'No') {
    fsu_locations = fsu_locations.filter(function(object) {
      return vacant_ids.indexOf(object.listing_id) === -1;
    });
  }

  return fsu_locations;
}

(function checkIfElemExists() {
  if (!document.querySelector('.fsu-results-table')) {
    window.requestAnimationFrame(checkIfElemExists);
  } else {
    setTimeout(function() {

      var fsu_locations = getDataFromQuery('live_fsu_listings');
      buildMenus();
      fillMenus(fsu_locations);

      $('.address-select, .id-select').on('change', function() {
        if ($(this).attr('class').includes('address-select')) {
          live_index = $(".address-select").find(':selected').attr('index');
        } else if ($(this).attr('class').includes('id-select')) {
          live_index = $(".id-select").find(':selected').attr('index');
        }

        $(".address-select option[index=" + live_index + "]").attr('selected', true);
        $(".id-select option[index=" + live_index + "]").attr('selected', true);
      });

      $('.data-view-select').on('change', function() {
        var reference_frame = $(".data-view-select option:selected").text();

        if (reference_frame == 'Listing Data') {
          var fsu_locations = vacancySwitcher();
          fillMenus(fsu_locations);
        } else {
          $('.address-select').empty();
          $('.id-select').empty();
        }
      });

      $('.vacant-objects-select').on('change', function() {
        var fsu_locations = vacancySwitcher();
        fillMenus(fsu_locations);
      });

    }, 400);
  }
})();
