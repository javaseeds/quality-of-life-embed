/*
____________________________________
/ The embed JS file, using babel and \
\ browserify.                       /
------------------------------------
       \   ^__^
        \  (oo)\_______
           (__)\       )\/\
               ||----w |
               ||     ||
*/

import './css/embed.css';
import getURLParameter from './js/geturlparams';
import fetchData from './js/fetch';
import dataConfig from '../data/config/data.json';
import mapConfig from '../data/config/map.json';
import siteConfig from '../data/config/site.json';
import colors from './js/breaks';
import Vue from 'vue';
import ToC from './components/toc.vue';
import MapGL from './components/map.vue';
import mapStyle from './styles/positron-mecklenburg.json';

// Get URL arguments if passed
//     m   metric number
//     y   year
//     s   selected
//     t   map title
//     pitch    whether map can pitch or not (default false)
//     smaxzoom  sets maximum zoom level when flying to selected neighborhoods
//     tocp set whether TOC position icons appear (default false)

let pitch = true;
if (getURLParameter('pitch') === 'false') {
  pitch = false;
}
let smaxzoom = null;
if (getURLParameter('smaxzoom') !== null) {
  smaxzoom = getURLParameter('smaxzoom');
}
// get random metric if none provided and validate provided
let keys = Object.keys(dataConfig);
let metricId = keys[Math.floor(Math.random() * keys.length)].replace('m', '');
if (getURLParameter('m')) {
  let passedMetric = getURLParameter('m').replace('m', '');
  if (keys.indexOf(`m${passedMetric}`) !== -1) {
    metricId = passedMetric;
  }
}
let year = 2015;
if (getURLParameter('y') !== null) {
  year = getURLParameter('y');
}
let selected = [];
if (getURLParameter('s') !== null) {
  selected = getURLParameter('s').split(',');
}
let mapTitle = null;
if (getURLParameter('t') !== null) {
  mapTitle = getURLParameter('t');
} else if (dataConfig[`m${metricId}`]) {
  mapTitle = dataConfig[`m${metricId}`].title;
}
let tocp = false;
if (getURLParameter('tocp') === 'true') {
  tocp = true;
}

// the shared state between components
let appState = {
  metric: {
    config: null,
    years: [],
    data: null
  },
  colors: colors.breaksGnBu5,
  breaks: null,
  selected: selected,
  year: year,
  metadata: null,
  title: mapTitle,
  highlight: []
};

// for debugging
window.appState = appState;

// parent/iframe communications
window.onmessage = function(e) {
  if (e.data.title) {
    appState.title = e.data.title;
  }
  if (e.data.metric) {
    appState.title = dataConfig[`m${e.data.metric}`].title;
    fetchData(appState, e.data.metric);
    parent.postMessage(
      {
        maptitle: appState.title
      },
      '*'
    );
  }
};
if (window != window.top) {
  parent.postMessage(
    {
      maptitle: mapTitle
    },
    '*'
  );
}

// grab initial data
fetchData(appState, metricId);

// set up vue components
ToC.data = function() {
  return {
    sharedState: appState,
    privateState: {
      metaDesc: null,
      selected: null,
      area: null,
      selectedRaw: null,
      areaRaw: null,
      positionToggle: tocp
    }
  };
};

MapGL.data = function() {
  return {
    sharedState: appState,
    privateState: {
      locate: null,
      mapOptions: {
        container: 'map',
        style: mapStyle,
        attributionControl: false,
        zoom: mapConfig.zoomEmbed,
        center: mapConfig.centerEmbed,
        maxBounds: mapConfig.maxBounds,
        minZoom: mapConfig.minZoom,
        //preserveDrawingBuffer: mapConfig.preserveDrawingBuffer
        preserveDrawingBuffer: true
      },
      pitch: pitch,
      smaxzoom: smaxzoom,
      mapLoaded: false,
      metricId: null,
      geoJSON: null
    }
  };
};

new Vue({
  el: 'sc-toc',
  render: h => h(ToC)
});
new Vue({
  el: 'sc-map',
  render: h => h(MapGL)
});

// attribution link
if (document.querySelector('.attribution a')) {
  document.querySelector('.attribution a').href = `${
    siteConfig.qoldashboardURL
  }?m=m${metricId}&n=${selected.join(',')}`;
}