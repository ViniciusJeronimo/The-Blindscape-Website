// Remembers how a visitor first arrived (ad click, tagged link, or the site they came
// from) so the enquiry form can tell the CRM where the lead came from.
(function () {
  var KEY = 'tbs_first_touch';
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  var p = new URLSearchParams(location.search);
  var fromAd = p.get('gclid') || p.get('gbraid') || p.get('wbraid') || p.get('fbclid') || p.get('utm_source');
  var ref = document.referrer && document.referrer.indexOf(location.hostname) === -1 ? document.referrer : '';
  var saved = read();
  // A new ad click or tagged link replaces what we had; otherwise keep the first visit.
  if (!saved || fromAd) {
    var touch = {
      utm_source: p.get('utm_source') || '', utm_medium: p.get('utm_medium') || '', utm_campaign: p.get('utm_campaign') || '',
      gclid: p.get('gclid') || p.get('gbraid') || p.get('wbraid') || '', fbclid: p.get('fbclid') || '',
      referrer: ref, landing: location.pathname, at: Date.now()
    };
    try { localStorage.setItem(KEY, JSON.stringify(touch)); } catch (e) {}
    saved = touch;
  }
  window.tbsAttribution = function () {
    var t = read() || saved || {};
    return {
      utm_source: t.utm_source || '', utm_medium: t.utm_medium || '', utm_campaign: t.utm_campaign || '',
      gclid: t.gclid || '', fbclid: t.fbclid || '', referrer: t.referrer || '', landing: t.landing || ''
    };
  };
})();
