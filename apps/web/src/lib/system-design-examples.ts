/**
 * System design starters.
 *
 * Each entry is a well-known system plus one extra feature that is not in the
 * original. The twist is the point: cloning Bitly is a solved problem with a
 * known answer, so it teaches you nothing about deciding. Adding link health
 * monitoring forces a real choice - polling versus event-driven, where the
 * check state lives, what happens at a hundred million links - and that choice
 * is what the architecture session is for.
 *
 * Every twist below was picked because it changes the shape of the system, not
 * because it sounds impressive. `tension` names the specific decision it
 * provokes, and is what the UI shows to explain why the starter is worth doing.
 *
 * Used by the architecture page (requirements + constraints) and the generate
 * form (brief).
 */

export interface SystemDesignExample {
  /** Stable slug - used as a React key and in URLs. */
  id: string;
  /** The recognisable system being cloned. */
  name: string;
  /** One line on what the original does. */
  premise: string;
  /** The extra feature. This is what makes the exercise non-standard. */
  twist: string;
  /** The architectural decision the twist forces. Shown as the "why". */
  tension: string;
  category: SystemDesignCategory;
  /** Longer prose for the generate flow, which takes a single description. */
  brief: string;
  /** What the system must do - the architecture session's requirements field. */
  requirements: string;
  /** Budget, team and timeline - the architecture session's constraints field. */
  constraints: string;
}

export type SystemDesignCategory =
  | "Infrastructure"
  | "Storage & Collaboration"
  | "Feeds & Ranking"
  | "Realtime"
  | "Geo & Logistics"
  | "Search & Discovery"
  | "Commerce & Trust"
  | "Media & AI";

export const SYSTEM_DESIGN_CATEGORIES: SystemDesignCategory[] = [
  "Infrastructure",
  "Storage & Collaboration",
  "Feeds & Ranking",
  "Realtime",
  "Geo & Logistics",
  "Search & Discovery",
  "Commerce & Trust",
  "Media & AI",
];

const SMALL_TEAM = "Team: 3 engineers. Timeline: 12 weeks to a working system. Budget: under $1,000/month in infrastructure until launch.";
const LEAN_TEAM = "Team: 2 engineers. Timeline: 8 weeks. Budget: under $500/month; prefer managed services over anything self-hosted.";
const SCALE_TEAM = "Team: 5 engineers. Timeline: 16 weeks. Budget: under $5,000/month at launch scale, and the design must not require a rewrite to reach 10x that.";

export const SYSTEM_DESIGN_EXAMPLES: SystemDesignExample[] = [
  {
    id: "bitly-link-health",
    name: "Bitly",
    premise: "Shorten a long URL to a compact code and redirect on lookup.",
    twist: "Link health monitoring - detect when a destination starts 404ing, redirecting elsewhere, or serving different content, and alert the link owner.",
    tension: "Redirects are read-heavy and cache-friendly; health checks are write-heavy and must run against every destination on a schedule. Those two workloads want opposite storage.",
    category: "Infrastructure",
    brief:
      "A URL shortener that also watches the links it creates. Users shorten a URL and get a compact code that redirects on lookup, with per-link click analytics. On top of that, the service periodically re-checks each destination and notifies the owner when a link breaks - the target starts returning 404 or 5xx, redirects somewhere it did not before, or changes content signature. Owners see link health in a dashboard and can set an automatic fallback destination for dead links.",
    requirements:
      "Shorten arbitrary URLs to unique short codes and redirect with minimal latency. Serve redirects at very high read volume with a heavy long tail. Record click counts per link. Periodically re-check every destination for availability, redirect changes, and content drift, and notify owners when health changes. Let owners set a fallback destination that is served automatically once a link is confirmed dead.",
    constraints: SMALL_TEAM,
  },
  {
    id: "dropbox-conflict-preview",
    name: "Dropbox",
    premise: "Sync a folder of files across a user's devices.",
    twist: "Conflict preview - when two devices edited the same file offline, show a readable diff and let the user choose, instead of silently writing a \"conflicted copy\".",
    tension: "Showing a diff means the server must understand file contents it was designed to treat as opaque encrypted blocks. Where does the diff get computed, and what does that cost in privacy?",
    category: "Storage & Collaboration",
    brief:
      "A file sync service that handles conflicts honestly. Users install a client that keeps a local folder in sync across devices, uploading only changed blocks rather than whole files. When the same file is edited on two devices while offline, the service does not silently create a 'conflicted copy' - it detects the divergence, produces a human-readable preview of what differs, and asks the user which version to keep or lets them merge. Sync must remain correct when a device is offline for weeks.",
    requirements:
      "Sync a local folder across many devices per user. Upload only changed portions of files rather than whole files. Detect divergent edits made while devices were offline and present a readable comparison of the versions. Let the user resolve a conflict by choosing a side or merging, and propagate that resolution to every device. Preserve file history so a resolution can be undone.",
    constraints: SCALE_TEAM,
  },
  {
    id: "local-delivery-rebatching",
    name: "Local Delivery Service",
    premise: "Dispatch couriers to pick up and deliver local orders.",
    twist: "Live re-batching - when a new order arrives mid-route, reconsider the assignment of couriers already driving, and only reroute when the gain outweighs the disruption.",
    tension: "Re-optimising continuously gives better routes but makes courier instructions unstable. The system needs a rule for when a better plan is worth changing a plan already in motion.",
    category: "Geo & Logistics",
    brief:
      "A local delivery dispatch system that keeps optimising after dispatch. Merchants submit orders with pickup and dropoff points and time windows. The system assigns couriers and builds multi-stop routes. Unlike a fixed assignment, it re-evaluates when new orders arrive: a courier already en route may be given an extra pickup, or an order may be reassigned, but only when the improvement is large enough to justify changing instructions someone is currently following. Couriers and customers see live ETAs that reflect the current plan.",
    requirements:
      "Accept orders with pickup and dropoff locations and delivery windows. Track courier positions in real time. Assign orders to couriers and sequence multi-stop routes. Re-evaluate assignments as new orders arrive, reassigning or inserting stops only when the benefit exceeds a disruption threshold. Publish live ETAs to merchants, couriers and customers, and keep them consistent when a route changes.",
    constraints: SMALL_TEAM,
  },
  {
    id: "ticketmaster-fair-queue",
    name: "Ticketmaster",
    premise: "Sell a fixed inventory of seats for high-demand events.",
    twist: "A transparent waiting room - every waiting user sees their real position and an honest estimate of whether tickets will still exist when they reach the front.",
    tension: "Telling people the truth requires knowing remaining inventory and queue drain rate in real time, while the queue exists precisely because you cannot let everyone touch inventory at once.",
    category: "Commerce & Trust",
    brief:
      "A ticketing system for events where demand vastly exceeds supply. Inventory is a fixed set of seats and must never be oversold. When an on-sale opens, users enter a waiting room rather than hitting inventory directly. The waiting room is honest: each user sees their actual position, the rate the queue is draining, and a realistic estimate of whether tickets in their price tier will remain by the time they get in. Bot traffic is detected and excluded from the queue rather than silently served.",
    requirements:
      "Hold a fixed seat inventory per event and never oversell it. Admit users to purchase in a controlled order under extreme burst load. Show each waiting user their true queue position and a live estimate of remaining availability in their tier. Hold seats briefly during checkout and release them on abandonment. Identify and exclude automated traffic without adding latency for legitimate users.",
    constraints: SCALE_TEAM,
  },
  {
    id: "news-feed-provenance",
    name: "Facebook News Feed",
    premise: "Rank a personalised feed of posts from a user's network.",
    twist: "Provenance on every item - a plain-language reason it was ranked where it was, plus per-source volume controls the ranking must actually obey.",
    tension: "Explanations must come from the ranking that ran, not a plausible story generated after the fact. That means carrying feature attributions through the serving path at feed scale.",
    category: "Feeds & Ranking",
    brief:
      "A personalised feed that can explain itself. Users see posts from people and pages they follow, ranked by predicted relevance rather than pure recency. Every item carries a short, truthful explanation of why it ranked where it did - which signals mattered most for this user and this post. Users can turn the volume of any source up or down, and the ranking honours that as a real input rather than a cosmetic filter. Feed generation must stay fast for users following thousands of sources.",
    requirements:
      "Generate a ranked feed per user from the sources they follow. Rank by predicted engagement rather than recency alone. Attach to each item a truthful explanation derived from the ranking that actually ran. Let users adjust per-source volume and have ranking respect it. Keep feed latency low for users with very large follow graphs, and keep the feed fresh as new posts arrive.",
    constraints: SCALE_TEAM,
  },
  {
    id: "tinder-reciprocity",
    name: "Tinder",
    premise: "Show users a stream of candidate profiles to accept or reject.",
    twist: "Reciprocity-aware ranking - optimise for likely mutual interest rather than one-sided appeal, so both sides get matches rather than a few profiles absorbing all attention.",
    tension: "Predicting mutual interest needs both sides' models at recommendation time, and the popular-profile feedback loop actively fights the objective you want.",
    category: "Feeds & Ranking",
    brief:
      "A matching app that optimises for matches, not swipes. Users are shown candidate profiles and accept or reject each one; a mutual accept creates a match and opens a conversation. Rather than ranking purely by how attractive a profile is to the viewer, the system estimates the probability of mutual interest and ranks by that, which spreads attention more evenly and produces more matches overall. It must avoid the failure mode where a small number of profiles absorb most of the inbound interest.",
    requirements:
      "Serve each user a stream of candidate profiles filtered by their stated preferences and location. Record accept and reject decisions and detect mutual accepts. Rank candidates by estimated probability of mutual interest, using signals from both sides. Prevent a small set of profiles from absorbing a disproportionate share of impressions. Keep candidate generation fast for a large active user base.",
    constraints: SMALL_TEAM,
  },
  {
    id: "leetcode-failure-clustering",
    name: "LeetCode",
    premise: "Run user-submitted code against test cases in a sandbox and report results.",
    twist: "Failure-mode clustering - group a user's wrong submissions across all problems by root cause, so they see the mistake they keep making rather than 31 unrelated failures.",
    tension: "Clustering needs failure signatures extracted from untrusted code and its output, computed asynchronously without slowing the submit path users judge you on.",
    category: "Search & Discovery",
    brief:
      "A coding practice platform that tells you what you keep getting wrong. Users submit solutions in several languages; each runs in an isolated sandbox against a hidden test suite with time and memory limits, and results come back quickly. Beyond pass/fail, the platform analyses failed submissions and clusters them by root cause across every problem the user has attempted - off-by-one errors, unhandled empty input, mutation of a shared structure - so the user sees recurring weaknesses instead of isolated failures.",
    requirements:
      "Execute untrusted user code in an isolated sandbox with strict CPU, memory and wall-clock limits. Run submissions against hidden test suites and return verdicts quickly under bursty load. Extract a failure signature from each failed submission. Cluster a user's failures by root cause across all problems and surface recurring patterns. Keep the submit-to-verdict path fast while analysis happens out of band.",
    constraints: SMALL_TEAM,
  },
  {
    id: "whatsapp-encrypted-search",
    name: "WhatsApp",
    premise: "Deliver end-to-end encrypted messages between users and groups.",
    twist: "Search across full message history on every one of a user's devices, without the server ever being able to read messages or the index.",
    tension: "The server cannot index what it cannot read, so the index must be built on-device and synced encrypted - which turns search into a distributed state problem across devices.",
    category: "Realtime",
    brief:
      "A messaging app with end-to-end encryption and working search. Messages between individuals and groups are encrypted such that the server cannot read them, with delivery and read receipts, offline queueing, and multi-device support. The addition is search: a user can search their entire message history from any of their devices. Because the server cannot read messages, the search index is built on-device and synchronised between the user's devices in encrypted form, staying consistent as messages arrive on whichever device is online.",
    requirements:
      "Deliver messages between individuals and groups with end-to-end encryption the server cannot break. Support multiple devices per user with consistent history. Queue messages for offline recipients and deliver on reconnect. Provide delivery and read receipts. Build a searchable index of message history on-device and synchronise it across the user's devices without exposing plaintext or index contents to the server.",
    constraints: SCALE_TEAM,
  },
  {
    id: "rate-limiter-borrowed-quota",
    name: "Rate Limiter",
    premise: "Enforce request quotas per API key across a distributed fleet.",
    twist: "Quota borrowing - a tenant's idle keys lend unused capacity to their busy keys, within a tenant-wide ceiling, so bursts succeed without raising anyone's limit.",
    tension: "Per-key counters can live locally and converge lazily; a shared tenant pool needs agreement between nodes on every decision. Borrowing turns a local check into a distributed one.",
    category: "Infrastructure",
    brief:
      "A distributed rate limiter that handles bursts gracefully. Every API request is checked against the caller's quota and either allowed or rejected with a clear retry hint, and the check must add almost no latency across a large fleet of stateless nodes. The addition is quota borrowing: keys belonging to the same tenant share a pool, so a key that is idle lends capacity to one that is bursting, bounded by a tenant-wide ceiling. Limits stay predictable and no tenant can starve another.",
    requirements:
      "Check every request against the caller's quota and allow or reject it, adding minimal latency. Enforce limits consistently across many stateless nodes without a single bottleneck. Let keys within a tenant borrow unused quota from one another up to a tenant-wide ceiling. Return accurate retry-after information. Degrade safely when the coordination layer is slow or partially unavailable.",
    constraints: LEAN_TEAM,
  },
  {
    id: "youtube-auto-chapters",
    name: "YouTube",
    premise: "Ingest, transcode and stream video at scale.",
    twist: "Engagement-derived chapters - aggregate where viewers seek, rewatch and drop off, and turn those patterns into chapter markers automatically.",
    tension: "Chapters depend on aggregated playback telemetry, so the pipeline that serves video must also feed an analytics path whose output loops back into the watch page.",
    category: "Media & AI",
    brief:
      "A video platform that learns structure from how people watch. Creators upload video, which is transcoded into multiple resolutions and served adaptively so playback holds up on poor connections. The addition is automatic chapters: the platform aggregates viewer behaviour - where people seek to, which segments get rewatched, where they abandon - and derives chapter markers from those patterns, shown on the scrubber and used to let viewers jump to the part they want. Creators can edit the generated chapters.",
    requirements:
      "Accept large video uploads reliably including resumption after interruption. Transcode into multiple resolutions and formats. Stream adaptively based on client bandwidth. Collect playback telemetry including seeks, rewatches and drop-off points. Derive chapter markers from aggregated viewing patterns and display them on the player. Let creators review and edit generated chapters.",
    constraints: SCALE_TEAM,
  },
  {
    id: "live-comments-appeal",
    name: "Facebook Live Comments",
    premise: "Broadcast a high-volume comment stream to many concurrent viewers.",
    twist: "Moderation with an appeal path - held comments get a fast human or model review and can be released into the stream while the broadcast is still live.",
    tension: "Moderation adds a decision step to a path whose whole value is being instant, and a released comment must rejoin a stream that has already moved on.",
    category: "Realtime",
    brief:
      "A live comment system for broadcasts with large concurrent audiences. Viewers post comments and see others' comments appear with minimal delay; the system must cope with sudden spikes when something notable happens on stream. Comments pass through spam and toxicity checks before broadcast, but rather than silently dropping held comments, authors are told their comment is under review, and a fast review path can release it into the live stream. Late-released comments are placed so the conversation still reads coherently.",
    requirements:
      "Accept and broadcast comments to very large numbers of concurrent viewers with minimal delay. Handle sudden order-of-magnitude spikes in comment volume. Screen comments for spam and abuse before broadcast. Inform authors when a comment is held and provide a fast review path that can release it. Insert released comments into the live stream so ordering remains readable. Keep late-joining viewers' backfill consistent.",
    constraints: SCALE_TEAM,
  },
  {
    id: "youtube-top-k-velocity",
    name: "YouTube Top K",
    premise: "Compute the top K most-viewed videos over a time window.",
    twist: "Velocity-based trending - rank by rate of change with time decay, so a video climbing fast outranks one with a large but stale total.",
    tension: "Cumulative counters are easy to maintain approximately; a decaying rate needs windowed state per key, and the memory ceiling is what makes the problem hard.",
    category: "Feeds & Ranking",
    brief:
      "A trending service that surfaces what is rising, not what is merely large. It ingests a very high-volume stream of view events and continuously maintains a top-K list over several time windows. Rather than ranking by cumulative views, it ranks by velocity with time decay, so a video gaining views quickly outranks an older video with a bigger total. Results must be queryable with low latency and remain accurate enough to trust, with bounded memory even though the number of distinct videos is enormous.",
    requirements:
      "Ingest a very high-volume stream of view events. Maintain a top-K ranking over multiple time windows simultaneously. Rank by rate of change with time decay rather than cumulative totals. Serve top-K queries with low latency. Bound memory usage despite an extremely large number of distinct items, and state the accuracy trade-off that bound implies. Recover correct state after a node failure.",
    constraints: SCALE_TEAM,
  },
  {
    id: "uber-bounded-detour",
    name: "Uber",
    premise: "Match riders to nearby drivers and track trips in real time.",
    twist: "Shared rides with a guaranteed maximum detour - a rider is only added to a trip if every existing rider's arrival slips by less than a promised bound.",
    tension: "The guarantee must hold at match time and keep holding as traffic changes, so the matcher needs a commitment it can honour rather than a best-effort estimate.",
    category: "Geo & Logistics",
    brief:
      "A ride-hailing system with honest shared rides. Riders request trips, the system matches them to nearby available drivers, and both parties track the trip live. Shared rides let multiple riders share a vehicle, but with a promise: when a new rider is added to an in-progress trip, every existing rider's arrival time may slip by no more than a stated bound. The system only accepts a shared match if it can keep that promise, and it must continue to hold as traffic conditions change mid-trip.",
    requirements:
      "Track driver locations continuously and match riders to nearby drivers quickly. Support shared trips carrying multiple riders. Before adding a rider to an existing trip, verify that no current rider's arrival slips beyond a promised bound, and reject the match otherwise. Maintain live ETAs for all riders as conditions change. Handle driver cancellation and rider no-shows without breaking guarantees made to others.",
    constraints: SCALE_TEAM,
  },
  {
    id: "web-crawler-adaptive-recrawl",
    name: "Web Crawler",
    premise: "Crawl the web, follow links, and store pages for indexing.",
    twist: "Learned recrawl scheduling - track how often each page actually changes and revisit at that cadence, instead of a fixed interval for everything.",
    tension: "Per-page change history is state proportional to the crawl frontier, and the scheduler must respect politeness limits that are per-host, not per-page.",
    category: "Search & Discovery",
    brief:
      "A web crawler that spends its budget where content actually changes. It fetches pages, extracts and follows links, respects robots directives and per-host politeness limits, and stores content for downstream indexing, all while running across many machines without duplicating work. The addition is adaptive scheduling: the crawler records how often each page's content actually changes and revisits accordingly, so news pages are refetched frequently and static pages rarely, keeping the index fresh without wasting the crawl budget.",
    requirements:
      "Fetch pages across many worker machines without duplicating work. Extract links and manage a very large crawl frontier. Respect robots rules and per-host rate limits. Detect and skip near-duplicate content. Record per-page change frequency over time and schedule recrawls from it. Keep the frontier and change history durable across restarts, and prioritise the crawl budget toward pages likely to have changed.",
    constraints: SCALE_TEAM,
  },
  {
    id: "ad-click-correction-ledger",
    name: "Ad Click Aggregator",
    premise: "Count ad clicks and aggregate them for advertiser reporting and billing.",
    twist: "A correction ledger - fraud scoring keeps running after billing, and reversals are recorded as auditable adjustments rather than edits to past numbers.",
    tension: "Reporting wants numbers that never change; fraud detection produces verdicts that arrive late. The ledger is how both can be true at once.",
    category: "Commerce & Trust",
    brief:
      "An ad click pipeline where the money can be corrected without rewriting history. It ingests a very high volume of click events, deduplicates them, and aggregates by advertiser, campaign and time window for near-real-time dashboards and billing. Fraud scoring continues after events are billed, and when clicks are later judged invalid the system records a reversal as a new auditable entry rather than mutating past aggregates. Advertisers can see exactly what was adjusted, when, and why.",
    requirements:
      "Ingest a very high volume of click events with at-least-once delivery and deduplicate them. Aggregate by advertiser, campaign and time window for near-real-time reporting. Score clicks for fraud, including after they have been reported and billed. Record invalidations as auditable adjustment entries rather than modifying historical aggregates. Let advertisers see the adjustment history behind any number. Guarantee that billing totals reconcile with the event log.",
    constraints: SCALE_TEAM,
  },
  {
    id: "post-search-audience-scoped",
    name: "Facebook Post Search",
    premise: "Full-text search across billions of user posts.",
    twist: "Audience-correct results - every result is filtered by the post's privacy setting and the searcher's relationship to the author, evaluated at query time.",
    tension: "Permissions change after indexing, so correctness cannot be baked into the index; but checking each candidate against a social graph at query time is the expensive path.",
    category: "Search & Discovery",
    brief:
      "A search system over user-generated posts that never leaks a post to someone not entitled to see it. Users search across a very large corpus with results ranked by relevance and recency and returned fast. Every post carries a privacy setting - public, friends, custom audience - and results must respect it based on the searcher's current relationship to the author. Because privacy settings and friendships change after indexing, correctness has to be enforced at query time, not assumed from the index.",
    requirements:
      "Index a very large and continuously growing corpus of posts with low indexing lag. Serve ranked full-text queries with low latency. Enforce per-post audience rules against the searcher's current relationship to the author at query time. Reflect changes to privacy settings and friendships without reindexing the corpus. Keep result relevance high while filtering, and avoid returning empty pages after filtering.",
    constraints: SCALE_TEAM,
  },
  {
    id: "yelp-review-credibility",
    name: "Yelp",
    premise: "Find local businesses by location and category, with ratings and reviews.",
    twist: "A visible credibility signal per review, derived from reviewer history and behaviour patterns, shown to users rather than silently reweighting the average.",
    tension: "A visible score invites gaming and appeals, so the signal must be defensible and explainable - which is a stricter bar than a hidden ranking weight.",
    category: "Search & Discovery",
    brief:
      "A local business directory that is honest about which reviews to trust. Users search by location and category, filter by rating, price and open hours, and read reviews. Each review carries a visible credibility signal derived from the reviewer's history and behavioural patterns - burst posting, single-business accounts, coordinated timing. The signal is shown to users and explained rather than being quietly folded into the average, and business owners have a defined route to contest a rating on their listing.",
    requirements:
      "Search businesses by geography and category with filters, ranked by relevance and distance. Store and display reviews and aggregate ratings. Compute a credibility signal per review from reviewer history and behavioural patterns. Display that signal with a plain explanation. Provide a contest process for business owners. Keep search fast for dense urban areas with many nearby matches.",
    constraints: SMALL_TEAM,
  },
  {
    id: "instagram-close-friends-ranking",
    name: "Instagram",
    premise: "Share photos and short videos to followers, with stories that expire.",
    twist: "A searchable personal archive of expired stories, with ranking that understands close-friend tiers rather than treating all followers alike.",
    tension: "Stories are designed as disposable, write-heavy and cheap to expire. Making them permanently searchable for the author inverts that storage assumption.",
    category: "Feeds & Ranking",
    brief:
      "A photo and video sharing app where ephemeral content is still yours. Users post images and short videos to followers and publish stories that disappear from others' view after a day. The addition is a personal archive: the author keeps every expired story, searchable by date, location, people and content, even though it is gone for everyone else. Feed and story ranking also understand close-friend tiers, so the people a user actually cares about surface first rather than whoever posts most.",
    requirements:
      "Store and serve images and video with fast delivery across regions. Generate a ranked follower feed. Publish stories that expire from followers' view after a fixed period. Retain expired stories privately for the author, searchable by date, location, people and content. Support close-friend tiers as an input to ranking. Handle users with very large follower counts without degrading publish latency.",
    constraints: SCALE_TEAM,
  },
  {
    id: "strava-segment-verification",
    name: "Strava",
    premise: "Record GPS activities and rank users on leaderboards for route segments.",
    twist: "Plausibility verification - check each segment effort against physics and sensor consistency, and mark efforts that cannot be genuine.",
    tension: "Verification needs the raw high-resolution track, not the summary, so the storage and processing path has to keep data the leaderboard itself never reads.",
    category: "Geo & Logistics",
    brief:
      "A fitness tracking service whose leaderboards mean something. Users record GPS activities from phones and watches; the service matches each activity against known route segments and ranks efforts on per-segment leaderboards. Because leaderboard position is what people care about, every effort is checked for plausibility - speeds and accelerations against human limits, GPS point consistency, agreement between GPS and any heart rate or power data - and implausible efforts are flagged and excluded, with an explanation the athlete can see and dispute.",
    requirements:
      "Ingest GPS activity tracks from mobile and wearable devices, including large files. Match activities against a library of route segments efficiently. Maintain per-segment leaderboards. Verify each effort against physical plausibility and cross-sensor consistency. Flag and exclude implausible efforts with a visible explanation and a dispute path. Retain raw track data needed for verification while keeping leaderboard queries fast.",
    constraints: SMALL_TEAM,
  },
  {
    id: "distributed-cache-adaptive-ttl",
    name: "Distributed Cache",
    premise: "A sharded in-memory cache in front of a slower backing store.",
    twist: "Per-key adaptive TTL - learn each key's access and mutation pattern and set expiry from it, with explicit protection against stampedes on hot keys.",
    tension: "Per-key statistics are themselves state that must be cheap enough to maintain on the hot path, or the optimisation costs more than the misses it prevents.",
    category: "Infrastructure",
    brief:
      "A distributed cache that tunes itself. Clients get and set keys across a sharded cluster with consistent hashing, and nodes can be added or removed without mass invalidation. Rather than a single global TTL, the cache observes each key's read frequency and rate of change and sets expiry per key, keeping stable hot keys longer and volatile ones briefly. Hot keys are protected from stampedes so that a single expiry does not send a thundering herd to the backing store.",
    requirements:
      "Store and retrieve keys across a sharded cluster with even distribution. Add and remove nodes with minimal redistribution. Derive an expiry per key from observed read frequency and change rate. Prevent stampedes to the backing store when a hot key expires. Keep per-key bookkeeping cheap enough not to dominate the hot path. Provide predictable behaviour under memory pressure and during node failure.",
    constraints: LEAN_TEAM,
  },
  {
    id: "online-auction-anti-sniping",
    name: "Online Auction",
    premise: "Run timed auctions where users bid and the highest bid at close wins.",
    twist: "Anti-sniping auto-extension with provable bid ordering - a late bid extends the auction, and any participant can verify the order bids were accepted in.",
    tension: "A movable close time plus verifiable ordering means bid acceptance needs a total order everyone can check, under a burst that arrives in the final seconds.",
    category: "Commerce & Trust",
    brief:
      "An auction platform where the last second is not the whole game. Users bid on timed listings, seeing current price and bid history live, and the highest bid at close wins. A bid placed near the end automatically extends the close time, so sniping cannot win by timing alone. Bid acceptance order is recorded so any participant can verify that bids were processed in the order claimed. The system must stay correct through the burst of activity that arrives in the closing moments.",
    requirements:
      "Accept bids on timed listings and reject bids below the current price. Broadcast price and bid history to watchers in real time. Extend the close time automatically when a bid arrives near the end. Record an ordering of accepted bids that participants can independently verify. Determine the winner unambiguously at close. Remain correct and available through a heavy burst of bids in the final seconds.",
    constraints: SMALL_TEAM,
  },
  {
    id: "job-scheduler-cost-budget",
    name: "Job Scheduler",
    premise: "Run scheduled and triggered jobs across a worker fleet with retries.",
    twist: "Cost budgets - each team gets a spend ceiling, and the scheduler degrades or defers work to stay inside it rather than running up an unbounded bill.",
    tension: "Enforcing a budget means the scheduler must price work before running it and decide what to drop, turning scheduling into an allocation problem with a hard constraint.",
    category: "Infrastructure",
    brief:
      "A job scheduler that cannot run up a surprise bill. Users define recurring and one-off jobs with dependencies; workers execute them with retries and backoff, and a job that fails repeatedly surfaces clearly rather than retrying forever. Each team has a compute budget, and the scheduler tracks the cost of work it dispatches, deferring or shedding lower-priority jobs as a team approaches its ceiling. Job execution is exactly-once from the user's point of view even when workers die mid-run.",
    requirements:
      "Schedule recurring and one-off jobs, including jobs that depend on other jobs completing. Dispatch to a worker fleet with retries and backoff. Ensure a job is not run twice concurrently and survives worker failure mid-execution. Track the cost of dispatched work per team against a budget. Defer or shed lower-priority work as a team nears its ceiling, and make that visible. Surface persistently failing jobs rather than retrying indefinitely.",
    constraints: SMALL_TEAM,
  },
  {
    id: "news-aggregator-claim-clustering",
    name: "News Aggregator",
    premise: "Collect articles from many publishers and group them by story.",
    twist: "Claim-level clustering - identify the specific factual claims in a story and show which outlets assert, dispute or omit each one.",
    tension: "Grouping by story is a document clustering problem; grouping by claim requires extracting and aligning statements across sources that word them differently.",
    category: "Feeds & Ranking",
    brief:
      "A news aggregator that shows where sources disagree. It ingests articles from many publishers continuously, deduplicates and groups them into stories, and presents a personalised ranked feed. Within a story it goes further: it extracts the individual factual claims being made and shows, per claim, which outlets assert it, which dispute it, and which do not mention it at all. Readers see the shape of the disagreement rather than one outlet's summary.",
    requirements:
      "Continuously ingest articles from many publisher feeds with varying formats. Deduplicate and group articles into stories. Extract individual factual claims from articles and align equivalent claims across differently-worded sources. Show per claim which outlets assert, dispute or omit it. Rank stories per user. Keep ingestion-to-availability lag short for breaking news.",
    constraints: SMALL_TEAM,
  },
  {
    id: "price-tracker-buy-or-wait",
    name: "Price Tracking Service",
    premise: "Watch product prices across retailers and alert on drops.",
    twist: "A buy-or-wait call - forecast the likely near-term price path from history and seasonality, and say whether to buy now, with the confidence behind it.",
    tension: "A recommendation is a promise, so the system needs calibrated confidence and a record of its own past calls, not just a forecast it never grades itself on.",
    category: "Commerce & Trust",
    brief:
      "A price tracker that answers the actual question. Users track products across retailers; the service polls prices, records history, and alerts when a price drops below a threshold. Instead of stopping at the alert, it forecasts the likely near-term price path from the product's own history and seasonal patterns and tells the user whether to buy now or wait, with a confidence level attached. The service keeps score of its own past recommendations so the stated confidence is grounded in measured accuracy.",
    requirements:
      "Poll product prices across many retailers with differing rate limits and page structures. Store per-product price history. Alert users when thresholds are met, without duplicate or stale alerts. Forecast near-term price direction from history and seasonality. Present a buy-or-wait recommendation with calibrated confidence. Record recommendation outcomes and use measured accuracy to calibrate future confidence.",
    constraints: LEAN_TEAM,
  },
  {
    id: "notification-fatigue-budget",
    name: "Notification System",
    premise: "Deliver notifications to users across push, email and SMS.",
    twist: "A cross-channel attention budget - coalesce and suppress across every channel so a user gets a defensible number of interruptions, not one per channel per event.",
    tension: "Each channel has its own latency and delivery semantics, but the budget is per person, so the decision to send has to be made above the channel layer.",
    category: "Realtime",
    brief:
      "A notification service that respects a person's attention. Product systems request notifications; the service resolves each user's channel preferences and delivers via push, email or SMS with retries and delivery tracking. Above the channels sits a per-user attention budget: related events are coalesced into digests, duplicates across channels are suppressed, and low-priority notifications are deferred or dropped when a user's budget is spent. Urgent notifications bypass the budget under explicit rules.",
    requirements:
      "Accept notification requests from many producing systems. Resolve per-user channel preferences and quiet hours. Deliver via push, email and SMS with retries and delivery status tracking. Enforce a per-user cross-channel budget, coalescing related events and suppressing duplicates. Defer or drop low-priority notifications when the budget is spent. Allow explicitly urgent notifications to bypass the budget, and make that rule auditable.",
    constraints: SMALL_TEAM,
  },
  {
    id: "robinhood-risk-preview",
    name: "Robinhood",
    premise: "Place stock trades and show real-time prices and portfolio value.",
    twist: "A pre-trade risk preview - before submission, show the plausible worst-case outcome of this specific order against the user's actual position.",
    tension: "The preview must be computed and shown inside the moment before submit, using live prices and the user's real position, without slowing the order path.",
    category: "Commerce & Trust",
    brief:
      "A trading app that shows you the downside before you commit. Users see real-time price data, place market and limit orders, and watch portfolio value update live. Before an order is submitted, the app computes and displays a plain-language risk preview for that specific order against the user's current position - the plausible worst-case loss, the effect on concentration, and what happens if the position moves against them. Order handling remains correct and idempotent under retries and connectivity loss.",
    requirements:
      "Stream real-time market data to many concurrent clients. Accept market and limit orders and route them for execution. Maintain accurate positions and portfolio value in real time. Compute a per-order risk preview from live prices and the user's current position before submission. Keep order submission idempotent under retries and network loss. Maintain an auditable record of every order and its state transitions.",
    constraints: SCALE_TEAM,
  },
  {
    id: "google-docs-change-provenance",
    name: "Google Docs",
    premise: "Real-time collaborative document editing with concurrent authors.",
    twist: "Per-paragraph provenance - for any passage, show who wrote it, when, and what it replaced, without reading a full revision log.",
    tension: "Convergence algorithms discard intermediate states by design; keeping attribution means retaining history the merge itself has no use for.",
    category: "Storage & Collaboration",
    brief:
      "A collaborative editor that can account for every sentence. Multiple people edit a document simultaneously, seeing each other's cursors and changes live, with edits converging correctly regardless of arrival order and offline editing reconciling on reconnect. The addition is provenance: select any paragraph and see who wrote it, when, and what it replaced - without scrubbing a revision timeline. Provenance survives cut-and-paste within the document and remains accurate after concurrent edits merge.",
    requirements:
      "Support many simultaneous editors per document with live cursors and changes. Converge concurrent edits correctly regardless of arrival order. Support offline editing with reconciliation on reconnect. Attribute authorship at paragraph granularity, including what prior text was replaced. Preserve attribution through moves and merges. Keep document load fast for long documents with deep edit histories.",
    constraints: SCALE_TEAM,
  },
  {
    id: "payment-self-healing-reconciliation",
    name: "Payment System",
    premise: "Process payments through external providers with idempotency.",
    twist: "Self-healing reconciliation - continuously compare internal ledger state against provider records and automatically resolve the classes of mismatch that are safe to fix.",
    tension: "Automatic correction of money movement needs a provably safe subset, which forces an explicit statement of which mismatches a machine may touch and which a human must.",
    category: "Commerce & Trust",
    brief:
      "A payment system that finds and fixes its own drift. It processes payments through external providers, holding an internal double-entry ledger and handling authorisation, capture, refund and chargeback with idempotent retries against providers that time out ambiguously. On top of that it continuously reconciles the ledger against provider records, classifies each discrepancy, and automatically resolves the classes proven safe to resolve - while escalating everything else to a human with full context.",
    requirements:
      "Process payments through multiple external providers with idempotent operations. Maintain an internal double-entry ledger as the source of truth. Handle authorisation, capture, refund and chargeback flows. Resolve ambiguous provider timeouts without double-charging. Continuously reconcile ledger state against provider records, classify discrepancies, and auto-resolve only the classes that are provably safe. Escalate everything else with enough context to act on, and keep a full audit trail.",
    constraints: SCALE_TEAM,
  },
  {
    id: "metrics-monitoring-baselining",
    name: "Metrics Monitoring",
    premise: "Ingest time-series metrics, store them, and alert on thresholds.",
    twist: "Per-series learned baselines - alert on deviation from each series' own normal pattern, and group related firing alerts into one incident.",
    tension: "A baseline per series is state proportional to cardinality, and correlating alerts needs a dependency model the metrics pipeline does not naturally have.",
    category: "Infrastructure",
    brief:
      "A monitoring system that alerts on what is actually abnormal. It ingests high-cardinality time-series metrics, stores them with downsampling for long retention, and serves fast dashboard queries. Rather than static thresholds, it learns each series' own normal pattern - including daily and weekly seasonality - and alerts on deviation from it. When many related series break at once it groups them into a single incident with a probable common cause, instead of paging on each one.",
    requirements:
      "Ingest high-cardinality time-series metrics at high write volume. Store efficiently with downsampling and retention tiers. Serve dashboard queries over long ranges quickly. Learn a per-series baseline including seasonality and alert on deviation from it. Correlate simultaneously firing alerts into a single incident with a probable common cause. Keep baseline state bounded as cardinality grows, and avoid alerting during known deploys or maintenance.",
    constraints: SCALE_TEAM,
  },
  {
    id: "online-chess-anticheat",
    name: "Online Chess",
    premise: "Real-time matchmaking and gameplay with clocks and ratings.",
    twist: "Server-side cheat detection - analyse move-time distributions and engine correlation across a player's history and act on the pattern, not a single suspicious game.",
    tension: "Detection needs analysis across a player's whole history, which is an offline workload, while enforcement has to reach a live game in progress.",
    category: "Realtime",
    brief:
      "A chess platform where the rating means something. Players are matched by rating, play in real time with server-authoritative clocks, and games survive disconnections with correct time accounting. The platform analyses play for engine assistance - move-time distributions, correlation with engine choices at varying depth, accuracy that jumps in critical positions - evaluated across a player's history rather than a single game. Confirmed cases have their results rolled back with the affected opponents' ratings restored.",
    requirements:
      "Match players by rating with short queue times. Run games in real time with server-authoritative clocks and validated moves. Handle disconnection and reconnection with correct time accounting. Analyse play for engine assistance across a player's history, not per game in isolation. Act on confirmed cases, including rolling back affected results and restoring opponents' ratings. Keep live gameplay latency unaffected by analysis.",
    constraints: SMALL_TEAM,
  },
  {
    id: "chatgpt-cost-tiering",
    name: "ChatGPT",
    premise: "Serve streaming LLM conversations with retained context.",
    twist: "Per-conversation cost and latency budgets - route each turn to the cheapest model that can handle it, and escalate only when the cheap one is failing.",
    tension: "Deciding which model a turn needs is itself a judgement, made before you know the answer, and getting it wrong is visible to the user as a bad response.",
    category: "Media & AI",
    brief:
      "A conversational AI service that manages its own spend. Users hold streaming conversations with retained history; responses stream token by token and long conversations stay coherent as context grows beyond the window. Each conversation carries a cost and latency budget: individual turns are routed to the cheapest model likely to handle them well, escalating to a stronger model when quality signals suggest the cheaper one is struggling. Users see what a conversation has cost and can raise or lower its budget.",
    requirements:
      "Stream model responses token by token to many concurrent users. Retain and manage conversation context beyond the model's window without losing coherence. Route each turn to an appropriate model tier based on the turn's difficulty and the conversation's budget. Detect when a cheaper model is underperforming and escalate. Track and display cost per conversation. Handle upstream provider failures and rate limits without dropping a conversation.",
    constraints: SCALE_TEAM,
  },
];

/** Examples grouped by category, in the order categories are declared. */
export function examplesByCategory(): [SystemDesignCategory, SystemDesignExample[]][] {
  return SYSTEM_DESIGN_CATEGORIES.map((category) => [
    category,
    SYSTEM_DESIGN_EXAMPLES.filter((e) => e.category === category),
  ]);
}

/** The description the generate flow submits for an example. */
export function briefForGenerate(example: SystemDesignExample): string {
  return `${example.brief}\n\nThe distinguishing feature is: ${example.twist}`;
}

/**
 * Short name for the twist, for use in a project title.
 *
 * Most twists read "Headline - explanation", so the headline is the part before
 * the dash. Where there is no dash, or the headline is too long to sit in a
 * title, fall back to a truncation.
 */
export function twistHeadline(example: SystemDesignExample): string {
  // Split only on a dash used as punctuation - surrounded by whitespace. A bare
  // `split("-")` cuts at the first hyphen anywhere, so "A cross-channel
  // attention budget" became "A cross" and "Server-side cheat detection"
  // became "Server". Em dash, en dash and hyphen are all accepted because the
  // source text has been normalised between them.
  const head = example.twist.split(/\s[-–-]\s/)[0].trim().replace(/[.,]$/, "");
  if (head.length > 0 && head.length <= 55) return head;
  return `${example.twist.slice(0, 52).trimEnd()}…`;
}

/** Project title for an architecture session started from an example. */
export function titleForSession(example: SystemDesignExample): string {
  return `${example.name} + ${twistHeadline(example)}`;
}

/** Requirements text for an architecture session, twist stated explicitly. */
export function requirementsForSession(example: SystemDesignExample): string {
  return `${example.requirements}\n\nThe feature that is not in the original ${example.name}: ${example.twist}\n\nThe decision this forces: ${example.tension}`;
}
