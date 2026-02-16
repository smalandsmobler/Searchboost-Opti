/**
 * EduAdmin API Integration
 *
 * OData v4.0 API for course management system used by Kompetensutveckla.se
 * Auth: OAuth2 password grant -> Bearer token (24h TTL)
 * Base URL: https://api.eduadmin.se
 * Docs: https://api.eduadmin.se/?page=read
 *
 * SSM params:
 *   /seo-mcp/integrations/{customerId}/eduadmin-api-username
 *   /seo-mcp/integrations/{customerId}/eduadmin-api-password
 */

const https = require('https');

// Token cache per customer
const tokenCache = {};

/**
 * Get or refresh OAuth2 bearer token
 */
async function getToken(username, password) {
  const cacheKey = username;
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.token;
  }

  return new Promise((resolve, reject) => {
    const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&grant_type=password`;
    const options = {
      hostname: 'api.eduadmin.se',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            tokenCache[cacheKey] = {
              token: json.access_token,
              expiresAt: Date.now() + (json.expires_in * 1000)
            };
            resolve(json.access_token);
          } else {
            reject(new Error(`EduAdmin auth failed: ${data}`));
          }
        } catch (e) {
          reject(new Error(`EduAdmin auth parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Make OData GET request
 */
async function odataGet(token, odataPath) {
  return new Promise((resolve, reject) => {
    // Split entity from query params to encode properly
    const qIdx = odataPath.indexOf('?');
    let fullPath;
    if (qIdx >= 0) {
      const entity = odataPath.substring(0, qIdx);
      const queryStr = odataPath.substring(qIdx + 1);
      // Parse and re-encode query params
      const params = new URLSearchParams(queryStr);
      fullPath = `/v1/odata/${entity}?${params.toString()}`;
    } else {
      fullPath = `/v1/odata/${odataPath}`;
    }
    const options = {
      hostname: 'api.eduadmin.se',
      path: fullPath,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`EduAdmin parse error: ${e.message} — ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Get all categories
 */
async function getCategories(username, password) {
  const token = await getToken(username, password);
  const data = await odataGet(token, 'Categories?$orderby=CategoryName');
  return (data.value || []).map(c => ({
    id: c.CategoryId,
    name: c.CategoryName,
    showOnWeb: c.ShowOnWeb,
    parentId: c.ParentCategoryId || null
  }));
}

/**
 * Get all course templates with prices
 */
async function getCourseTemplates(username, password, { showOnWebOnly = true } = {}) {
  const token = await getToken(username, password);
  let filter = showOnWebOnly ? "&$filter=ShowOnWeb eq true" : "";
  const data = await odataGet(token,
    `CourseTemplates?$expand=PriceNames&$select=CourseTemplateId,CourseName,InternalCourseName,CourseDescriptionShort,CategoryId,CategoryName,ImageUrl,Days,StartTime,EndTime,MaxParticipantNumber,OnDemand,OnDemandAccessDays,ShowOnWeb,Created,Modified&$orderby=CourseName${filter}`
  );
  return (data.value || []).map(ct => ({
    id: ct.CourseTemplateId,
    name: ct.CourseName,
    internalName: ct.InternalCourseName,
    shortDescription: stripHtml(ct.CourseDescriptionShort || ''),
    categoryId: ct.CategoryId,
    categoryName: ct.CategoryName,
    imageUrl: ct.ImageUrl,
    days: ct.Days,
    startTime: ct.StartTime,
    endTime: ct.EndTime,
    maxParticipants: ct.MaxParticipantNumber,
    onDemand: ct.OnDemand,
    onDemandAccessDays: ct.OnDemandAccessDays,
    showOnWeb: ct.ShowOnWeb,
    created: ct.Created,
    modified: ct.Modified,
    prices: (ct.PriceNames || []).map(p => ({
      description: p.PriceNameDescription,
      price: p.Price,
      vat: p.PriceNameVat,
      isPublic: p.PublicPriceName,
      isGroupPrice: p.GroupPrice
    }))
  }));
}

/**
 * Get single course template with full details
 */
async function getCourseTemplate(username, password, courseTemplateId) {
  const token = await getToken(username, password);
  const data = await odataGet(token,
    `CourseTemplates(${courseTemplateId})?$expand=PriceNames`
  );
  if (!data.CourseTemplateId) return null;
  return {
    id: data.CourseTemplateId,
    name: data.CourseName,
    internalName: data.InternalCourseName,
    description: stripHtml(data.CourseDescription || ''),
    shortDescription: stripHtml(data.CourseDescriptionShort || ''),
    goal: stripHtml(data.CourseGoal || ''),
    targetGroup: stripHtml(data.TargetGroup || ''),
    prerequisites: stripHtml(data.Prerequisites || ''),
    courseAfter: stripHtml(data.CourseAfter || ''),
    categoryId: data.CategoryId,
    categoryName: data.CategoryName,
    imageUrl: data.ImageUrl,
    days: data.Days,
    startTime: data.StartTime,
    endTime: data.EndTime,
    maxParticipants: data.MaxParticipantNumber,
    onDemand: data.OnDemand,
    onDemandAccessDays: data.OnDemandAccessDays,
    showOnWeb: data.ShowOnWeb,
    created: data.Created,
    modified: data.Modified,
    prices: (data.PriceNames || []).map(p => ({
      description: p.PriceNameDescription,
      price: p.Price,
      vat: p.PriceNameVat,
      isPublic: p.PublicPriceName,
      isGroupPrice: p.GroupPrice
    }))
  };
}

/**
 * Get upcoming events (course instances) with prices
 */
async function getUpcomingEvents(username, password, { daysAhead = 90, top = 500 } = {}) {
  const token = await getToken(username, password);
  const now = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

  const data = await odataGet(token,
    `Events?$filter=StartDate gt ${now}T00:00:00Z and StartDate lt ${future}T00:00:00Z and ShowOnWeb eq true&$expand=PriceNames&$select=EventId,EventName,CourseTemplateId,CategoryName,StartDate,EndDate,City,NumberOfBookedParticipants,MaxParticipantNumber,StatusText,BookingFormUrl,OnDemand&$orderby=StartDate&$top=${top}`
  );

  return (data.value || []).map(e => ({
    id: e.EventId,
    name: e.EventName,
    courseTemplateId: e.CourseTemplateId,
    categoryName: e.CategoryName,
    startDate: e.StartDate,
    endDate: e.EndDate,
    city: e.City,
    bookedParticipants: e.NumberOfBookedParticipants,
    maxParticipants: e.MaxParticipantNumber,
    status: e.StatusText,
    bookingUrl: e.BookingFormUrl,
    onDemand: e.OnDemand,
    prices: (e.PriceNames || []).filter(p => p.PublicPriceName).map(p => ({
      description: p.PriceNameDescription,
      price: p.Price,
      vat: p.PriceNameVat
    }))
  }));
}

/**
 * Get on-demand (e-learning) courses
 */
async function getOnDemandCourses(username, password) {
  const token = await getToken(username, password);
  const data = await odataGet(token,
    `Events?$filter=OnDemand eq true and ShowOnWeb eq true&$expand=PriceNames&$select=EventId,EventName,CourseTemplateId,CategoryName,OnDemandAccessDays,NumberOfBookedParticipants,BookingFormUrl&$orderby=EventName`
  );

  return (data.value || []).map(e => ({
    id: e.EventId,
    name: e.EventName,
    courseTemplateId: e.CourseTemplateId,
    categoryName: e.CategoryName,
    accessDays: e.OnDemandAccessDays,
    bookedParticipants: e.NumberOfBookedParticipants,
    bookingUrl: e.BookingFormUrl,
    prices: (e.PriceNames || []).filter(p => p.PublicPriceName).map(p => ({
      description: p.PriceNameDescription,
      price: p.Price,
      vat: p.PriceNameVat
    }))
  }));
}

/**
 * Get recent bookings
 */
async function getRecentBookings(username, password, { daysBack = 30, top = 100 } = {}) {
  const token = await getToken(username, password);
  const since = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];

  const data = await odataGet(token,
    `Bookings?$filter=BookingDate gt ${since}T00:00:00Z&$select=BookingId,EventId,TotalPriceExVat,TotalPriceIncVat,NumberOfParticipants,Created,BookingDate,Paid,Preliminary&$orderby=BookingDate desc&$top=${top}`
  );

  return (data.value || []).map(b => ({
    id: b.BookingId,
    eventId: b.EventId,
    priceExVat: b.TotalPriceExVat,
    priceIncVat: b.TotalPriceIncVat,
    participants: b.NumberOfParticipants,
    bookingDate: b.BookingDate,
    created: b.Created,
    paid: b.Paid,
    preliminary: b.Preliminary
  }));
}

/**
 * Get booking statistics summary
 */
async function getBookingStats(username, password, { daysBack = 90 } = {}) {
  const bookings = await getRecentBookings(username, password, { daysBack, top: 1000 });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.priceExVat || 0), 0);
  const totalParticipants = bookings.reduce((sum, b) => sum + (b.participants || 0), 0);
  const paidCount = bookings.filter(b => b.paid).length;
  const unpaidCount = bookings.filter(b => !b.paid).length;

  return {
    period: `${daysBack} dagar`,
    totalBookings: bookings.length,
    totalRevenue: Math.round(totalRevenue),
    totalParticipants,
    paidBookings: paidCount,
    unpaidBookings: unpaidCount,
    avgRevenuePerBooking: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0
  };
}

/**
 * Get locations
 */
async function getLocations(username, password) {
  const token = await getToken(username, password);
  const data = await odataGet(token,
    'Locations?$select=LocationId,LocationName,City,AddressName&$orderby=LocationName'
  );
  return (data.value || []).map(l => ({
    id: l.LocationId,
    name: l.LocationName,
    city: l.City,
    address: l.AddressName
  }));
}

/**
 * Get personnel (teachers/instructors)
 */
async function getPersonnel(username, password) {
  const token = await getToken(username, password);
  const data = await odataGet(token,
    'Personnel?$select=PersonnelId,FirstName,LastName,Email,Phone&$orderby=LastName'
  );
  return (data.value || []).map(p => ({
    id: p.PersonnelId,
    firstName: p.FirstName,
    lastName: p.LastName,
    email: p.Email,
    phone: p.Phone
  }));
}

/**
 * Get full dashboard summary — everything needed for the portal/dashboard
 */
async function getDashboardSummary(username, password) {
  const [categories, courses, upcomingEvents, onDemand, bookingStats] = await Promise.all([
    getCategories(username, password),
    getCourseTemplates(username, password),
    getUpcomingEvents(username, password, { daysAhead: 90 }),
    getOnDemandCourses(username, password),
    getBookingStats(username, password, { daysBack: 30 })
  ]);

  // Aggregate cities
  const cities = [...new Set(upcomingEvents.map(e => e.city).filter(Boolean))].sort();

  // Category breakdown
  const categoryBreakdown = {};
  for (const e of upcomingEvents) {
    const cat = e.categoryName || 'Okand';
    if (!categoryBreakdown[cat]) categoryBreakdown[cat] = 0;
    categoryBreakdown[cat]++;
  }

  return {
    overview: {
      totalCourseTemplates: courses.length,
      totalUpcomingEvents: upcomingEvents.length,
      totalOnDemandCourses: onDemand.length,
      totalCategories: categories.filter(c => c.showOnWeb).length,
      totalCities: cities.length,
      cities
    },
    bookingStats,
    categoryBreakdown,
    // Top 10 most booked upcoming events
    popularEvents: upcomingEvents
      .filter(e => e.bookedParticipants > 0)
      .sort((a, b) => b.bookedParticipants - a.bookedParticipants)
      .slice(0, 10),
    // Events filling up (>75% full)
    fillingUp: upcomingEvents
      .filter(e => e.maxParticipants && e.bookedParticipants / e.maxParticipants > 0.75)
      .sort((a, b) => (b.bookedParticipants / b.maxParticipants) - (a.bookedParticipants / a.maxParticipants)),
    // Price range
    priceRange: {
      min: Math.min(...courses.flatMap(c => c.prices.filter(p => p.isPublic && p.price > 0).map(p => p.price))),
      max: Math.max(...courses.flatMap(c => c.prices.filter(p => p.isPublic).map(p => p.price))),
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  getToken,
  getCategories,
  getCourseTemplates,
  getCourseTemplate,
  getUpcomingEvents,
  getOnDemandCourses,
  getRecentBookings,
  getBookingStats,
  getLocations,
  getPersonnel,
  getDashboardSummary
};
