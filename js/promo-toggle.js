(function () {
  'use strict';
  var promo = document.getElementById('nowtube-logged-out-promo');
  var ad = document.getElementById('nowtube-ad-slot');
  if (!promo || !ad) return;
  fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('Could not check login state');
      return response.json();
    })
    .then(function (data) {
      var loggedIn = !!(data && data.user);
      promo.style.display = loggedIn ? 'none' : '';
      ad.style.display = loggedIn ? 'block' : 'none';
    })
    .catch(function () {
      // If login state cannot be verified, keep the safe logged-out promo.
      promo.style.display = '';
      ad.style.display = 'none';
    });
})();
