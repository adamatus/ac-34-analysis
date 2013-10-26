var formatDate = d3.time.format('%d:%m:%Y');
var formatTime = d3.time.format('%H:%M:%S.%L');
var format = d3.time.format('%d:%m:%Y %H:%M:%S.%L %Z');

var timeMapper = d3.time.scale().domain([formatTime.parse("13:00:00.000"),formatTime.parse("13:40:04.000")]).range([0,1000]);

// Add the time slider
var ts = $('#time-slider').slider({min:0,max:1000,
                    step:1,
                    value:0,
                    selection:'before',
                    formater: function(value) {
                                return timeMapper.invert(value);
                              }
                  })
        .on('slide',function(ev) {
                updateBoatPos(ev.value);
                });

// Add the base CloudMade map
var map = L.map('map').setView([37.82022604148547, -122.4294090270996], 13);
L.tileLayer('http://{s}.tile.cloudmade.com/78f159c3ec8c4290b7854cf0471003ec/997/256/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://cloudmade.com">CloudMade</a>',
    maxZoom: 18
}).addTo(map);

// Add initial SVG layer that we will build on
map._initPathRoot();

// Add svg group for all custom drawing
var svg = d3.select("#map").select("svg"),
    g = svg.append("g").attr('id','#d3-layer');

// Function to map Lat/Lon to current svg X/Y
function project(x) {
  return map.latLngToLayerPoint(new L.LatLng(x.lat, x.lon));
}

// Basic line drawing function
var track = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

// Hand entered positions for all race marks
// Computed by taking mean pos of the specific mark boats GPS track
var marks = [{lat:37.820190,lon:-122.456763,label:'Entry'},
             {lat:37.81705,lon:-122.455,label:'Start Gate (Stb)'},
             {lat:37.81746,lon:-122.4519,label:'Start Gate (Port)'},
             {lat:37.81284,lon:-122.4505,label:'Mark 1 (Port)'},
             {lat:37.82368,lon:-122.4008,label:'Leeward Gate (Port)'},
             {lat:37.82227,lon:-122.4004,label:'Leeward Gate (Stb)'},
             {lat:37.81286,lon:-122.4624,label:'Windward Gate (Stb)'},
             {lat:37.81437,lon:-122.4631,label:'Windward Gate (Port)'},
             {lat:37.81023,lon:-122.4012,label:'Finish Gate (Stb)'},
             {lat:37.81039,lon:-122.3993,label:'Finish Gate (Port)'}];

// Add marks to mark-group
var markGroup = g.append('g').attr('id','mark-group');
markGroup.selectAll('.mark')
        .data(marks.map(function(d) { return project(d); }),function(d,i) { return i; })
    .enter().append('svg:circle')
        .attr('class','mark')
        .attr('r',2)
        .attr('cx',function(d) { return d.x; })
        .attr('cy',function(d) { return d.y; })
        .on('mouseout',function(d,i) { console.log(marks[i].label); });


// List of boats to load/draw
var boats = [{id:'USA',className:'usa'},
             //{id:'PRO',className:'rc'},
             //{id:'HL1',className:'heli'},
             //{id:'HL2',className:'heli'},
             //{id:'RGR',className:'marshall'},
             //{id:'SHA',className:'marshall'},
//             {id:'U1',className:'ump'},
             //{id:'U2',className:'ump'},
             //{id:'U3',className:'ump'},
             //{id:'VOL',className:'cam'},
             //{id:'WEA',className:'cam'},
             {id:'NZL',className:'nzl'}];

var curTime = timeMapper.invert(0);

// Add boat-group
var boatLayer = g.append('g').attr('id','boat-group');


var loadedBoats = 0;

// Loop through the desired boats and read the CSV file then draw track
// Each loaded CSV gets wrapped as a closure so arguments hold up
// FIXME - There must be a proper way to do this scoped issue...
var loadboat = function loadboat(i) {
    var boat_id = boats[i].id;
    var boat_class = boats[i].className;
    d3.csv('../data/130925/csv/20130925130025-NAV-'+boat_id+'.csv')
        .row(function(d) { 
            return {lat:d.Lat, 
                    lon:d.Lon, 
                    heading:d.Hdg,
                    courseOverGround:d.COG,
                    speedOverGround:d.SOG,
                    trueWindDir:d.CourseWindDirection,
                    trueWindSpd:d.CourseWindSpeed,
                    heel:d.Heel,
                    pitch:d.Pitch,
                    time:formatTime.parse(d.LocalTime)
                    }; })
        .get(function(error,rows) { 
          
            // Save the loaded data to global object
            //track_points[boat_id] = rows;  
            boats[i].tracks = rows;
            updateBoatLoadingProgress(++loadedBoats);

         });
};

for (var i = 0; i < boats.length; i++) {
    loadboat(i);
}

function toDegrees (angle) {
      return angle * (180 / Math.PI);
}

function toRadians (angle) {
      return angle * (Math.PI / 180);
}

//var x = d3.scale.linear();
var x = d3.fisheye.scale(d3.scale.linear).distortion(0);
var y = d3.scale.linear();

var addStatPlot = function() {
        
        var b = boats[0];
        var width = $("#timeseries").width(); 
            height = 300;
        var margins = [40, 40, 10, 10], mb = margins[0], ml = margins[1], mt = margins[2], mr = margins[3];

        var svg = d3.select('#timeseries').append('svg')
                .style('height',height).style('width',width);

        var plot = svg.append('g').attr('id','plot').attr('transform','translate('+ml+','+mt+')');

        var w = width - (ml + mr),
            h = height - (mb + mt);
        x.range([0, w]).domain([0,b.tracks.length]);
        y.range([h, 0]).domain([0,50]);
        var yAxis = d3.svg.axis().scale(y).ticks(4).orient("left");
        var xAxis = d3.svg.axis().scale(x).ticks(10).orient("bottom");

        var statline = d3.svg.line()
            .x(function(d,i) { return x(i); })
            .y(function(d) { return y(d); });

        // Add x-axis
        plot.append("g")
              .attr("class", "x axis")
              .attr('transform','translate(0,'+h+')')
              .call(xAxis);

        // Add y-axis
        plot.append("g")
              .attr("class", "y axis")
              .call(yAxis);

        plot.append("svg:path").attr('class','stat-line')
            .attr('d',statline(b.tracks.map(function(d) { return d['speedOverGround']; })));

        plot.append('svg:circle').attr('id','stat-marker').attr('class','stat-marker').attr('r',5)
            .attr('cx',x(0)).attr('cy',function() { var tmp = b.tracks[0]['speedOverGround']; return y(tmp); });

        svg.on("mousemove", function() {
              var mouse = d3.mouse(this);
              x.distortion(5).focus(mouse[0]);
              svg.select('.stat-line')
                    .attr('d',statline(b.tracks.map(function(d) { return d['speedOverGround']; })));
              var idx = getBoatPoint(boats[0]);
              svg.select('#stat-marker')
                    .attr('cx',x(idx)).attr('cy',function() { var tmp = boats[0].tracks[idx]['speedOverGround']; return y(tmp); });
              svg.select(".x.axis").call(xAxis);
        });

        svg.on("mouseout", function() {
              var mouse = d3.mouse(this);
              x.distortion(0).focus(mouse[0]);
              svg.select('.stat-line')
                    .attr('d',statline(b.tracks.map(function(d) { return d['speedOverGround']; })));
              var idx = getBoatPoint(boats[0]);
              svg.select('#stat-marker')
                    .attr('cx',x(idx)).attr('cy',function() { var tmp = boats[0].tracks[idx]['speedOverGround']; return y(tmp); });
              svg.select(".x.axis").call(xAxis);
        });

};

var updateBoatLoadingProgress = function(progress) {
    // FIXME Actually show some sort of progress bar
    if (progress == boats.length) {
        updateBoats();
        addStatPlot();
    }
};

// Bisector accessor function to quickly find the index of the track array associated
// with the currently selected time
var bisect = d3.bisector(function(d) { return d.time; }).right;

var getBoatPosIdx = function(d) {
    // FIXME We need to do something smarter if the current timepoint is not in
    // the array... Right now we are only looking to see if we have gone past
    // the end... What if the current time is before we have any data? Should
    // fade out or hide the marker maybe? Do the same thing on boat addition.

    var point = getBoatPoint(d);
    return project(d.tracks[point]); 
}; 

var getBoatAtTime = function(d) { 
    var point = getBoatPoint(d);
    return d.tracks[point];
};

var getBoatPoint = function(d) { 
    var point = bisect(d.tracks,curTime);
    point = point < d.tracks.length ? point : d.tracks.length-1;
    return point;
};

var round_number = function round_number(num, dec) {
        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
};

var getApparentWind = function(d) { 
    d = getBoatAtTime(d); 
    var x = (d.trueWindSpd * Math.cos(toRadians(d.trueWindDir)-Math.PI/2)) +
                           (d.speedOverGround * Math.cos(toRadians(d.courseOverGround)-Math.PI/2));
    var y = (d.trueWindSpd * Math.sin(toRadians(d.trueWindDir)-Math.PI/2)) + 
                           (d.speedOverGround * Math.sin(toRadians(d.courseOverGround)-Math.PI/2)); 

    var spd = Math.sqrt(x*x+y*y);

    var apdir = Math.atan2(y,x)*180/Math.PI+90; // Rotate so 0 degree is North
    var boatdir = d.courseOverGround;

    var dir = Math.abs(Math.min(360-Math.abs(apdir-boatdir),Math.abs(apdir-boatdir)));

    return {x:x,y:y,spd:round_number(spd,2),dir:round_number(dir,2)};
};

var updateBoats = function () {
        // Create a group for the specific boat
        var boatGroup = boatLayer.selectAll('.boat-group')
                .data(boats,function(d) { return d.id; });

        var newBoatGroup = boatGroup.enter().append('svg:g')
                .attr('id',function(d) { return 'boat-group-'.concat(d.id); })
                .attr('class','boat-group');
            
        // Update the existing boat tracks
        boatGroup.selectAll('.track')
                .attr("d",function(d) { return track(d.tracks.map(function(d) { return project(d); })); });

        // Add the new tracks to the boat group
        newBoatGroup.append('svg:path')
                .attr("d",function(d) { return track(d.tracks.map(function(d) { return project(d); })); })
                .attr('id',function(d) { return 'track-'.concat(d.id); })
                .attr('class',function(d) { return 'track track-'.concat(d.className); });

        // Add new boat marker groups
        var newBoatMarkerGroup = newBoatGroup.append('svg:g')
                .attr('id',function(d) { return 'boat-icon-'.concat(d.id); })
                .attr('class',function(d) { return 'boat-icon boat-icon-'.concat(d.className); })
                .attr('transform',function(d) { var pt = getBoatPosIdx(d);
                        return 'translate('+pt.x+','+pt.y+')'; });

        // Add new boat location markers
        newBoatMarkerGroup.append('svg:circle')
                .attr('id',function(d) { return 'boat-marker-'.concat(d.id); })
                .attr('class',function(d) { return 'boat-marker boat-marker-'.concat(d.className); })
                .attr('r',3)
                .attr('cx',0)
                .attr('cy',0);

        // Add new boat stats group
        var newBoatStats = newBoatMarkerGroup.append('svg:g')
                .attr('id',function(d) { return 'boat-stats-'.concat(d.id); })
                .attr('class',function(d) { return 'boat-stats boat-stats-'.concat(d.className); });

        // Add new boat true wind arrow
        newBoatStats.append('svg:line')
            .attr('id',function(d) { return 'boat-stats-truewind-'.concat(d.id); })
            .attr('class',function(d) { return 'boat-stats-truewind boat-stats-truewind-'.concat(d.className); })
            .attr('x1',0).attr('y1',0)
            .attr('x2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.trueWindSpd * Math.cos(toRadians(d.trueWindDir)-Math.PI/2); })
            .attr('y2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.trueWindSpd * Math.sin(toRadians(d.trueWindDir)-Math.PI/2); });

        // Add new boat apparent wind arrow
        newBoatStats.append('svg:line')
            .attr('id',function(d) { return 'boat-stats-appwind-'.concat(d.id); })
            .attr('class',function(d) { return 'boat-stats-appwind boat-stats-appwind-'.concat(d.className); })
            .attr('x1',0).attr('y1',0)
            .attr('x2',function(d) { 
                return getApparentWind(d).x; })
            .attr('y2',function(d) { 
                return getApparentWind(d).y; });

        // Add new boat velocity arrow
        newBoatStats.append('svg:line')
            .attr('id',function(d) { return 'boat-stats-velocity-'.concat(d.id); })
            .attr('class',function(d) { return 'boat-stats-velocity boat-stats-velocity-'.concat(d.className); })
            .attr('x1',0).attr('y1',0)
            .attr('x2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.speedOverGround * Math.cos(toRadians(d.courseOverGround)-Math.PI/2); })
            .attr('y2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.speedOverGround * Math.sin(toRadians(d.courseOverGround)-Math.PI/2); });

        // Update display table 
        // TODO This is fugly... There must be some way of nexted selections to do this
        d3.select('#summary-table-boat').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { return boats[d].id; });
        d3.select('#summary-table-speed').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { var b = getBoatAtTime(boats[d]);
                    return b.speedOverGround; });
        d3.select('#summary-table-heading').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { var b = getBoatAtTime(boats[d]);
                    return b.heading; });
        d3.select('#summary-table-tws').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { var b = getBoatAtTime(boats[d]);
                    return b.trueWindSpd; });
        d3.select('#summary-table-twa').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { var b = getBoatAtTime(boats[d]);
                    return Math.round(Math.min(360-Math.abs(b.heading-b.trueWindDir),Math.abs(b.heading-b.trueWindDir)),2); });
        d3.select('#summary-table-aws').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { return getApparentWind(boats[d]).spd; });
        d3.select('#summary-table-awa').selectAll('td').data([0,1])
            .enter().append('td').text(function(d) { return getApparentWind(boats[d]).dir; });

        // Update existing specific boat icon details
        updateBoatPos(ts.slider().val());

};

// Function that gets called on map redraw (usually zoom) to fix plotted
// positions so they correspond to proper lat/lon
var updateView = function() {
    // Update mark positions
    g.selectAll('.mark')
        .data(marks.map(function(d) { return project(d); }),function(d,i) { return i; })
        .attr('cx',function(d) { return d.x; })
        .attr('cy',function(d) { return d.y; });
    
    updateBoats();
};

// Move the marker to a new position in time
var updateBoatPos = function(pos) {

    curTime = timeMapper.invert(pos);

    // Move marker to current location
    var icons = g.selectAll('.boat-icon')
            .attr('transform',function(d) { var pt = getBoatPosIdx(d);
                    return 'translate('+pt.x+','+pt.y+')'; });

    // Update boat stats
    icons.selectAll('.boat-stats-truewind')
            .attr('x2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.trueWindSpd * Math.cos(toRadians(d.trueWindDir)-Math.PI/2); })
            .attr('y2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.trueWindSpd * Math.sin(toRadians(d.trueWindDir)-Math.PI/2); });
    icons.selectAll('.boat-stats-appwind')
            .attr('x2',function(d) { 
                return getApparentWind(d).x; })
            .attr('y2',function(d) { 
                return getApparentWind(d).y; });
    icons.selectAll('.boat-stats-velocity')
            .attr('x2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.speedOverGround * Math.cos(toRadians(d.courseOverGround)-Math.PI/2); })
            .attr('y2',function(d) { 
                    d = getBoatAtTime(d); 
                    return d.speedOverGround * Math.sin(toRadians(d.courseOverGround)-Math.PI/2); });

    // Update boat summary table
    // TODO: Same ugly warning as above.  Nested selections please?
    d3.select('#summary-table-speed').selectAll('td').data([0,1])
        .text(function(d) { var b = getBoatAtTime(boats[d]);
                return b.speedOverGround; });
    d3.select('#summary-table-heading').selectAll('td').data([0,1])
        .text(function(d) { var b = getBoatAtTime(boats[d]);
                return b.heading; });
    d3.select('#summary-table-tws').selectAll('td').data([0,1])
        .text(function(d) { var b = getBoatAtTime(boats[d]);
                return b.trueWindSpd; });
    d3.select('#summary-table-twa').selectAll('td').data([0,1])
        .text(function(d) { var b = getBoatAtTime(boats[d]);
                return Math.round(Math.min(360-Math.abs(b.heading-b.trueWindDir),Math.abs(b.heading-b.trueWindDir)),2); });
    d3.select('#summary-table-aws').selectAll('td').data([0,1])
        .text(function(d) { return getApparentWind(boats[d]).spd; });
    d3.select('#summary-table-awa').selectAll('td').data([0,1])
        .text(function(d) { return getApparentWind(boats[d]).dir; });

    // Update boat stat plots
    var idx = getBoatPoint(boats[0]);

    d3.select('#stat-marker')
            .attr('cx',x(idx)).attr('cy',function() { var tmp = boats[0].tracks[idx]['speedOverGround']; return y(tmp); });
};

map.on("viewreset",updateView);

