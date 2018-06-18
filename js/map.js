'use strict';

var initialLocations = [
	{
		name: 'Padmapuram Garden',
		lat: 18.3366529,
		long:82.8754995
	},
	{
		name: 'Tribal Museum',
		lat: 18.3235253,
		long:82.8762852
	},
	{
		name: 'coffee Museum',
		lat: 18.2954518,
		long:82.8540037
	},
	{
		name: 'Katika Water Falls',
		lat: 18.2427753,
		long:83.0010472
	},
	{
		name: 'Chaparai Water Cascade',
		lat: 18.2923642,
		long:82.7954825
	},
	{
		name: 'Arakku station',
		lat: 18.3340178,
		long:82.8639183
	}
];

// Declaring global variables now to satisfy strict mode
var map;
var clientID;
var clientSecret;
var infoWindow;





//Get the valid Phone number
function formatPhone(phonenum) {
    var regexObj = /^(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (regexObj.test(phonenum)) {
        var parts = phonenum.match(regexObj);
        var phone = "";
        if (parts[1]) { phone += "+1 (" + parts[1] + ") "; }
        phone += parts[2] + "-" + parts[3];
        return phone;
    }
    else {
        //invalid phone number
        return phonenum;
    }
}

var Location = function(data) {
	var self = this;
	this.name = data.name;
	this.lat = data.lat;
	this.lng = data.long;
	this.URL = "";
	this.street = "";
	this.city = "";
	this.phone = "";
    
    //visible determines whether to show the places on the map
	this.visible = ko.observable(true);

	var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ this.lat + ',' + this.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.name;
    
    //Using Foursquare API to get info about the places
	$.getJSON(foursquareURL).done(function(data) {
		var results = data.response.venues[0];
		self.URL = results.url;
		if (typeof self.URL === 'undefined'){
			self.URL = "";
		}
		self.street = results.location.formattedAddress[0];
     	self.city = results.location.formattedAddress[1];
      	self.phone = results.contact.phone;
      	if (typeof self.phone === 'undefined'){
			self.phone = "";
		} else {
			self.phone = formatPhone(self.phone);
		}
	}).fail(function() {
		alert("There was an error with the Foursquare API call. Please refresh the page and try again to load Foursquare data.");
	});

    
	//Making the marker
	this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(data.lat, data.long),
			map: map,
			title: data.name
	});
    
    //Making the info window
	infoWindow = new google.maps.InfoWindow();
    
    //Show the place if it is visible
	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

	

    this.showinfo = function(){
    	
    	//close previous info window
    	infoWindow.close()
    	//Get the info about the places
		var contentString = '<div class="info-window-content"><div class="title"><b>' + data.name + "</b></div>" +
        '<div class="content"><a href="' + self.URL +'">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content"><a href="tel:' + self.phone +'">' + self.phone +"</a></div></div>";

        infoWindow.setContent(contentString);

		infoWindow.open(map, this);

		self.marker.setAnimation(google.maps.Animation.BOUNCE);
      	//Stop the animation
      	setTimeout(function() {
      		self.marker.setAnimation(null);
     	}, 2100);

    };

	this.marker.addListener('click', self.showinfo);
    
    //Click the restaurant on the table
	this.bounce = function() {
		google.maps.event.trigger(self.marker, 'click');
	};

	
};

function AppViewModel() {
	var self = this;

	this.searchTerm = ko.observable("");

	this.locationList = ko.observableArray([]);

	map = new google.maps.Map(document.getElementById('map'), {
			zoom: 15,
			center: {lat: 18.3294334, lng:82.8579654 }

	});
	var bounds = new google.maps.LatLngBounds();
	for (var i = 0; i < initialLocations.length; i++){

        bounds.extend(new google.maps.LatLng(initialLocations[i].lat,initialLocations[i].long));
	}
	
	map.fitBounds(bounds);

	// Foursquare API settings
	clientID = "VNT5UMPMT53WGW2FJKQ1KXFXNCGV5CFBW2G1N0L1H0LSX2TZ";
	clientSecret = "2R5JETLKFVVGOFBOQI05NDJROUMIELZMU1OGOPD2OILAP5ZY";

    // Make "Location" object
	initialLocations.forEach(function(locationItem){
		self.locationList.push( new Location(locationItem));
	});
    //Determine the visible restaurants after searching
	this.filteredList = ko.computed( function() {
		var filter = self.searchTerm().toLowerCase();
		if (!filter) {
			self.locationList().forEach(function(locationItem){
				locationItem.visible(true);
			});
			return self.locationList();
		} else {
			return ko.utils.arrayFilter(self.locationList(), function(locationItem) {
				var string = locationItem.name.toLowerCase();
				var output = (string.search(filter) >= 0);
				locationItem.visible(output);
				return output;
			});
		}
	}, this);

	this.mapElem = document.getElementById('map');
	this.mapElem.style.height = window.innerHeight - 50;
    //responsive design
	this.clickBrand = (function(){
	  // If menu is already showing, slide it up. Otherwise, slide it down.
	  $('.list').toggleClass('sliding');
	  //If the "brand" is clicked, change the background color
	  $('.brand').toggleClass('clicking');

	});


}

function startApp() {
	ko.applyBindings(new AppViewModel());
}

function errorHandling() {
	alert(" Please check your internet connection and try again. Google Maps has failed to load.");
}
