//###############################################################//

const covidByCountry = "https://api.thevirustracker.com/free-api?countryTotals=ALL";

const geoCountry = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

const flagCountry = "https://www.gstatic.com/onebox/sports/logos/flags/{country}_icon_square.png"

//###############################################################//
//Find the Covid Data of country
const  findCountryCovid = (feature,covidData) => {

  if (feature.id == "ARE")
  {
    feature.id = "UAE";
  }
  if (feature.id == "SYR"){
    feature.id = "Syrian Arab Republic";
  }
  return covidData.find(item=> {
    if (item.title)
              
       return  feature.properties.name.toLowerCase().includes(item.title.toLowerCase()) || item.title == feature.id;
    else
      return false;
    }
  );
}

//Find the country flag
const countrFlag = (countryName) =>
{
 
  let country = (countryName=='USA') || (countryName=='United States of America') ? 'united_states'
                :(countryName=='Democratic Republic of the Congo')?'democratic_republic_congo_brazzaville'
                :(countryName=='United Republic of Tanzania')?'tanzania'
                :countryName.toLowerCase().replace(/ /gi,'_');

  return flagCountry.replace("{country}",country);
}

//format information when the mouse over the country
const formatTooltip = (countryName, countryCovid) =>{
  
  if (countryCovid){
    return `<h4><img src="${countrFlag(countryName)}" width="16"> ${countryName}</h4><hr/>
    cases: ${countryCovid.total_cases.toLocaleString()}<br>
    recovered: ${countryCovid.total_recovered.toLocaleString()}<br>
    unresolved: ${countryCovid.total_unresolved.toLocaleString()}<br>
    deaths: ${countryCovid.total_deaths.toLocaleString()}<br>
    new cases today: ${countryCovid.total_new_cases_today.toLocaleString()}<br>
    new deaths today: ${countryCovid.total_new_deaths_today.toLocaleString()}<br>
    active cases: ${countryCovid.total_active_cases.toLocaleString()}<br>
    serious cases: ${countryCovid.total_serious_cases.toLocaleString()}`;
  }

  return `<h2>${countryName}</h2><hr/>Covid-19<h4>-404 (NOT FOUND)-<h4>`;
}

// Create a popup report when the application load
const summaryTop10 = (countryCovid) => {
  let top10 = countryCovid.sort( (a,b) => b.total_cases - a.total_cases ).slice(0,10);
  let div = L.DomUtil.create("div", "popup");
  div.innerHTML +=`<h2>Top 10 Country Cases</h2>`;
  div.innerHTML +=`<div><ul><li>Country</li><li>Confirmed</li><li>Deaths<ul></div>`;
  top10.forEach(item => {
    div.innerHTML += 
    `<div>
      <ul>
      <li><img src="${countrFlag(item.title)}" width="16"><b>${item.title}</b></li>
      <li>${item.total_cases.toLocaleString()}</li>
      <li>${item.total_deaths.toLocaleString()}</li>
      <ul>
    </div>`;
  });
  return div.outerHTML;
}

// Color codes
const colorCode = (total_cases) =>{
  let number = total_cases;
  if (number > 100000){
    return "#510000";
  }
  else if (number > 10000)
  {
    return "#900000";
  }
  else if (number > 1000)
  {
    return "#c80200";
  }
  else if (number > 100)
  {
    return "#ee7070";
  }
  else if (number > 10)
  {
    return "#ffC0C0";
  }
  else if (number > 1)
  {
    return "#ffdfe0";
  }
  else
  {
    return "#eeeeee";
  }
}
//###############################################################//
// Create the map object with a center and zoom level.
//[latitude, longtitude] level of “4” on a scale 0–18
//Center of United States
let map = L.map('map').setView([0, 0], 2);

//Create legend title
let legendTitle = L.control({
  position: "topright"
})
legendTitle.onAdd= () =>{
  let div = L.DomUtil.create("div", "info legend title");
  div.innerHTML= `<H1>COVID-19 Daily Map</H1>${(new Date()).toDateString()}`;
  return div;
};
//Add legend to map
legendTitle.addTo(map);

//Create legend colors
let legend = L.control({
  position: "bottomright"
})
legend.onAdd = function() {
  let div = L.DomUtil.create("div", "info legend");
  const cases = [0, 1, 10, 100, 1000, 10000,100000];
  // Looping through our intervals to generate a label with a colored square for each interval.
  div.innerHTML += "<div>Total confirmed cases</div>"
  for (var i = 0; i < cases.length; i++) {
    div.innerHTML +=
    '<i style="background:' + colorCode(cases[i]) + '"></i> ' +
    cases[i] + (cases[i + 1] ? '&ndash;' + cases[i + 1] + '<br>' : '+') ;
 }
  return div;
};

//Add legend to map
legend.addTo(map);

//Street base Map
let streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a> and <a href="https://thevirustracker.com">the virus tracker</a>',
	maxZoom: 18
});

// add streets tile to map
streets.addTo(map);

//###############################################################//
//Call API data

//fetch covid data
fetch(covidByCountry).then((response) => response.json()).then( (covidDataObject) => {
  //remove the Korean.
  //North Korean and South Korean are already in the set
  covidData = Object.values(covidDataObject.countryitems[0]).filter(item => item.ourid != 84);

  //fetch the geojson map. For performace, we can use a static file.
  //fetch(geoCountry).then((response) => response.json()).then( (countryDataObject) => {
  
    //load geojson object in the map (static object to improve the performance)
    L.geoJson(countryDataObject,{
      style :function(feature){
          //color code for each country based on the total cases    
          let countryCovid = findCountryCovid(feature,covidData);
          return {
              color: colorCode(countryCovid?countryCovid.total_cases:0),
              fillOpacity: 0.8
          };
      }
    })
    //Hover tooptip event
    .bindTooltip(function(layer){
      countryCovid = findCountryCovid(layer.feature,covidData);
      return formatTooltip(layer.feature.properties.name,countryCovid);
    })
    .addTo(map);
    //Add Top 10 Country Cases 
    L.popup({
      minWidth: 320,
      maxWidth: 320
    })
    .setLatLng([0,0])
    .setContent(summaryTop10(covidData))
    .openOn(map);

  //});

});