/**
 * Validation Middleware
 * Validates incoming request data before processing
 */

export function validateSignup(data) {
  if (!data.name || data.name.trim().length < 2) {
    return 'Name must be at least 2 characters';
  }
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    return 'Valid email is required';
  }
  if (!data.password || data.password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (data.role && !['admin', 'agent'].includes(data.role)) {
    return 'Role must be admin or agent';
  }
  return null;
}

export function validateLead(data) {
  if (!data.name || data.name.trim().length < 2) {
    return 'Client name must be at least 2 characters';
  }
  if (!data.phone || data.phone.trim().length < 7) {
    return 'Valid phone number is required';
  }
  if (!data.propertyInterest) {
    return 'Property interest is required';
  }
  const validInterests = ['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Other'];
  if (!validInterests.includes(data.propertyInterest)) {
    return 'Invalid property interest type';
  }
  if (data.budget === undefined || data.budget === null || isNaN(Number(data.budget))) {
    return 'Valid budget is required';
  }
  if (Number(data.budget) < 0) {
    return 'Budget cannot be negative';
  }
  if (data.status) {
    const validStatuses = ['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'];
    if (!validStatuses.includes(data.status)) {
      return 'Invalid status value';
    }
  }
  return null;
}

export function validateQueryParams(searchParams, allowedParams) {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    if (allowedParams.includes(key)) {
      params[key] = value;
    }
  }
  return params;
}
