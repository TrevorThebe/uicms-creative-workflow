import { DepartmentId, RequestTypeConfig, RequestTypeField } from '../types';

export const DEPARTMENTS_DATA = [
  {
    id: 'marketing' as DepartmentId,
    name: 'Marketing Department',
    code: 'MKT',
    description: 'Corporate social media campaigns, marketing print collaterals, website updates, brand advertising, and external agency creative assets.',
    active: true,
    iconName: 'Megaphone',
    managerId: 'usr-mkt-mgr',
  },
  {
    id: 'incentive_travel' as DepartmentId,
    name: 'Incentive Travel Department',
    code: 'TRV',
    description: 'Turnkey incentive trip collateral, luxury location show reels, attendee printed document suites, destination websites, and executive travel decks.',
    active: true,
    iconName: 'PlaneTakeoff',
    managerId: 'usr-trv-mgr',
  },
  {
    id: 'online_ram' as DepartmentId,
    name: 'Online (RAM) Department',
    code: 'RAM',
    description: 'Client incentive portal development, digital vouchers, sprint campaigns, birthday automation assets, rewards catalogues, and digital platform updates.',
    active: true,
    iconName: 'MonitorCheck',
    managerId: 'usr-ram-mgr',
  },
  {
    id: 'development' as DepartmentId,
    name: 'Development Department (Future)',
    code: 'DEV',
    description: 'Custom API integrations, frontend/backend feature engineering, database migrations, and web applications infrastructure.',
    active: false,
    iconName: 'Code2',
    managerId: 'usr-admin',
  },
];

export const REQUEST_TYPES_CONFIG: RequestTypeConfig[] = [
  // ================= MARKETING =================
  {
    id: 'mkt-social-instagram',
    departmentId: 'marketing',
    name: 'Instagram Posts',
    description: 'Single image, carousel, or story creative tailored for Instagram audiences with matching captions and CTA links.',
    active: true,
    fields: [
      { id: 'platform', label: 'Platform & Placement', type: 'select', options: ['Instagram Feed (1:1 Square)', 'Instagram Story (9:16 Vertical)', 'Instagram Carousel (Multi-slide 4:5)', 'Instagram Reel Cover'], required: true, section: 'specifications' },
      { id: 'account_handle', label: 'Target Account Handle', type: 'text', placeholder: '@companybrand or client handle', required: true, section: 'branding' },
      { id: 'campaign_name', label: 'Campaign / Topic Objective', type: 'text', placeholder: 'e.g. Q4 Executive Leadership Spotlight', required: true, section: 'content' },
      { id: 'headline', label: 'Post Visual Headline / Hook', type: 'text', placeholder: 'Bold hook text overlaid on visual', required: true, section: 'content' },
      { id: 'caption_copy', label: 'Full Caption & Body Copy', type: 'textarea', placeholder: 'Write out the full post caption, hashtags, and mentions...', required: true, section: 'content' },
      { id: 'cta', label: 'Call To Action (CTA)', type: 'text', placeholder: 'e.g. Link in bio / Swipe up to register / DM for details', required: true, section: 'content' },
      { id: 'dimensions', label: 'Dimensions & Format', type: 'text', placeholder: '1080x1080px (Feed) or 1080x1920px (Story) - JPG/PNG', required: true, section: 'specifications' },
      { id: 'tags_handles', label: 'Mandatory Tags / Partner Handles', type: 'text', placeholder: '#Brand2026 @PartnerHandle #GlobalLeadership', required: false, section: 'content' },
      { id: 'publish_date', label: 'Target Publish / Scheduled Date', type: 'date', required: true, section: 'schedule' },
      { id: 'destination_url', label: 'Bio / Story Link Destination', type: 'url', placeholder: 'https://campaign.client.com/rsvp', required: false, section: 'deliverables' },
    ],
    defaultQaItems: [
      'Correct client logo and safe zone margins applied',
      'Correct corporate typography and weights used',
      'Accurate brand CI hex palette applied',
      'Dimensions match platform requirements (1080x1080 or 1080x1920)',
      'Zero spelling, punctuation or grammatical errors in headline/caption',
      'Hashtags, handles and URLs verified and working',
      'High-resolution imagery without compression artifacts',
      'Exported in required RGB colour profile',
    ],
  },
  {
    id: 'mkt-social-facebook',
    departmentId: 'marketing',
    name: 'Facebook Posts',
    description: 'Static feeds, link previews, or event banners for corporate Facebook pages.',
    active: true,
    fields: [
      { id: 'page_name', label: 'Facebook Page & Group', type: 'text', placeholder: 'Brand Corporate Page', required: true, section: 'branding' },
      { id: 'campaign_name', label: 'Campaign Name', type: 'text', required: true, section: 'content' },
      { id: 'headline', label: 'Headline', type: 'text', required: true, section: 'content' },
      { id: 'caption_copy', label: 'Post Copy & Description', type: 'textarea', required: true, section: 'content' },
      { id: 'cta', label: 'CTA & Action Button', type: 'text', placeholder: 'Learn More / Sign Up', required: true, section: 'content' },
      { id: 'destination_url', label: 'Click-through Link URL', type: 'url', required: true, section: 'deliverables' },
      { id: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '1200 x 630px', required: true, section: 'specifications' },
      { id: 'publish_date', label: 'Publish Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Client logo verified against official vector asset',
      'Brand CI colours matched perfectly',
      'Ad text density rules respected (under 20% overlay)',
      'Spelling and grammatical verification',
      'Destination URL confirmed functional with UTM parameters',
      'High-resolution export 1200x630px PNG/JPG',
    ],
  },
  {
    id: 'mkt-social-linkedin',
    departmentId: 'marketing',
    name: 'LinkedIn Posts',
    description: 'Professional B2B thought leadership banners, carousel slides, and recruitment announcements.',
    active: true,
    fields: [
      { id: 'page_name', label: 'LinkedIn Company Page', type: 'text', placeholder: 'Enterprise Global Page', required: true, section: 'branding' },
      { id: 'post_type', label: 'Post Format', type: 'select', options: ['Single Image (1200x627)', 'Document / PDF Carousel (1080x1080 Multi-page)', 'Event Header Banner (1584x396)'], required: true, section: 'specifications' },
      { id: 'headline', label: 'Article / Post Headline', type: 'text', required: true, section: 'content' },
      { id: 'caption_copy', label: 'Thought Leadership Post Copy', type: 'textarea', required: true, section: 'content' },
      { id: 'cta', label: 'CTA', type: 'text', required: true, section: 'content' },
      { id: 'destination_url', label: 'Link URL', type: 'url', required: true, section: 'deliverables' },
      { id: 'publish_date', label: 'Scheduled Publish Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Corporate CI guidelines and executive font pairing respected',
      'Professional tone of voice and correct executive naming/titles',
      'Correct aspect ratio and crisp rendering on desktop and mobile feeds',
      'Carousel pages sequentially numbered and layout balanced',
      'All links and hashtags validated',
    ],
  },
  {
    id: 'mkt-youtube',
    departmentId: 'marketing',
    name: 'YouTube Designs',
    description: 'High-CTR video thumbnails, channel art headers, and end-screen cards.',
    active: true,
    fields: [
      { id: 'asset_type', label: 'YouTube Asset Type', type: 'select', options: ['Video Thumbnail (1280x720)', 'Channel Banner Art (2560x1440)', 'End Screen Promo Graphic'], required: true, section: 'specifications' },
      { id: 'video_title', label: 'Video Title & Subject', type: 'text', required: true, section: 'content' },
      { id: 'thumbnail_text', label: 'Thumbnail Big Text (3-5 words max)', type: 'text', required: true, section: 'content' },
      { id: 'imagery_requirements', label: 'Presenter Photo / Key Visual Direction', type: 'textarea', required: true, section: 'branding' },
      { id: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '1280x720px (under 2MB)', required: true, section: 'specifications' },
      { id: 'publish_date', label: 'Video Premiere / Upload Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Thumbnail text legible at small mobile preview sizes (high contrast)',
      'Channel banner safe zones (desktop, tablet, TV, mobile) strictly observed',
      'Client branding and logo placed accurately without overlapping timestamps',
      'File size compliant (under 2MB)',
    ],
  },
  {
    id: 'mkt-web-updates',
    departmentId: 'marketing',
    name: 'Internal Website Content Updates',
    description: 'Corporate intranet, corporate landing page revisions, staff directory or product updates.',
    active: true,
    fields: [
      { id: 'website_url', label: 'Website / Portal URL', type: 'url', placeholder: 'https://intranet.company.com', required: true, section: 'branding' },
      { id: 'page_name', label: 'Target Page & Section', type: 'text', placeholder: 'e.g. /about-us/executive-team - Bio 3', required: true, section: 'content' },
      { id: 'current_content', label: 'Current Existing Copy', type: 'textarea', placeholder: 'Paste existing text that needs replacement...', required: true, section: 'content' },
      { id: 'replacement_content', label: 'New Approved Replacement Copy', type: 'textarea', placeholder: 'Paste exact new text verbatim...', required: true, section: 'content' },
      { id: 'images_assets', label: 'Image Asset Specifications', type: 'textarea', placeholder: 'New portrait photo 800x800 webp...', required: true, section: 'specifications' },
      { id: 'links_buttons', label: 'Link / Button URLs to Update', type: 'text', placeholder: 'Update CTA button href to /careers/openings', required: true, section: 'deliverables' },
      { id: 'layout_direction', label: 'UI Layout Direction', type: 'textarea', required: false, section: 'specifications' },
      { id: 'update_date', label: 'Target Go-Live Date', type: 'date', required: true, section: 'schedule' },
      { id: 'approver_name', label: 'Designated Client Sign-Off Authority', type: 'text', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Content strictly matches the approved verbatim copy word-for-word',
      'All image assets optimized, compressed, with correct alt tags',
      'All hyperlinks, mailto links, and anchor tags functional',
      'Responsive view tested across mobile, tablet, and desktop breakpoints',
      'Zero broken layouts, missing CSS classes, or styling inconsistencies',
    ],
  },
  {
    id: 'mkt-banners',
    departmentId: 'marketing',
    name: 'Banners',
    description: 'Digital display ads, Google ads, programmatic banner sets, and event roll-up pull-up banners.',
    active: true,
    fields: [
      { id: 'banner_purpose', label: 'Banner Purpose & Medium', type: 'select', options: ['Digital Display Ad Suite (Multi-size)', 'Pull-Up Roller Banner (850x2000mm)', 'Stage Backdrop Banner', 'Billboard / Outdoor'], required: true, section: 'specifications' },
      { id: 'title', label: 'Main Header Title', type: 'text', required: true, section: 'content' },
      { id: 'subtitle', label: 'Subtitle / Tagline', type: 'text', required: true, section: 'content' },
      { id: 'dates_names', label: 'Event Dates / Speaker Names', type: 'text', required: false, section: 'content' },
      { id: 'cta', label: 'CTA Button Text', type: 'text', required: true, section: 'content' },
      { id: 'redirect_url', label: 'Destination URL', type: 'url', required: false, section: 'deliverables' },
      { id: 'dimensions', label: 'Required Dimensions & Bleed', type: 'text', placeholder: 'e.g. 300x250, 728x90, 160x600 or 850x2000mm + 3mm bleed', required: true, section: 'specifications' },
      { id: 'imagery_reference', label: 'Imagery & Reference Direction', type: 'textarea', required: true, section: 'branding' },
      { id: 'required_deadline', label: 'Required Delivery Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Dimensions verified against digital ad specs or print printer templates',
      'If print: CMYK colour space, 300 DPI, 3mm bleed, crop marks included',
      'If digital: RGB colour space, 72 DPI, file weight within ad network caps',
      'Logo safe zones preserved; contrast compliant with accessibility guidelines',
    ],
  },
  {
    id: 'mkt-business-cards',
    departmentId: 'marketing',
    name: 'Business Cards',
    description: 'Executive and staff bespoke corporate business cards with CI styling, embossing, and print specs.',
    active: true,
    fields: [
      { id: 'full_name', label: 'Full Employee Name & Credentials', type: 'text', placeholder: 'e.g. Eleanor Vance, CA(SA)', required: true, section: 'content' },
      { id: 'position', label: 'Job Title / Position', type: 'text', placeholder: 'Chief Commercial Officer', required: true, section: 'content' },
      { id: 'company_name', label: 'Company / Subsidiary Entity', type: 'text', required: true, section: 'branding' },
      { id: 'telephone', label: 'Direct Telephone / Mobile', type: 'text', placeholder: '+27 (0)11 555 0199', required: true, section: 'content' },
      { id: 'email', label: 'Corporate Email Address', type: 'text', placeholder: 'eleanor.vance@company.com', required: true, section: 'content' },
      { id: 'website', label: 'Website URL', type: 'text', placeholder: 'www.companybrand.com', required: true, section: 'content' },
      { id: 'physical_address', label: 'Physical Office Address', type: 'textarea', placeholder: 'Building 4, Sandton Corporate Precinct...', required: true, section: 'content' },
      { id: 'size_quantity', label: 'Card Size & Print Quantity', type: 'text', placeholder: '85x55mm, 500 units per name', required: true, section: 'specifications' },
      { id: 'print_specification', label: 'Paper Stock & Finish Specifications', type: 'select', options: ['400gsm Silk + Matt Lamination + Spot UV on Logo', '350gsm Textured Uncoated Cotton Board + Foil Deboss', 'Standard 350gsm Gloss Cello', 'Eco Recycled Kraft Board with Black Letterpress'], required: true, section: 'specifications' },
      { id: 'approval_deadline', label: 'Proof Approval Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'All contact details, telephone dialing codes, and email domains verified',
      'Spelling of employee name and designations confirmed against HR records',
      'Die-line and bleed setup strictly at 85x55mm + 3mm bleed',
      'High-res vector logo used; spot UV and deboss separation plates correctly assigned',
      'CMYK colour balance checked',
    ],
  },
  {
    id: 'mkt-brochures',
    departmentId: 'marketing',
    name: 'Brochures',
    description: 'Corporate product catalogues, capability profiles, and multi-page sales brochures.',
    active: true,
    fields: [
      { id: 'doc_type', label: 'Brochure Type & Page Count', type: 'select', options: ['A4 6-Page Tri-Fold Roll', 'A4 8-Page Saddle Stitched Booklet', 'A4 16-Page Perfect Bound Corporate Profile', 'A5 Multi-page Landscape Brochure'], required: true, section: 'specifications' },
      { id: 'title', label: 'Brochure Title & Subtitle', type: 'text', required: true, section: 'content' },
      { id: 'quantity', label: 'Print Quantity (or Digital PDF only)', type: 'text', placeholder: '2,500 copies or High-Res Interactive PDF', required: true, section: 'specifications' },
      { id: 'content_copy', label: 'Full Body Content & Sections', type: 'textarea', placeholder: 'Section 1: Executive Summary, Section 2: Services, Section 3: Case Studies...', required: true, section: 'content' },
      { id: 'contact_details', label: 'Back Cover Contact Details', type: 'textarea', required: true, section: 'content' },
      { id: 'finish_specs', label: 'Paper Stock & Lamination Finish', type: 'text', placeholder: '250gsm Cover with Velvet Soft-Touch, 150gsm Silk Text', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Print Ready Sign-Off Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Page pagination, running headers, and table of contents numbering verified',
      'CMYK color profile, 300 DPI image resolutions, 3mm bleed, crop marks set',
      'Folds and gutters verified against printer imposition specs',
      'No hyphenation orphans or typographical rivers in body paragraphs',
    ],
  },
  {
    id: 'mkt-flyers',
    departmentId: 'marketing',
    name: 'Flyers',
    description: 'A5/A6 promotional handouts, event inserts, and direct mail leaflets.',
    active: true,
    fields: [
      { id: 'size', label: 'Flyer Format', type: 'select', options: ['A5 Double-Sided (210x148mm)', 'A6 Postcard Flyer (148x105mm)', 'DL Flyer (99x210mm)'], required: true, section: 'specifications' },
      { id: 'headline', label: 'Main Headline', type: 'text', required: true, section: 'content' },
      { id: 'body_copy', label: 'Body Copy & Offer Details', type: 'textarea', required: true, section: 'content' },
      { id: 'cta', label: 'Call To Action & Promo Code', type: 'text', required: true, section: 'content' },
      { id: 'quantity', label: 'Print Run Quantity', type: 'number', placeholder: '5000', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Print Sign-Off Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Offer terms, dates, and redemption mechanisms accurately stated',
      'Correct corporate fonts, logo clarity, and vector artwork',
      'Bleed margins, crop marks, and CMYK color compliance',
    ],
  },
  {
    id: 'mkt-letterheads',
    departmentId: 'marketing',
    name: 'Letterheads',
    description: 'Official corporate stationery, digital Word templates, and invoice header suites.',
    active: true,
    fields: [
      { id: 'company_legal_name', label: 'Company Legal Entity Name & Reg No', type: 'text', required: true, section: 'branding' },
      { id: 'board_directors', label: 'Directors / Legal Footer Listing', type: 'textarea', required: false, section: 'content' },
      { id: 'addresses', label: 'Postal & Physical Addresses', type: 'textarea', required: true, section: 'content' },
      { id: 'deliverable_format', label: 'Output Formats Required', type: 'select', options: ['Print-ready A4 CMYK PDF + Microsoft Word .dotx template', 'Digital Interactive PDF Only', 'Litho Print Run (10,000 sheets on 100gsm Bond)'], required: true, section: 'deliverables' },
      { id: 'deadline', label: 'Required Delivery Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Registration number, VAT number, and legal director names verified with compliance',
      'Word template margins, header/footer locks, and font defaults properly formatted',
      'Print CMYK Pantone spot colors verified',
    ],
  },
  {
    id: 'mkt-booklets',
    departmentId: 'marketing',
    name: 'Booklets',
    description: 'Corporate annual reports, policy handbooks, and conference programmes.',
    active: true,
    fields: [
      { id: 'booklet_title', label: 'Booklet Title & Scope', type: 'text', required: true, section: 'content' },
      { id: 'page_count', label: 'Estimated Page Count (Multiples of 4)', type: 'select', options: ['8 Pages', '12 Pages', '16 Pages', '24 Pages', '32 Pages', '48+ Pages'], required: true, section: 'specifications' },
      { id: 'binding_type', label: 'Binding Style', type: 'select', options: ['Saddle Stitched (Stapled spine)', 'Perfect Bound (Glued spine)', 'Wire-O Bound (Concealed spine)'], required: true, section: 'specifications' },
      { id: 'content_manuscript', label: 'Approved Manuscript Content', type: 'textarea', required: true, section: 'content' },
      { id: 'deadline', label: 'Final Delivery Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Full editorial proofing completed across all pages',
      'Page creep allowances calculated for binding type',
      'High-res vector assets and photographic consistency',
    ],
  },
  {
    id: 'mkt-other',
    departmentId: 'marketing',
    name: 'Other Marketing Request',
    description: 'Custom marketing, exhibition, or bespoke collateral request.',
    active: true,
    fields: [
      { id: 'custom_title', label: 'Request Title & Detailed Scope', type: 'text', required: true, section: 'content' },
      { id: 'detailed_brief', label: 'Complete Brief Description', type: 'textarea', required: true, section: 'content' },
      { id: 'specifications', label: 'Technical Specifications & Formats', type: 'textarea', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Target Completion Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Deliverable aligns fully with supplied custom brief',
      'CI guidelines and logo usage standards upheld',
      'Required formats and source packages packaged accurately',
    ],
  },

  // ================= INCENTIVE TRAVEL =================
  {
    id: 'trv-banners',
    departmentId: 'incentive_travel',
    name: 'Client Branded Incentive Trip Location Banners',
    description: 'Destination teaser headers, launch announcement imagery, and leaderboard trip banners.',
    active: true,
    fields: [
      { id: 'destination', label: 'Trip Destination & Country', type: 'text', placeholder: 'e.g. Dubai & Abu Dhabi, UAE / Swiss Alps Retreat', required: true, section: 'content' },
      { id: 'trip_programme', label: 'Incentive Programme / Campaign Name', type: 'text', placeholder: 'e.g. Peak Performers Club 2026', required: true, section: 'content' },
      { id: 'banner_purpose', label: 'Banner Purpose & Channel', type: 'select', options: ['Intranet Leaderboard Banner', 'Teaser Email Hero Graphic', 'Registration Portal Header (1920x600)', 'Print Event Entrance Banner'], required: true, section: 'specifications' },
      { id: 'title', label: 'Title & Main Hook', type: 'text', placeholder: 'Experience The Luxury of Dubai 2026', required: true, section: 'content' },
      { id: 'subtitle', label: 'Subtitle / Qualifying Dates', type: 'text', placeholder: 'Qualify Jan 1 - Oct 31, 2026 | Top 50 Achievers', required: true, section: 'content' },
      { id: 'destination_imagery', label: 'Destination Imagery Direction', type: 'textarea', placeholder: 'Burj Khalifa skyline at twilight, luxury desert dunes, private yacht marina...', required: true, section: 'branding' },
      { id: 'client_branding', label: 'Client Co-Branding Rules', type: 'textarea', placeholder: 'Client primary logo on top-left, Trip emblem bottom-right...', required: true, section: 'branding' },
      { id: 'sizes', label: 'Dimensions & Aspect Ratios', type: 'text', placeholder: '1920x600px, 1200x628px, 1080x1080px', required: true, section: 'specifications' },
      { id: 'cta_url', label: 'Call to Action / URL', type: 'text', placeholder: 'Discover The Itinerary | https://incentive.client.com', required: false, section: 'deliverables' },
      { id: 'deadline', label: 'Required Delivery Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Destination accuracy verified (correct cultural landmarks, authentic photography)',
      'Client corporate logo and co-branding proportions strictly aligned',
      'Dates, qualification metrics, and trip names accurate',
      'Aspect ratios rendered cleanly for responsive web banners and high-res displays',
    ],
  },
  {
    id: 'trv-website-cms',
    departmentId: 'incentive_travel',
    name: 'Client Branded Incentive Websites — CMS Setup',
    description: 'Turnkey incentive trip portal with full itinerary, registration forms, destination guides, and photo galleries.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client Organization', type: 'text', required: true, section: 'branding' },
      { id: 'trip_programme', label: 'Incentive Trip Programme Name', type: 'text', placeholder: 'e.g. Discovery Quest Mauritius 2026', required: true, section: 'content' },
      { id: 'destination', label: 'Destination & Resort Information', type: 'text', placeholder: 'Le Morne Peninsula, Mauritius - St. Regis Resort', required: true, section: 'content' },
      { id: 'pages_nav', label: 'Pages & Navigation Structure', type: 'textarea', placeholder: 'Home, Destination Overview, Daily Itinerary, Hotel & Amenities, Flights & Transfers, Packing Guide, Registration Form, FAQs', required: true, section: 'specifications' },
      { id: 'approved_content', label: 'Approved Itinerary & Text Manuscript', type: 'textarea', placeholder: 'Paste approved Day 1 to Day 5 itinerary narrative, flight schedules, dress codes...', required: true, section: 'content' },
      { id: 'participant_requirements', label: 'Participant Data Capture Fields', type: 'textarea', placeholder: 'Passport No, Expiry, Dietary, Room preference, Emergency contact, Shirt size...', required: true, section: 'specifications' },
      { id: 'launch_date', label: 'Portal Launch Go-Live Date', type: 'date', required: true, section: 'schedule' },
      { id: 'approver_name', label: 'Client Approver Authority', type: 'text', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Every itinerary day, timing, and venue confirmed against hotel master agreements',
      'Registration form fields securely validate passport dates (6+ months validity check)',
      'Mobile responsive testing completed on iOS and Android viewports',
      'Client CI colours, fonts, and imagery licensing verified',
      'All downloadable travel guides (PDFs) and links operational',
    ],
  },
  {
    id: 'trv-printed-docs',
    departmentId: 'incentive_travel',
    name: 'Client Branded Printed Travel Documents',
    description: 'Complete pre-defined travel document suite from custom wallets, luggage tags, emergency care cards to daily itineraries.',
    active: true,
    fields: [
      { id: 'trip_destination', label: 'Trip Name & Destination', type: 'text', placeholder: 'e.g. Kyoto & Tokyo Autumn Immersion 2026', required: true, section: 'content' },
      { id: 'selected_catalog_items', label: 'Select Predefined Travel Document Item(s)', type: 'multiselect', options: [
        'Wallet inserts', 'Meal Cards', 'DL Envelopes', 'Postcards', 'Emergency Care Cards', 'Bidvest Vouchers',
        'Welcome Notes', 'LAG Bag Inserts', 'Farewell Notes', 'Activity Cards', 'Menus', 'Certificates',
        'Luggage/Gift Tags', 'Companion Lists', 'Paging Boards', 'Travel Brochures', 'Reserved Signs',
        'Itinerary Brochures', 'Tickets Covers', 'Pocket Letters', 'Cash Allowance Cards', 'Document Holders'
      ], required: true, section: 'deliverables' },
      { id: 'document_specifications', label: 'Document Custom Specs & Quantities', type: 'textarea', placeholder: 'e.g. Luggage Tags: 120 units, Itinerary Brochures: 60 units (Square 210mm wire-o), Emergency PVC Cards: 60 units...', required: true, section: 'specifications' },
      { id: 'content_details', label: 'Key Details: Names, Dates, Hotels, Flights, Emergency Contacts', type: 'textarea', placeholder: 'Lead Hotel: Conrad Tokyo, Emergency Leader: Dave +2782..., Local DMC Host: Tanaka San...', required: true, section: 'content' },
      { id: 'finish_diecut', label: 'Die-cut, Fold & Finish Requirements', type: 'textarea', placeholder: 'Gold foil on client logo, soft-touch matte lamination, metallic eyelet for luggage tags...', required: true, section: 'specifications' },
      { id: 'approval_deadline', label: 'Print Proof Sign-Off Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Travel document catalogue specs strictly matched for all selected pieces',
      'Emergency numbers, international country dialing codes (+), and 24/7 hotline tested',
      'Flight numbers, airport terminals, and departure timings cross-checked with airlines',
      'Hotel address in local destination language provided on emergency care cards',
      'All attendee names and spouse names verified against passport manifests',
      'Printer die-lines, bleed (3mm), and CMYK color plates audited for production',
    ],
  },
  {
    id: 'trv-email-templates',
    departmentId: 'incentive_travel',
    name: 'Client Branded Email Templates',
    description: 'HTML travel teaser series, "Pack Your Bags" reminders, flight confirmation notices, and daily recap alerts.',
    active: true,
    fields: [
      { id: 'email_purpose', label: 'Email Phase & Objective', type: 'select', options: ['Trip Teaser & Launch Announcement', '30-Day Countdown & Registration Reminder', 'Flight Schedule & Packing Guide', 'Daily On-Site Schedule Alert', 'Post-Trip Photo Album & Thank You'], required: true, section: 'content' },
      { id: 'subject_line', label: 'Email Subject Line', type: 'text', placeholder: 'Pack Your Bags! 10 Days Until Mauritius 2026', required: true, section: 'content' },
      { id: 'preheader', label: 'Preheader Teaser Text', type: 'text', placeholder: 'Your custom flight itinerary and packing checklist inside...', required: true, section: 'content' },
      { id: 'header_title', label: 'Hero Header Title', type: 'text', required: true, section: 'content' },
      { id: 'body_copy', label: 'Email Body Content', type: 'textarea', required: true, section: 'content' },
      { id: 'cta_button', label: 'Call to Action Button & Link', type: 'text', placeholder: 'View Your Personal Itinerary | https://trip.client.com/my-details', required: true, section: 'deliverables' },
      { id: 'send_date', label: 'Target Broadcast Send Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Email client rendering tested (Outlook desktop, Apple Mail, Gmail dark mode)',
      'Preheader text displays cleanly without truncation or raw code',
      'All CTA button links and personalized tokens ({first_name}) formatted properly',
      'Unsubscribe and legal footer compliance intact',
    ],
  },
  {
    id: 'trv-presentations',
    departmentId: 'incentive_travel',
    name: 'Client Branded Incentive Travel Presentation Templates',
    description: 'High-impact PowerPoint and Keynote master slide decks for client pitch meetings and participant reveal launch events.',
    active: true,
    fields: [
      { id: 'trip_destination', label: 'Destination & Programme Name', type: 'text', required: true, section: 'content' },
      { id: 'presentation_purpose', label: 'Presentation Purpose & Audience', type: 'select', options: ['Client Executive Pitch & Budget Proposal', 'All-Hands Company Trip Reveal Launch Deck', 'Pre-Departure Attendee Briefing Webinar', 'Post-Trip Debrief & ROI Review'], required: true, section: 'content' },
      { id: 'slide_scope', label: 'Required Slide Sections & Structure', type: 'textarea', placeholder: 'Slide 1: Title, Slide 2: The Destination, Slide 3-4: 5-Star Resort, Slide 5-8: Daily VIP Excursions, Slide 9: Logistics & Flights, Slide 10: Qualifying Rules...', required: true, section: 'specifications' },
      { id: 'format_aspect', label: 'Slide Deck Format', type: 'select', options: ['16:9 Widescreen PowerPoint (.pptx) + Master Template', 'Keynote (.key) Presentation', 'Interactive High-Res PDF Deck'], required: true, section: 'specifications' },
      { id: 'deadline', label: 'Required Delivery Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Master slide layouts, custom fonts, and color theme palettes locked in template',
      'High-resolution non-distorted destination photography used throughout',
      'Consistent typography hierarchy across all slide title and content containers',
      'File weight optimized for smooth email distribution and projector playback',
    ],
  },
  {
    id: 'trv-show-reels',
    departmentId: 'incentive_travel',
    name: 'Client Branded Travel Location Show Reels',
    description: 'Cinematic 4K teaser video edits with licensed music, drone footage, motion graphics, and animated client branding.',
    active: true,
    fields: [
      { id: 'destination', label: 'Destination & Country', type: 'text', placeholder: 'e.g. Serengeti Safari & Zanzibar Beach Retreat', required: true, section: 'content' },
      { id: 'objective', label: 'Show Reel Objective', type: 'select', options: ['Gala Dinner Big Reveal Teaser (60-90 sec)', 'Social Media Hype Reel (15-30 sec 9:16 Vertical)', 'In-Depth Itinerary Walkthrough Reel (2-3 min)'], required: true, section: 'specifications' },
      { id: 'duration', label: 'Exact Target Duration', type: 'text', placeholder: '60 seconds', required: true, section: 'specifications' },
      { id: 'sequence_story', label: 'Story & Sequence Flow', type: 'textarea', placeholder: 'Opening: Dramatic drone flyover -> Action: Hot air balloon sunrise -> Luxury: 5-star lodge champagne dinner -> Closing: Animated client logo + 2026 dates...', required: true, section: 'content' },
      { id: 'text_overlays', label: 'Exact Text Overlays & Captions', type: 'textarea', placeholder: 'Overlay 1: "Where Legends Roam", Overlay 2: "Experience Serengeti 2026", End frame: "Will You Be There?"', required: true, section: 'content' },
      { id: 'audio_music', label: 'Audio / Music Soundtrack Style', type: 'text', placeholder: 'Cinematic uplifting orchestral with subtle tribal percussion', required: true, section: 'branding' },
      { id: 'output_format', label: 'Output Resolutions & Formats', type: 'text', placeholder: '4K Ultra HD MP4 (3840x2160 16:9) + 1080x1920 Reel cut', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Final Video Master Sign-Off', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Music soundtrack and stock footage fully licensed for corporate broadcast',
      'Audio leveling: speech/voiceover clear, music ducked properly (-14 LUFS standard)',
      'Client animated logo and vector crests rendered in ultra-sharp resolution',
      'Color grading balanced across distinct video clips; zero frame stutter',
    ],
  },
  {
    id: 'trv-other',
    departmentId: 'incentive_travel',
    name: 'Other Incentive Travel Request',
    description: 'Custom bespoke incentive travel design or travel collateral asset.',
    active: true,
    fields: [
      { id: 'trip_title', label: 'Trip Title & Programme Name', type: 'text', required: true, section: 'content' },
      { id: 'detailed_brief', label: 'Comprehensive Scope of Request', type: 'textarea', required: true, section: 'content' },
      { id: 'specifications', label: 'Specifications & Delivery Formats', type: 'textarea', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Target Sign-Off Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Deliverable aligns fully with supplied custom incentive travel brief',
      'Destination details, dates, and client branding verified',
    ],
  },

  // ================= ONLINE (RAM) =================
  {
    id: 'ram-incentive-websites',
    departmentId: 'online_ram',
    name: 'Client Branded Incentive Websites',
    description: 'Digital participant rewards dashboards, gamified sales sprint leaderboards, and rewards redemption sites.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client Organization', type: 'text', required: true, section: 'branding' },
      { id: 'campaign_name', label: 'Campaign / Programme Name', type: 'text', placeholder: 'e.g. Nissan Apex Challenge 2026', required: true, section: 'content' },
      { id: 'website_purpose', label: 'Portal Primary Purpose', type: 'select', options: ['Gamified Leaderboard & Points Tracking', 'Online Rewards Catalogue & Voucher Checkout', 'Sales Target Submission & Claims Verification', 'Complete Multi-tier Loyalty Portal'], required: true, section: 'specifications' },
      { id: 'pages_nav', label: 'Pages & User Journey', type: 'textarea', placeholder: 'Login, Dashboard Leaderboard, Points Wallet, Rewards Catalogue, Claims, Profile, FAQs', required: true, section: 'content' },
      { id: 'rewards_catalogue', label: 'Rewards Catalogue & Products Scope', type: 'textarea', placeholder: 'Digital vouchers (Takealot, Woolworths), Physical electronics, Travel experiences...', required: true, section: 'deliverables' },
      { id: 'forms_data_fields', label: 'Data Fields & API Integrations', type: 'textarea', placeholder: 'Employee ID, Dealership Code, Target vs Actual Sales, Monthly Tier Calculation...', required: true, section: 'specifications' },
      { id: 'launch_date', label: 'Production Launch Date', type: 'date', required: true, section: 'schedule' },
      { id: 'approver_name', label: 'RAM Department & Client Approver', type: 'text', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'User authentication, session security, and role permissions verified',
      'Points balance calculations, claims tallying, and transaction math audited',
      'Client CI colours, logos, and custom UI components tested for responsive UX',
      'Voucher ordering flow and checkout transactional email alerts verified',
      'Cross-browser compliance (Chrome, Safari, Edge, Firefox)',
    ],
  },
  {
    id: 'ram-presentations',
    departmentId: 'online_ram',
    name: 'Client Branded Presentations',
    description: 'Digital RAM quarterly results reviews, participant engagement analytics, and rewards sprint pitch decks.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client Name', type: 'text', required: true, section: 'branding' },
      { id: 'campaign_name', label: 'Campaign / Programme Title', type: 'text', required: true, section: 'content' },
      { id: 'presentation_purpose', label: 'Presentation Purpose', type: 'select', options: ['Monthly / Quarterly Performance Review', 'Annual Loyalty ROI & Engagement Report', 'New Sprint Rules & Mechanics Pitch'], required: true, section: 'content' },
      { id: 'key_data_metrics', label: 'Key Data & Analytics to Visualize', type: 'textarea', placeholder: 'Active participant rate (87%), Top performing regions, Total points redeemed (R4.2M)...', required: true, section: 'content' },
      { id: 'format', label: 'Slide Presentation Format', type: 'select', options: ['Widescreen 16:9 PowerPoint (.pptx)', 'Interactive Web-based Slide Deck', 'High-Res PDF'], required: true, section: 'specifications' },
      { id: 'deadline', label: 'Delivery Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'All financial figures, charts, and metrics cross-checked with raw database queries',
      'Client corporate brand guidelines strictly applied across slide masters',
      'Chart legends, data labels, and percentage totals calculated accurately',
    ],
  },
  {
    id: 'ram-vouchers',
    departmentId: 'online_ram',
    name: 'Client Branded Vouchers',
    description: 'Digital and printable incentive reward vouchers with unique security codes and merchant branding.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client Brand', type: 'text', required: true, section: 'branding' },
      { id: 'voucher_type', label: 'Voucher Mechanism', type: 'select', options: ['Digital e-Voucher (PDF / Email delivery)', 'Printed Physical Voucher (Security paper)', 'SMS Digital Code Card'], required: true, section: 'specifications' },
      { id: 'title_value', label: 'Voucher Title & Monetary Value', type: 'text', placeholder: 'R2,500 Excellence Reward Voucher', required: true, section: 'content' },
      { id: 'terms_conditions', label: 'Full Terms & Conditions & Expiry Rules', type: 'textarea', placeholder: 'Valid for 12 months from issue date. Redeemable at all participating merchant stores...', required: true, section: 'content' },
      { id: 'unique_code_req', label: 'Unique Security Code / Barcode Format', type: 'text', placeholder: '16-Digit Alpha-numeric with QR Code / Code128 Barcode', required: true, section: 'specifications' },
      { id: 'dimensions', label: 'Dimensions & Format', type: 'text', placeholder: 'Digital 1200x600px PNG or Print 210x99mm DL', required: true, section: 'specifications' },
      { id: 'approval_deadline', label: 'Approval Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Voucher monetary denomination, currency symbol, and expiry date verified',
      'Barcode / QR code scanning tested with standard optical scanner',
      'Terms and conditions legally sound and client approved',
      'Unique sequential code generator algorithm validated',
    ],
  },
  {
    id: 'ram-email-templates',
    departmentId: 'online_ram',
    name: 'Client Branded Email Templates',
    description: 'System transactional emails, monthly points balance statements, sprint launch blasts, and prize winner alerts.',
    active: true,
    fields: [
      { id: 'email_type', label: 'Email Type', type: 'select', options: ['Monthly Points Statement & Balance', 'Sprint Launch / New Challenge Alert', 'Prize Winner Congratulations', 'Account Activation & Password Reset'], required: true, section: 'specifications' },
      { id: 'subject_line', label: 'Subject Line', type: 'text', placeholder: 'Your October Rewards Statement: 15,400 Points Available', required: true, section: 'content' },
      { id: 'preheader', label: 'Preheader Text', type: 'text', placeholder: 'Check your updated leaderboard rank and redeem rewards today', required: true, section: 'content' },
      { id: 'body_copy', label: 'Email HTML Body Copy', type: 'textarea', required: true, section: 'content' },
      { id: 'cta_url', label: 'Primary CTA Button & URL', type: 'text', placeholder: 'Redeem My Points | https://rewards.client.com/login', required: true, section: 'deliverables' },
      { id: 'send_date', label: 'Target Broadcast Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'HTML dynamic merge tags (e.g. {{user.points_balance}}) formatted cleanly',
      'Render tested in dark mode and mobile email clients',
      'All redemption links route through secure authentication tokens',
    ],
  },
  {
    id: 'ram-sprint-banners',
    departmentId: 'online_ram',
    name: 'Client Branded Sprint Banner Creation / Updates',
    description: 'Flash sales contest banners, weekly sprint promotions, and incentive leaderboard carousel sliders.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client / Programme Name', type: 'text', required: true, section: 'branding' },
      { id: 'sprint_name', label: 'Sprint Contest Title', type: 'text', placeholder: 'Double Points Weekend: 19-21 September', required: true, section: 'content' },
      { id: 'title_subtitle', label: 'Main Headline & Tagline', type: 'text', placeholder: 'Sell 3 Units -> Win R5,000 Instant Cash Voucher', required: true, section: 'content' },
      { id: 'cta_destination', label: 'CTA & Target URL', type: 'text', placeholder: 'View Leaderboard | /sprint-challenge', required: true, section: 'deliverables' },
      { id: 'dimensions', label: 'Banner Dimensions', type: 'text', placeholder: 'Portal Hero 1920x550px, Mobile App 800x400px', required: true, section: 'specifications' },
      { id: 'existing_banner', label: 'Is this updating an existing banner?', type: 'select', options: ['New Banner Concept', 'Date / Text Update to Existing Banner', 'Visual Reskin of Existing Campaign'], required: true, section: 'specifications' },
      { id: 'deadline', label: 'Sprint Launch Deadline', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Sprint start and end dates/times match competition rules exactly',
      'Target reward values and qualifying product criteria accurate',
      'Banner dimensions fit portal slider without cropping crucial copy',
    ],
  },
  {
    id: 'ram-catalogue-logos',
    departmentId: 'online_ram',
    name: 'Store Catalogue Logos',
    description: 'Partner retail merchant vector logos prepared and optimized for reward catalogue display.',
    active: true,
    fields: [
      { id: 'client_store', label: 'Client Rewards Portal / Storefront', type: 'text', placeholder: 'Takealot, Woolworths, Hirsch, Flight Centre', required: true, section: 'branding' },
      { id: 'business_name', label: 'Exact Registered Merchant Business Name', type: 'text', required: true, section: 'content' },
      { id: 'preferred_format', label: 'Required Output Specifications', type: 'select', options: ['SVG Vector + 800x600 WebP with Transparent Background', 'White Monochrome Logo on Dark Card (500x300)', 'Square 1:1 App Store Icon Format (512x512)'], required: true, section: 'specifications' },
      { id: 'placement', label: 'Storefront Placement Location', type: 'text', placeholder: 'Category Header / Checkout Tile / Voucher Thumbnail', required: true, section: 'deliverables' },
      { id: 'deadline', label: 'Required Live Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Merchant logo conforms to third-party merchant brand usage guidelines',
      'Transparent PNG/WebP background tested on light and dark UI themes',
      'Pixel dimensions, aspect ratio, and optical centering verified',
    ],
  },
  {
    id: 'ram-birthday-banners',
    departmentId: 'online_ram',
    name: 'Birthday Banners — Names & Participant Pictures',
    description: 'Personalized birthday greetings with employee portraits, client branding, and custom congratulations copy.',
    active: true,
    fields: [
      { id: 'client_programme', label: 'Client / Programme Name', type: 'text', required: true, section: 'branding' },
      { id: 'participant_name', label: 'Participant Full Name & Department', type: 'text', placeholder: 'Sipho Ndlovu - Regional Operations', required: true, section: 'content' },
      { id: 'birthday_date', label: 'Participant Birthday Date', type: 'date', required: true, section: 'schedule' },
      { id: 'message', label: 'Personalized Birthday Message', type: 'textarea', placeholder: 'Wishing you a magnificent birthday filled with joy and success!', required: true, section: 'content' },
      { id: 'photo_quality', label: 'Participant Photo Guidelines', type: 'textarea', placeholder: 'High-res headshot, neutral background, cut out portrait with subtle gradient outline...', required: true, section: 'branding' },
      { id: 'banner_size', label: 'Banner Dimensions & Channel', type: 'text', placeholder: 'Intranet Hero 1200x500px & Digital TV Screen 1920x1080px', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Required Ready Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Participant name spelling, title, and birthday date verified with HR coordinator',
      'Participant headshot cleaned, color balanced, and professionally clipped',
      'Client company co-branding and festive design elements aligned with brand tone',
    ],
  },
  {
    id: 'ram-site-updates',
    departmentId: 'online_ram',
    name: 'Client Site Updates',
    description: 'Content, banner, policy, or UI enhancements across live client incentive portals.',
    active: true,
    fields: [
      { id: 'client_name', label: 'Client Organization', type: 'text', required: true, section: 'branding' },
      { id: 'portal_url', label: 'Portal URL & Target Page', type: 'url', placeholder: 'https://rewards.clientbrand.com/rules', required: true, section: 'branding' },
      { id: 'existing_content', label: 'Current Content / UI Component', type: 'textarea', required: true, section: 'content' },
      { id: 'new_content', label: 'New Approved Content / UI Requirements', type: 'textarea', required: true, section: 'content' },
      { id: 'cta_links', label: 'CTA & Navigation Updates', type: 'text', required: false, section: 'deliverables' },
      { id: 'deadline', label: 'Production Go-Live Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Content text updated accurately without breaking CMS styling',
      'All newly attached PDF downloads, rule sheets, and hyperlinks verified live',
      'Mobile view and tablet layout tested',
    ],
  },
  {
    id: 'ram-other',
    departmentId: 'online_ram',
    name: 'Other Online / RAM Request',
    description: 'Custom digital reward mechanism, custom banner suite, or API request.',
    active: true,
    fields: [
      { id: 'custom_title', label: 'Request Title & Scope', type: 'text', required: true, section: 'content' },
      { id: 'detailed_brief', label: 'Full Technical & Creative Brief', type: 'textarea', required: true, section: 'content' },
      { id: 'specifications', label: 'Specifications & Formats', type: 'textarea', required: true, section: 'specifications' },
      { id: 'deadline', label: 'Target Completion Date', type: 'date', required: true, section: 'schedule' },
    ],
    defaultQaItems: [
      'Deliverable matches custom RAM requirements',
      'Platform compatibility verified',
    ],
  },
];

export function getRequestTypeConfig(id: string): RequestTypeConfig | undefined {
  return REQUEST_TYPES_CONFIG.find((config) => config.id === id);
}

export function getRequestTypesForDepartment(deptId: DepartmentId): RequestTypeConfig[] {
  return REQUEST_TYPES_CONFIG.filter((config) => config.departmentId === deptId && config.active);
}

export interface BriefCompletenessReport {
  score: number;
  isComplete: boolean;
  missingMandatoryFields: string[];
  breakdown: {
    content: { count: number; completed: number; score: number };
    branding: { count: number; completed: number; score: number };
    specifications: { count: number; completed: number; score: number };
    deliverables: { count: number; completed: number; score: number };
    schedule: { count: number; completed: number; score: number };
  };
}

export function calculateBriefCompleteness(
  requestTypeId: string,
  briefData: Record<string, any>
): BriefCompletenessReport {
  const config = getRequestTypeConfig(requestTypeId);
  if (!config) {
    return {
      score: 100,
      isComplete: true,
      missingMandatoryFields: [],
      breakdown: {
        content: { count: 1, completed: 1, score: 100 },
        branding: { count: 1, completed: 1, score: 100 },
        specifications: { count: 1, completed: 1, score: 100 },
        deliverables: { count: 1, completed: 1, score: 100 },
        schedule: { count: 1, completed: 1, score: 100 },
      },
    };
  }

  const sections: Array<'content' | 'branding' | 'specifications' | 'deliverables' | 'schedule'> = [
    'content',
    'branding',
    'specifications',
    'deliverables',
    'schedule',
  ];

  const breakdown: BriefCompletenessReport['breakdown'] = {
    content: { count: 0, completed: 0, score: 100 },
    branding: { count: 0, completed: 0, score: 100 },
    specifications: { count: 0, completed: 0, score: 100 },
    deliverables: { count: 0, completed: 0, score: 100 },
    schedule: { count: 0, completed: 0, score: 100 },
  };

  const missingMandatoryFields: string[] = [];
  let totalFieldsCount = 0;
  let totalCompletedCount = 0;

  for (const field of config.fields) {
    totalFieldsCount++;
    const sec = field.section;
    breakdown[sec].count++;

    const val = briefData[field.id];
    const isFilled =
      val !== undefined &&
      val !== null &&
      val !== '' &&
      (Array.isArray(val) ? val.length > 0 : true);

    if (isFilled) {
      breakdown[sec].completed++;
      totalCompletedCount++;
    } else if (field.required) {
      missingMandatoryFields.push(field.label);
    }
  }

  // Calculate scores per section
  for (const sec of sections) {
    if (breakdown[sec].count > 0) {
      breakdown[sec].score = Math.round(
        (breakdown[sec].completed / breakdown[sec].count) * 100
      );
    } else {
      breakdown[sec].score = 100;
    }
  }

  const overallScore =
    totalFieldsCount > 0
      ? Math.round((totalCompletedCount / totalFieldsCount) * 100)
      : 100;

  const isComplete = missingMandatoryFields.length === 0 && overallScore >= 85;

  return {
    score: overallScore,
    isComplete,
    missingMandatoryFields,
    breakdown,
  };
}
