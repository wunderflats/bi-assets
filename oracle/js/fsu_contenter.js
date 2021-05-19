// fsu_selector.js
// custom module for fsu demand dynamic content

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

function getAverages(array, groupKeys, averageKeys) {
  var groups = {},
      result = [];

  array.forEach(o => {
      var key = groupKeys.map(k => o[k]).join('|'),
          group = groups[key];

      if (!group) {
        groups[key] = { count: 0, payload: {} };
        group = groups[key];
        averageKeys.forEach(k => group[k] = 0);
        groupKeys.forEach(k => group.payload[k] = o[k]);
        result.push(group.payload);
      }
      groups[key].count++;
      averageKeys.forEach(k => group.payload[k] = (group[k] += o[k]) / group.count);
  });
  return result;
}

function convert_time_to_string(date_in) {
  var new_date = new Date(date_in);
  var parseDate = d3.timeFormat("%b %d");

  return parseDate(new_date);
}

function buildChart(data_type_display, data_type_key, reference_frame,
                  data_view, selected_id) {

  // -----------------------------------------------------------------------------
  // ---------------------- SHAPE CONSTRUCTION VARIABLES -------------------------
  // -----------------------------------------------------------------------------

  var width = 960,
      height = 500,
      margin = 5,
      padding = 5,
      adj = 30;

  var svg = d3.select("." + data_type_key + "-svg-container").append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "-" + adj + " -" + adj + " " + (width + adj * 3) + " " + (height + adj * 3))
      .style("padding", padding)
      .style("margin", margin)
      .classed("svg-content", true);

  // -----------------------------------------------------------------------------
  // ------------------------------ TEST DIVIDER ---------------------------------
  // -----------------------------------------------------------------------------

  var dataset_raw = getDataFromQuery('aggregate_table_analytics_week');
  var dataset_avg = getAverages(dataset_raw, [reference_frame], [data_type_key]);

  dataset_avg = dataset_avg.map(function (object) {
    return {
      [reference_frame] : d3.isoParse(object[reference_frame]),
      [data_type_key] : object[data_type_key]
    };
  });

  if (data_view == 'Listing Data') {
    dataset = dataset_raw.filter(function (object) {
      return object.listing_id == selected_id;
    });
  }

  dataset = dataset.map(function(object) {
    if (object[data_type_key]) {
      return {
        'week': d3.isoParse(object[reference_frame]),
        [data_type_key]: object[data_type_key],
      };
    } else {
      return {
        'week': d3.isoParse(object[reference_frame]),
        [data_type_key]: 0,
      };
    }
  });

  var slice = [
    {
      id: 'Listing',
      values: dataset
    },
    {
      id: 'Avg.',
      values: dataset_avg
    }
  ];

  var xScale = d3.scaleTime().range([0, width]);
  var yScale = d3.scaleLinear().rangeRound([height, 0]);

  xScale.domain(d3.extent(dataset, function(d) {
      return d3.isoParse(d[reference_frame]);
    })
  );

  yScale.domain([(0), d3.max(dataset, function(d) {
      return d[data_type_key] + 2;
    })
  ]);

  var yaxis = d3.axisLeft().scale(yScale);
  var xaxis = d3.axisBottom().scale(xScale);

  if (reference_frame == 'week') {
    xaxis = d3.axisBottom()
              .ticks(d3.timeWeek.every(1))
              .tickFormat(d3.timeFormat('%b %d'))
              .scale(xScale);
  } else if (reference_frame == 'month') {
    xaxis = d3.axisBottom()
              .ticks(d3.timeMonth.every(1))
              .tickFormat(d3.timeFormat('%B'))
              .scale(xScale);
  } else if (reference_frame == 'day') {
    xaxis = d3.axisBottom()
              .ticks(d3.timeDay.every(1))
              .tickFormat(d3.timeFormat('%b %d'))
              .scale(xScale);
  }

  svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xaxis);

  svg.append("g")
      .attr("class", "axis")
      .call(yaxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("dy", ".75em")
      .attr("y", 6)
      .style("text-anchor", "end")
      .text(data_type_display);

  var line = d3.line()
      .x(function(d) { return xScale(d[reference_frame]); })
      .y(function(d) { return yScale(d[data_type_key]); });

  let id = 0;
  var ids = function () {
    return "line-"+id++;
  };

  var lines = svg.selectAll("lines")
      .data(slice)
      .enter()
      .append("g");

  lines.append("path")
       .attr("class", ids)
       .attr("d", function(d) {
         return line(d.values);
       });

  lines.append("text")
       .attr("class", "series-label")
       .datum(function(d) {
         return {
           id: d.id,
           value: d.values[d.values.length - d.values.length]};
        })

        .attr("transform", function(d) {
          return "translate(" + (xScale(d.value[reference_frame]) + 8) + "," + (yScale(d.value[data_type_key]) + 5 ) + ")";
        })

        .attr("x", 5)
        .attr("y", -3)
        .text(function(d) {
          return d.id;
        });

  var tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute");

  lines.selectAll("points")
       .data(function(d) {
          return d.values;
         }
       )

       .enter()
       .append("circle")
       .attr("cx", function(d) { return xScale(d[reference_frame]); })
       .attr("cy", function(d) { return yScale(d[data_type_key]); })
       .attr("r", 1)
       .attr("class", "point")
       .style("opacity", 1);

  lines.selectAll("circles")
       .data(function(d) {
          return(d.values);
         }
       )
       .enter()
       .append("circle")
       .attr("cx", function(d) { return xScale(d[reference_frame]); })
       .attr("cy", function(d) { return yScale(d[data_type_key]); })
       .attr('r', 7)
       .style('stroke-width', "27px")
       .style("stroke-opacity", 0.2)
       .style("stroke", "rgb(228, 228, 228)")
       .style("opacity", 0)

       .on('mouseover', function(d) {
          tooltip.transition()
         .duration(120)
         .delay(30)
         .style("opacity", 1);

         tooltip.html(
           "<div class='tooltip-top'>" + convert_time_to_string(d[reference_frame]) + "</div>" +
           "<div class='tooltip-body'>" + data_type + ": " + d[data_type_key].toFixed(1) + "</div>"
         )
                .style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY) + "px");

         var selection = d3.select(this).raise();
         selection.transition()
                  .delay("10")
                  .duration(120)
                  .attr("r", 7)
                  .style('stroke-width', "27px")
                  .style("stroke-opacity", 0.2)
                  .style("stroke", "rgb(228, 228, 228)")
                  .style("opacity", 1)
                  .style("fill", "#ed3700");
       })

       .on("mouseout", function(d) {
          tooltip.transition()
                 .duration(120)
                 .style("opacity", 0);

          var selection = d3.select(this);
          selection.transition()
                   .delay("20")
                   .duration(120)
                   .attr("r", 7)
                   .style('stroke-width', "27px")
                   .style("stroke-opacity", 0.2)
                   .style("stroke", "rgb(228, 228, 228)")
                   .style("opacity", 0);
        });
}

(function checkIfElemExists() {
  if (!document.querySelector('.fsu-results-table')) {
    window.requestAnimationFrame(checkIfElemExists);
  } else {
    setTimeout(function() {

        $('.address-select, .id-select, .data-view-select, .reference-select').on('change', function() {
          var selected_id = $(".id-select").find(':selected').html(),
              data_view = $(".data-view-select").find(':selected').html(),
              reference_frame = $(".reference-select").find(':selected').html();

          var data_type_display = 'Search Results List';
          var data_type_key = 'search-results-list';

          console.log(selected_id);
          console.log(data_view);
          console.log(reference_frame);
          console.log(data_type_display);
          console.log(data_type_key);
        });

      }, 400);
    }
})();
