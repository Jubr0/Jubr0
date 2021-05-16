const website = new Website();

$(window).resize(function() {
  website.resize();
});

$(document).ready(function() {
  website.setupMainSite();
  website.setupParticles();
  website.setupLibrariesAndEventsListeners();
});
