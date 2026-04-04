import { NextResponse } from "next/server"

// This JS file is loaded by the bookmarklet on the Zillow page.
// Keeping the logic here means the bookmark itself stays tiny (no encoding issues),
// and we can update the extraction logic without the user needing to re-drag anything.
const script = `
(function(){
  var APP = '${process.env.NEXTAUTH_URL || "http://localhost:3000"}'.replace(/\/$/, '');
  var tm = {SINGLE_FAMILY:'Single Family',CONDO:'Condo',TOWNHOUSE:'Townhouse',MULTI_FAMILY:'Multi Family',APARTMENT:'Multi Family',LOT:'Land',LAND:'Land',MANUFACTURED:'Single Family',MOBILE:'Single Family'};

  function val(obj) {
    if (!obj || typeof obj !== 'object') return null;
    var addr = obj.address || {};
    var street = obj.streetAddress || addr.streetAddress || '';
    var city = obj.city || addr.city || '';
    if (!street || !city) return null;
    var price = obj.price || obj.listPrice || 0;
    var facts = obj.resoFacts || {};
    var annualTax = facts.taxAnnualAmount || (obj.propertyTaxRate && price ? (obj.propertyTaxRate / 100) * price : 0);
    return {
      name: street + ', ' + city,
      address: street, city: city,
      state: obj.state || addr.state || '',
      zipCode: obj.zipcode || obj.zip || addr.zipcode || '',
      propertyType: tm[obj.homeType] || 'Single Family',
      purchasePrice: price,
      monthlyRent: obj.rentZestimate || 0,
      hoaFees: obj.monthlyHoaFee || facts.hoaFee || 0,
      propertyTax: Math.round(annualTax),  // stored as annual
      zillowUrl: window.location.href
    };
  }

  function dig(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 8) return null;
    var r = val(obj);
    if (r) return r;
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      try { var f = dig(obj[keys[i]], depth + 1); if (f) return f; } catch(e) {}
    }
    return null;
  }

  function fromRegex(str) {
    function re(k) { var m = str.match(new RegExp('"' + k + '":\\\\s*"([^"]+)"')); return m ? m[1] : ''; }
    function reN(k) { var m = str.match(new RegExp('"' + k + '":\\\\s*([0-9.]+)')); return m ? parseFloat(m[1]) : 0; }
    var street = re('streetAddress'), city = re('city');
    if (!street || !city) return null;
    var price = reN('price') || reN('listPrice');
    var annualTax = reN('taxAnnualAmount') || (reN('propertyTaxRate') / 100 * price);
    return {
      name: street + ', ' + city, address: street, city: city,
      state: re('state'), zipCode: re('zipcode') || re('zip'),
      propertyType: tm[re('homeType')] || 'Single Family',
      purchasePrice: price, monthlyRent: reN('rentZestimate'),
      hoaFees: reN('monthlyHoaFee'), propertyTax: Math.round(annualTax),
      zillowUrl: window.location.href
    };
  }

  function fromDOM() {
    var parts = document.title.split('|')[0].trim().split(',');
    var street = (parts[0] || '').trim();
    var city = (parts[1] || '').trim();
    var sv = ((parts[2] || '').trim()).split(' ');
    var priceEl = document.querySelector('[data-testid="price"]') || document.querySelector('[class*="Price"]');
    var price = priceEl ? parseInt((priceEl.textContent || '').replace(/[^0-9]/g, '')) : 0;
    if (!street) return null;
    return { name: street + (city ? ', ' + city : ''), address: street, city: city, state: sv[0] || '', zipCode: sv[1] || '', propertyType: 'Single Family', purchasePrice: price, monthlyRent: 0, hoaFees: 0, propertyTax: 0 };
  }

  var data = null;
  try {
    var nd = document.getElementById('__NEXT_DATA__');
    if (nd) {
      var raw = nd.textContent || '';
      var d = JSON.parse(raw);
      var pp = d && d.props && d.props.pageProps;
      // Try known cache paths
      ['gdpClientCache', 'clientCache'].forEach(function(key) {
        if (data) return;
        var src = (pp && pp.componentProps && pp.componentProps[key]) || (pp && pp[key]);
        if (src) { try { var c = JSON.parse(src); var k = Object.keys(c)[0]; data = val(c[k] && c[k].property); } catch(e) {} }
      });
      // initialData
      if (!data && pp && pp.initialData) data = val(pp.initialData.building) || val(pp.initialData.property) || val(pp.initialData);
      // deep search
      if (!data) data = dig(d, 0);
      // regex fallback
      if (!data) data = fromRegex(raw);
    }
  } catch(e) {}

  if (!data) data = fromDOM();

  if (!data || (!data.purchasePrice && !data.address)) {
    alert('Could not find listing data. Make sure you are on a Zillow property detail page, not search results.');
    return;
  }

  alert('Found: ' + data.name + ' — $' + data.purchasePrice.toLocaleString() + '\\nClick OK to open Deal Tracker.');
  window.location.href = APP + '/deals/new?z=' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
})();
`

export async function GET() {
  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
      // Allow Zillow pages to load this script
      "Access-Control-Allow-Origin": "*",
    },
  })
}
