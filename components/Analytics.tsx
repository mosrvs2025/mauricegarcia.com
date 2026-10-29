import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-J4KMZHQTSP";

/** GA4 is skipped entirely for visitors who send Do Not Track or Global Privacy Control. */
export function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <Script id="ga4" strategy="afterInteractive">
        {`(function(){var n=navigator;if(n.doNotTrack==='1'||n.globalPrivacyControl){window['ga-disable-${GA_ID}']=true;return;}
var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(s);
window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};
gtag('js',new Date());gtag('config','${GA_ID}');})();`}
      </Script>
    </>
  );
}
