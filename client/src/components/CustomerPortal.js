import React, { useEffect, useState } from 'react';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { Package, LogOut, ArrowLeft, User, Calendar } from 'lucide-react';
import BookingModal from './BookingModal';
import CustomerAppointments from './CustomerAppointments';

/**
 * CustomerLoginScreen Component - Custom Sign-In Flow
 * Built with Clerk's useSignIn hook for complete layout control
 */
export function CustomerLoginScreen({ onLoginSuccess, onBack }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState('email'); // email | verify
  const [emailAddress, setEmailAddress] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signInAttempt, setSignInAttempt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSignedIn && user) {
      onLoginSuccess(user);
    }
  }, [isSignedIn, user, onLoginSuccess]);

  // STEP 1: Send email code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsSubmitting(true);
    setError('');

    try {
      const attempt = await signIn.create({
        identifier: emailAddress,
      });

      if (attempt.status === 'needs_first_factor') {
        const emailFactor = attempt.supportedFirstFactors.find(
          (factor) => factor.strategy === 'email_code'
        );

        await attempt.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });

        setSignInAttempt(attempt);
        setStep('verify');
      }

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Failed to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify email code
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!signInAttempt) return;

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signInAttempt.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      } else {
        setError('Invalid or expired code.');
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="h-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col justify-start p-4">
      <div className="w-full max-w-md mx-auto">
        
        {step === 'email' && (
          <>
            <h1 className="text-2xl font-bold text-center mb-6">Enter your email address</h1>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-4 py-3 border-2 rounded-xl"
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold"
              >
                {isSubmitting ? 'Sending code…' : 'Continue'}
              </button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">
              Enter verification code
            </h1>
            <p className="text-center text-gray-600 mb-6">
              We sent a 6-digit code to <strong>{emailAddress}</strong>
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-6">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                required
                className="w-full px-4 py-3 border-2 rounded-xl text-center tracking-widest text-lg"
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold"
              >
                {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-purple-600"
              >
                Use a different email
              </button>
            </form>
          </>
        )}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Don’t have an account?{' '}
            <span className="text-purple-600 font-medium">
              Contact your salon to get started
            </span>
          </p>
        </div>
        {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Secured by <span className="font-semibold text-gray-700">Clerk</span>
        </p>
      </div>
      </div>
    </div>
  );
}
/**
 * CustomerPortalApp Component
 * Dashboard after successful login
 */
export function CustomerPortalApp({ clerkUser, onLogout }) {
  const [customer, setCustomer] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [bookingSubscription, setBookingSubscription] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewAppointments, setViewAppointments] = useState(false);

  const { getToken, signOut } = useAuth();

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();

        if (!token) {
          setError('Failed to get authentication token');
          return;
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/customer/me`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('No customer found with this email. Please contact your salon.');
            return;
          }
          setError('Failed to load customer profile');
          return;
        }

        const data = await response.json();
        setCustomer(data.customer);
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error('Error fetching customer profile:', err);
        setError('Failed to load customer profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (clerkUser) {
      fetchCustomerProfile();
    }
  }, [clerkUser, getToken]);
  
  const handleSubscriptionClick = async (sub) => {
    try {
      setDetailLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Failed to get authentication token');
        return;
      }
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/customer/subscriptions/${sub.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        setError('Failed to load subscription details');
        return;
      }
      const detailedSub = await response.json();
      setSelectedSubscription(detailedSub);
    } catch (err) {
      setError('An error occurred while fetching subscription details.');
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <LogOut className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-medium shadow-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Appointments view
  if (viewAppointments && customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto p-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setViewAppointments(false)}
              className="text-purple-600 hover:text-purple-700 flex items-center gap-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subscriptions
            </button>
          </div>
          <CustomerAppointments customerId={customer.id} />
        </div>
      </div>
    );
  }

  // Subscription detail view
  if (selectedSubscription) {
    const visits = selectedSubscription.visits || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-4xl mx-auto p-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            <button
              onClick={() => setSelectedSubscription(null)}
              className="text-purple-600 hover:text-purple-700 mb-6 flex items-center gap-2 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subscriptions
            </button>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {selectedSubscription.name}
            </h2>
            <p className="text-lg font-semibold text-purple-600 mb-8">
              at {selectedSubscription.salonName}
            </p>
            
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span className="font-medium">Progress</span>
                <span className="font-semibold">
                  {selectedSubscription.usedVisits} / {selectedSubscription.totalVisits} visits
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (selectedSubscription.usedVisits / selectedSubscription.totalVisits) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Total Visits</p>
                <p className="text-3xl font-bold text-purple-600">
                  {selectedSubscription.totalVisits}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Used</p>
                <p className="text-3xl font-bold text-blue-600">
                  {selectedSubscription.usedVisits}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                <p className="text-sm text-gray-600 font-medium mb-1">Remaining</p>
                <p className="text-3xl font-bold text-green-600">
                  {selectedSubscription.remainingVisits}
                </p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Visit History
            </h3>
            
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => {
                  if (selectedSubscription && !detailLoading) {
                    setBookingSubscription(selectedSubscription);
                    setShowBookingModal(true);
                  } else if (!selectedSubscription) {
                    setError('Please select a subscription first');
                  }
                }}
                disabled={!selectedSubscription || detailLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                {detailLoading ? 'Loading...' : 'Book Visit'}
              </button>
              <button
                onClick={() => setSelectedSubscription(null)}
                className="py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Back
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Visit History
            </h3>
            
            {detailLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading visit history...</p>
              </div>
            ) : visits.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No visits yet</p>
                <p className="text-gray-400 text-sm mt-2">Your visit history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visits
                  .slice()
                  .reverse()
                  .map((visit, idx) => (
                    <div key={visit.id} className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                          <span className="text-white font-bold">
                            {visits.length - idx}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg">
                          Visit {visits.length - idx}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(visit.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {visit.note && (
                          <div className="mt-3 p-3 bg-white border-l-4 border-blue-500 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-gray-900">Note: </span>
                              {visit.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setBookingSubscription(null);
          }}
          subscription={bookingSubscription}
          customerId={customer?.id}
          salonId={bookingSubscription?.salonId}
        />
      </div>
    );
  }

  // Main subscriptions list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">My Subscriptions</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewAppointments(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium"
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden sm:inline">Appointments</span>
            </button>
            <button
              onClick={() => signOut({ redirectUrl: '/' })}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {customer?.name || 'Customer'}! 👋
          </h2>
          <p className="text-gray-600">
            Track your subscription packages and visit history below
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-900 text-xl font-bold mb-2">No active subscriptions</p>
            <p className="text-gray-500">
              Contact your salon to purchase a package and get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
                onClick={() => handleSubscriptionClick(sub)}
              >
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-sm font-semibold text-purple-600 mt-1">{sub.salonName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Started {new Date(sub.startDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                    <span>Progress</span>
                    <span>
                      {sub.usedVisits} / {sub.totalVisits}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(sub.usedVisits / sub.totalVisits) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-bold text-purple-600">
                      {sub.remainingVisits}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">visits remaining</p>
                  </div>
                  {sub.remainingVisits === 0 ? (
                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      Completed
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      Active
                    </span>
                  )}
                </div>

                <button className="w-full mt-5 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg group-hover:shadow-xl">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default CustomerLoginScreen;
