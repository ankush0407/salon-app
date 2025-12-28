const { createClerkClient } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Middleware to verify Clerk session token
 * Decodes JWT to get user ID, then fetches user details from Clerk API
 */
async function requireClerkAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ message: 'Missing session token' });
    }

    // Decode token (Clerk token, already verified by Clerk SDK)
    const decoded = jwt.decode(sessionToken);
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Fetch user from Clerk API
    const user = await clerk.users.getUser(decoded.sub);
    
    // Extract email from emailAddresses array
    let emailAddress = null;
    if (user.primaryEmailAddressId && user.emailAddresses?.length > 0) {
      const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
      emailAddress = primaryEmail?.emailAddress;
    }
    if (!emailAddress && user.emailAddresses?.length > 0) {
      emailAddress = user.emailAddresses[0].emailAddress;
    }

    if (!emailAddress) {
      return res.status(401).json({ message: 'User has no email configured in Clerk' });
    }

    // Attach user info to request
    req.clerkUser = { id: decoded.sub, email: emailAddress };
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

module.exports = { requireClerkAuth };
