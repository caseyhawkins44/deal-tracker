"use client"

// The full extraction logic is embedded directly in the bookmarklet href.
// We cannot use the tiny-loader (inject <script src="...">) pattern because
// Zillow's Content Security Policy blocks external script loading silently.
// All logic must be self-contained in the javascript: URL.
// APP is injected at render time from window.location.origin so it always
// points to whichever host this page is served from.

export default function BookmarkletInstaller() {
  const origin = typeof window !== "undefined" ? window.location.origin : ""

  const code = `(function(){var APP='${origin}';var tm={SINGLE_FAMILY:'Single Family',CONDO:'Condo',TOWNHOUSE:'Townhouse',MULTI_FAMILY:'Multi Family',APARTMENT:'Multi Family',LOT:'Land',LAND:'Land',MANUFACTURED:'Single Family',MOBILE:'Single Family'};function val(obj){if(!obj||typeof obj!=='object')return null;var addr=obj.address||{};var street=obj.streetAddress||addr.streetAddress||'';var city=obj.city||addr.city||'';if(!street||!city)return null;var price=obj.price||obj.listPrice||0;var facts=obj.resoFacts||{};var annualTax=facts.taxAnnualAmount||(obj.propertyTaxRate&&price?(obj.propertyTaxRate/100)*price:0);return{name:street+', '+city,address:street,city:city,state:obj.state||addr.state||'',zipCode:obj.zipcode||obj.zip||addr.zipcode||'',propertyType:tm[obj.homeType]||'Single Family',purchasePrice:price,monthlyRent:obj.rentZestimate||0,hoaFees:obj.monthlyHoaFee||facts.hoaFee||0,propertyTax:Math.round(annualTax),zillowUrl:window.location.href};}function dig(obj,depth){if(!obj||typeof obj!=='object'||depth>8)return null;var r=val(obj);if(r)return r;var keys=Object.keys(obj);for(var i=0;i<keys.length;i++){try{var f=dig(obj[keys[i]],depth+1);if(f)return f;}catch(e){}}return null;}function fromRegex(str){function re(k){var m=str.match(new RegExp('"'+k+'":\\s*"([^"]+)"'));return m?m[1]:'';}function reN(k){var m=str.match(new RegExp('"'+k+'":\\s*([0-9.]+)'));return m?parseFloat(m[1]):0;}var street=re('streetAddress'),city=re('city');if(!street||!city)return null;var price=reN('price')||reN('listPrice');var annualTax=reN('taxAnnualAmount')||(reN('propertyTaxRate')/100*price);return{name:street+', '+city,address:street,city:city,state:re('state'),zipCode:re('zipcode')||re('zip'),propertyType:tm[re('homeType')]||'Single Family',purchasePrice:price,monthlyRent:reN('rentZestimate'),hoaFees:reN('monthlyHoaFee'),propertyTax:Math.round(annualTax),zillowUrl:window.location.href};}function fromDOM(){var parts=document.title.split('|')[0].trim().split(',');var street=(parts[0]||'').trim();var city=(parts[1]||'').trim();var sv=((parts[2]||'').trim()).split(' ');var priceEl=document.querySelector('[data-testid="price"]')||document.querySelector('[class*="Price"]');var price=priceEl?parseInt((priceEl.textContent||'').replace(/[^0-9]/g,'')):0;if(!street)return null;return{name:street+(city?', '+city:''),address:street,city:city,state:sv[0]||'',zipCode:sv[1]||'',propertyType:'Single Family',purchasePrice:price,monthlyRent:0,hoaFees:0,propertyTax:0};}var data=null;try{var nd=document.getElementById('__NEXT_DATA__');if(nd){var raw=nd.textContent||'';var d=JSON.parse(raw);var pp=d&&d.props&&d.props.pageProps;['gdpClientCache','clientCache'].forEach(function(key){if(data)return;var src=(pp&&pp.componentProps&&pp.componentProps[key])||(pp&&pp[key]);if(src){try{var c=JSON.parse(src);var k=Object.keys(c)[0];data=val(c[k]&&c[k].property);}catch(e){}}});if(!data&&pp&&pp.initialData)data=val(pp.initialData.building)||val(pp.initialData.property)||val(pp.initialData);if(!data)data=dig(d,0);if(!data)data=fromRegex(raw);}}catch(e){}if(!data)data=fromDOM();if(!data||(!data.purchasePrice&&!data.address)){alert('Could not find listing data. Make sure you are on a Zillow property detail page, not search results.');return;}alert('Found: '+data.name+' \u2014 $'+data.purchasePrice.toLocaleString()+'\\nClick OK to open Deal Tracker.');window.location.href=APP+'/deals/new?z='+btoa(unescape(encodeURIComponent(JSON.stringify(data))));})()`

  const BOOKMARKLET_CODE = `javascript:${code}`

  return (
    <div className="space-y-6">
      {/* The draggable bookmarklet */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">
          Step 1 — Drag this button to your bookmarks bar:
        </p>
        <div className="flex items-center gap-4">
          {/* dangerouslySetInnerHTML is required here — React blocks javascript: hrefs as a
              security policy, but bookmarklets need exactly that. This is safe because
              BOOKMARKLET_CODE is built from a hardcoded constant and window.location.origin,
              not user input. */}
          <span
            dangerouslySetInnerHTML={{
              __html: `<a
                href="${BOOKMARKLET_CODE.replace(/"/g, "&quot;")}"
                draggable="true"
                style="display:inline-flex;align-items:center;gap:8px;background:#2563eb;color:#fff;padding:10px 20px;border-radius:12px;font-weight:500;font-size:14px;cursor:grab;text-decoration:none;user-select:none;box-shadow:0 1px 2px rgba(0,0,0,.1)"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Add to Deal Tracker
              </a>`,
            }}
          />
          <p className="text-sm text-gray-400">← drag this to your bookmarks bar</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Step 2 — How to use it:</p>
        <ol className="space-y-3">
          {[
            "Go to any Zillow property listing page in your browser",
            'Click "Add to Deal Tracker" in your bookmarks bar',
            "Deal Tracker opens pre-filled with the property details",
            "Review the numbers, fill in the remaining fields (down payment, rate, etc.), and save",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* What gets imported */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-medium text-gray-700 mb-3">What gets imported automatically:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          {[
            "Property address",
            "City, state, ZIP",
            "Listing price",
            "Property type",
            "HOA fees",
            "Property tax (monthly)",
            "Rent Zestimate",
            "Deal name",
          ].map(item => (
            <div key={item} className="flex items-center gap-2">
              <svg className="text-green-500 flex-shrink-0" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          You&apos;ll still need to enter: down payment %, interest rate, insurance, maintenance, and utilities.
        </p>
      </div>

      {/* Show bookmarks bar tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Bookmarks bar not visible?</strong> In Chrome: View → Show Bookmarks Bar (or Cmd+Shift+B). In Safari: View → Show Favorites Bar.
      </div>
    </div>
  )
}
