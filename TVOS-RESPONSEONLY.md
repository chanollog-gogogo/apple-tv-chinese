# tvOS response-only candidate 0.3.0-dev.6

Development build tested on Apple TV 4K (3rd generation), tvOS 27.0, Shadowrocket 2.2.92. Homepage and Ted Lasso season-three Chinese names/descriptions were visibly verified. VPN process remained alive and no new tunnel crash report was found during this test. This is not a claim of complete catalog coverage or a playback test.

- Removes the dev.5 request handler. Original conditional headers, cookies, account and routing are untouched.
- Keeps strict numeric episode pagination for anonymous Apple regional metadata lookups.
- Original body cap increased from 768 Ki characters to 1280 Ki characters, after measuring a real TV homepage at 937401 characters. Helper cap remains 768 Ki, at most three serial queries. No preference reads/writes.
- Canvas metadata queries use pfm=atv. Names/artwork come from TW/HK; simplified descriptions prefer SG. Original US catalog, rights, asset URLs and subtitle adaptation remain authoritative.
- Uses only uts-api.itunes.apple.com under the existing certificate. Disable all older UI modules, keep the original subtitle module below this module.

Local checks: 950019-character public homepage (249 text and 177 image changes); numeric pagination/private-data isolation; zero preference access; original requests untouched; bounded concurrency/late callbacks; original US assets and rights retained. Local tests are not proof of complete tvOS coverage or playback acceptance.

Install: AppleTV-Chinese-TVOS-ResponseOnly.srmodule

Rollback: disable this candidate, enable dev.4 or retain only the subtitle module; reconnect VPN, force-quit and reopen Apple TV.

## Device findings

The homepage response (936638 characters) completed with 251 text changes, 346 UI changes and 175 image changes. Ted Lasso season-three episode names and descriptions were Chinese and loaded without persistent placeholders. Regional helper requests can fail transiently: the first season-one request retained English text on one attempt. Original content is retained on lookup failure. No external translation service is used. Continue Watching artwork may remain English when anonymous regional lookup has no matching metadata.
