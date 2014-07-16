## America's Cup 34 Analysis ##

America's Cup 34 was awesome. The new AC-72 catamarans were incredible. To help
myself and others fully appreciate the speeds that these boats are capable of
I'm creating this web-based interactive race analyzer. The end goal is to have
detailed replays of the races, with additional information overlays (principally
the apparent wind details).

This is currently very much a work in progress, as I work through integrating
[d3.js](http://d3js.org) and [leaflet](http://leafletjs.com).

### Details ###

The America's Cup Event Authority has provided detailed data on all of the races
of the 34th America's Cup (as well as the events leading up to the Cup).  These
data are available [here](http://noticeboard.americascup.com/Race-Data/).  Given
the size of the data I have not included them into the repository. Download the
desired data and place the files into a data folder in the reposity root.

**Update:** Great minds think alike. Mike Bostock and Shan Carter have created a
visualization for the final race for the New York Times, available
[here](http://www.nytimes.com/interactive/2013/09/25/sports/americas-cup-course.html).
Their version is considerably more polished, but doesn't include any of the
additional details about boat speed/apparent wind that my version includes.
