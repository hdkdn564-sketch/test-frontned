# GTM loading + application product events

GTM-MSH67X96 remains the sole loader for TikTok. The application waits for GTM
 to register catalog pixel DB4IAG3C77U4O1M3UD7G, then sends ViewContent and
AddToCart using that pixel instance. It does not load another SDK, broadcast to
the other two pixels, or push duplicate ecommerce events to dataLayer.

The public GTM resource version 4 inspected on 2026-10-14 contains three base
pixel tags and no explicit product event tags. Keep the existing target base tag.
Do not add GTM ViewContent/AddToCart tags for the same interactions alongside
this implementation. Earlier instructions to create those tags are superseded.
If such tags have since been added or TikTok visual event rules configured,
review them in the account before release to prevent duplicate events.

Product IDs use MongoDB _id, matching the local catalog feed. Pending events wait
up to 60 seconds for the target pixel, with a maximum queue of 100. Events expire
if GTM stays blocked or unavailable; nothing bypasses GTM to initialize the SDK.
Consent enforcement remains the responsibility of the GTM/pixel configuration.

After deploying, verify a direct product visit, navigation between products,
and cart additions from cards and product pages in TikTok Test Events. Check
one event per interaction, the correct pixel ID, quantity, SAR value, catalog
content_id, and absence of CSP errors. Live receipt has not been verified.

Checkout files and purchase tracking are outside this change.
