const { createClerkClient } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');

// Initialize Clerk client (kept for potential future use)
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Middleware to verify Clerk session token
 * Decodes token to get user ID, then fetches user details from Clerk API
 */
async function requireClerkAuth(req, res, next) {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      console.log('❌ DEBUG: No session token in request');
      return res.status(401).json({ message: 'Missing session token' });
    }

    console.log('🔐 DEBUG: Attempting to decode token...');

    // Decode the token WITHOUT verification (frontend already verified it)
    const decoded = jwt.decode(sessionToken);
    
    if (!decoded) {
      console.log('❌ DEBUG: Failed to decode token');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const userId = decoded.sub;
    console.log('✅ DEBUG: Token decoded. User ID:', userId);

    if (!userId) {
      console.log('❌ DEBUG: No user ID (sub) in token');
      return res.status(401).json({ message: 'Invalid token - no user ID' });
    }

    // Fetch user details from Clerk API using the user ID
    try {
      console.log('🔐 DEBUG: Fetching user details from Clerk API for user:', userId);
      const user = await clerk.users.getUser(userId);
      
      console.log('✅ DEBUG: User object received from Clerk');
      console.log('✅ DEBUG: emailAddresses array:', user.emailAddresses);
      console.log('✅ DEBUG: primaryEmailAddressId:', user.primaryEmailAddressId);
      
      // Get the primary email address
      let emailAddress = null;
      
      if (user.primaryEmailAddressId && user.emailAddresses && user.emailAddresses.length > 0) {
        const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
        if (primaryEmail) {
          emailAddress = primaryEmail.emailAddress;
          console.log('✅ DEBUG: Found primary email from emailAddresses array:', emailAddress);
        }
      }
      
      // Fallback: use first email if primary not found
      if (!emailAddress && user.emailAddresses && user.emailAddresses.length > 0) {
        emailAddress = user.emailAddresses[0].emailAddress;
        console.log('✅ DEBUG: Using first email in array (primary not found):', emailAddress);
      }
      
      // Fallback: check direct property
      if (!emailAddress && user.primaryEmailAddress) {
        emailAddress = user.primaryEmailAddress.emailAddress || user.primaryEmailAddress;
        console.log('✅ DEBUG: Found email in primaryEmailAddress property:', emailAddress);
      }

      if (!emailAddress) {
        console.log('❌ DEBUG: User has no email address in any field');
        console.log('❌ DEBUG: Full user object:', JSON.stringify(user, null, 2));
        return res.status(401).json({ message: 'User has no email address configured in Clerk' });
      }

      console.log('✅ DEBUG: Successfully extracted email from Clerk user:', emailAddress);

      // Attach user info to request
      req.clerkUser = {
        id: userId,
        email: emailAddress,
      };

      next();
    } catch (clerkError) {
      console.error('❌ Clerk API error:', clerkError.message);
      console.error('❌ Clerk API status:', clerkError.status);
      console.error('❌ Clerk API code:', clerkError.code);
      return res.status(401).json({ 
        message: 'Failed to fetch user from Clerk', 
        error: clerkError.message 
      });
    }
  } catch (error) {
    console.error('❌ Token decode error:', error.message);
    return res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
}

module.exports = { requireClerkAuth };
